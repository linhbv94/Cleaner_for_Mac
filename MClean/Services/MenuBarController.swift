import AppKit
import SwiftUI
import Combine

/// Captures SwiftUI's `openWindow` action so AppKit surfaces (such as the menu-bar
/// popover) can reopen the main window after it has been closed.
@MainActor
final class WindowOpener {
    static let shared = WindowOpener()
    var open: ((String) -> Void)?
    private init() {}
}

/// Global window manager tracking explicit window references and capture hooks
/// for consistent lifecycle management and activation.
@MainActor
final class AppWindowManager {
    static let shared = AppWindowManager()
    weak var mainWindow: NSWindow?
    weak var settingsWindow: NSWindow?
    var openSettingsAction: (() -> Void)?
    private init() {}
}

/// Keeps a quick action alive while SwiftUI recreates the main window. A
/// notification handles the already-open case; this flag handles the short
/// gap between `openWindow` and `MainWindow.onAppear`.
@MainActor
enum MenuBarQuickActionBuffer {
    static var smartScanRequested = false
}

/// NSViewRepresentable helper that captures SwiftUI's `openWindow` action into
/// `WindowOpener.shared` and firmly tags the main window with `vxclean.main`.
struct MainWindowLifecycleCapture: NSViewRepresentable {
    @Environment(\.openWindow) private var openWindow

    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        DispatchQueue.main.async { [weak view] in
            guard let window = view?.window else { return }
            window.identifier = MenuBarController.mainWindowIdentifier
            AppWindowManager.shared.mainWindow = window
        }
        return view
    }

    func updateNSView(_ nsView: NSView, context: Context) {
        WindowOpener.shared.open = { id in openWindow(id: id) }
        DispatchQueue.main.async { [weak nsView] in
            guard let window = nsView?.window else { return }
            window.identifier = MenuBarController.mainWindowIdentifier
            AppWindowManager.shared.mainWindow = window
        }
    }
}

/// Backwards compatibility alias for WindowOpenerCapture
typealias WindowOpenerCapture = MainWindowLifecycleCapture

/// NSViewRepresentable helper that tags the Settings window with `vxclean.settings`.
struct SettingsLifecycleCapture: NSViewRepresentable {
    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        DispatchQueue.main.async { [weak view] in
            guard let window = view?.window else { return }
            window.identifier = MenuBarController.settingsWindowIdentifier
            AppWindowManager.shared.settingsWindow = window
        }
        return view
    }

    func updateNSView(_ nsView: NSView, context: Context) {
        DispatchQueue.main.async { [weak nsView] in
            guard let window = nsView?.window else { return }
            window.identifier = MenuBarController.settingsWindowIdentifier
            AppWindowManager.shared.settingsWindow = window
        }
    }
}

/// AppKit-backed menu-bar system monitor. Uses NSStatusItem driving an NSPopover
/// hosting MenuBarMonitorView for fine-grained lifecycle control and zero test-host impact.
@MainActor
final class MenuBarController: NSObject, NSPopoverDelegate {
    static let mainWindowIdentifier = NSUserInterfaceItemIdentifier("vxclean.main")
    static let settingsWindowIdentifier = NSUserInterfaceItemIdentifier("vxclean.settings")

    private let statusItem: NSStatusItem
    private let popover = NSPopover()
    private let monitor = SystemMonitor.shared
    private var cancellable: AnyCancellable?
    private var detailSamplingActive = false

    private func setDetailSamplingActive(_ active: Bool) {
        guard detailSamplingActive != active else { return }
        detailSamplingActive = active
        if active {
            monitor.startDetail()
        } else {
            monitor.stopDetail()
        }
    }

    override init() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        super.init()

        // Persist the user's show/hide choice under the VXClean namespace.
        statusItem.autosaveName = "VXCleanSystemMonitor"
        statusItem.isVisible = true

        monitor.start()

        if let button = statusItem.button {
            let image = NSImage(named: "MenuBarIcon") ?? NSImage(
                systemSymbolName: "sparkles",
                accessibilityDescription: nil
            )
            image?.isTemplate = true
            image?.size = NSSize(width: 18, height: 18)
            button.image = image
            button.imagePosition = .imageOnly
            button.imageScaling = .scaleProportionallyDown
            button.setAccessibilityLabel("VXClean")
            button.target = self
            button.action = #selector(togglePopover)
            updateAccessibilityStatus()
        }

        popover.behavior = .transient
        popover.animates = true
        let host = NSHostingController(
            rootView: MenuBarMonitorView(
                onSmartScan: { [weak self] in self?.startSmartScan() },
                onOpenApp: { [weak self] in self?.openMainWindow() },
                onOpenSettings: { [weak self] in self?.openSettings() },
                onQuit: { NSApp.terminate(nil) }
            )
        )
        popover.contentViewController = host
        // Set popover width to 380pt
        popover.contentSize = host.sizeThatFits(in: NSSize(width: 380, height: 600))
        popover.delegate = self

        // Keep VoiceOver and the hover tooltip informative without changing
        // the status item's width every time the CPU percentage changes.
        cancellable = monitor.$cpuUsage
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in self?.updateAccessibilityStatus() }
    }

    /// Remove the status item and release the monitor observer.
    func teardown() {
        setDetailSamplingActive(false)
        cancellable?.cancel()
        cancellable = nil
        if popover.isShown { popover.performClose(nil) }
        NSStatusBar.system.removeStatusItem(statusItem)
        monitor.stop()
    }

    // MARK: - NSPopoverDelegate

    func popoverWillShow(_ notification: Notification) {
        setDetailSamplingActive(true)
    }

    func popoverDidClose(_ notification: Notification) {
        setDetailSamplingActive(false)
    }

    private func updateAccessibilityStatus() {
        guard let button = statusItem.button else { return }
        let percent = Int((monitor.cpuUsage * 100).rounded())
        let status = String(format: String(localized: "CPU %lld%%"), Int64(percent))
        button.toolTip = "VXClean · \(status)"
        button.setAccessibilityValue(status)
    }

    @objc private func togglePopover() {
        guard let button = statusItem.button else { return }
        if popover.isShown {
            popover.performClose(nil)
        } else {
            popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
            popover.contentViewController?.view.window?.makeKey()
        }
    }

    private func startSmartScan() {
        MenuBarQuickActionBuffer.smartScanRequested = true
        closePopover()
        presentMainWindow()
        NotificationCenter.default.post(name: .vxCleanSmartScanRequested, object: nil)
    }

    private func openMainWindow() {
        closePopover()
        presentMainWindow()
    }

    func openSettings() {
        closePopover()
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)

        // Check if settings window already exists with our identifier
        if let existing = NSApp.windows.first(where: { $0.identifier == Self.settingsWindowIdentifier }) {
            if existing.isMiniaturized { existing.deminiaturize(nil) }
            existing.makeKeyAndOrderFront(nil)
            return
        }

        if let open = AppWindowManager.shared.openSettingsAction {
            open()
            return
        }

        // Route through standard AppKit responder-chain action
        let opened = NSApp.sendAction(
            Selector(("showSettingsWindow:")), to: nil, from: nil
        )
        if !opened {
            NSApp.sendAction(Selector(("showPreferencesWindow:")), to: nil, from: nil)
        }
    }

    private func closePopover() {
        if popover.isShown { popover.performClose(nil) }
    }

    func presentMainWindow() {
        NSApp.setActivationPolicy(.regular)

        // Identify the main window specifically by its identifier, avoiding Settings
        let targetWindow: NSWindow? = {
            if let win = AppWindowManager.shared.mainWindow, win.identifier == Self.mainWindowIdentifier {
                return win
            }
            return NSApp.windows.first { $0.identifier == Self.mainWindowIdentifier }
        }()

        if let window = targetWindow {
            if window.isMiniaturized {
                window.deminiaturize(nil)
            }
            window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
        } else {
            WindowOpener.shared.open?("main")
            NSApp.activate(ignoringOtherApps: true)
        }
    }
}
