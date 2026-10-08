import AppKit
import SwiftUI

@MainActor
class AppDelegate: NSObject, NSApplicationDelegate {
    /// Owns the optional menu-bar status item. Nil until the monitor is enabled.
    private var menuBarController: MenuBarController?

    /// Normally VXClean quits when its window closes. When the menu-bar system
    /// monitor is enabled the app stays resident so the meters keep updating in
    /// the menu bar; "Open VXClean" in that menu reopens the window.
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        !UserDefaults.standard.bool(forKey: "settings.general.menuBarMonitor")
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSWindow.allowsAutomaticWindowTabbing = false

        // The status item is a core quick-access surface for new installs.
        UserDefaults.standard.register(defaults: [
            "settings.general.menuBarMonitor": true,
        ])

        // Install the menu-bar monitor if enabled. Never under XCTest.
        if NSClassFromString("XCTestCase") == nil {
            syncMenuBarMonitor()
            NotificationCenter.default.addObserver(
                self, selector: #selector(syncMenuBarMonitor),
                name: .vxCleanMenuBarMonitorChanged, object: nil
            )
            // Lifecycle observers: handle window closing and becoming active
            NotificationCenter.default.addObserver(
                self, selector: #selector(handleWindowWillClose(_:)),
                name: NSWindow.willCloseNotification, object: nil
            )
            NotificationCenter.default.addObserver(
                self, selector: #selector(handleWindowDidBecomeKey(_:)),
                name: NSWindow.didBecomeKeyNotification, object: nil
            )
        }

        // Touch TCC-protected paths so macOS registers VXClean in the
        // Full Disk Access pane on first launch.
        FullDiskAccessManager.shared.triggerRegistration()

        // Register the Finder Services provider so "Uninstall with VXClean"
        // appears when an .app bundle is right-clicked.
        NSApp.servicesProvider = self
        NSUpdateDynamicServices()
    }

    // MARK: - Lifecycle Management

    @objc private func handleWindowWillClose(_ notification: Notification) {
        guard NSClassFromString("XCTestCase") == nil else { return }
        // Defer window close handling on main queue after window finishes closing
        DispatchQueue.main.async { [weak self] in
            self?.updateActivationPolicy()
        }
    }

    @objc private func handleWindowDidBecomeKey(_ notification: Notification) {
        guard NSClassFromString("XCTestCase") == nil else { return }
        if let window = notification.object as? NSWindow, isNormalAppWindow(window) {
            if NSApp.activationPolicy() != .regular {
                NSApp.setActivationPolicy(.regular)
            }
        }
    }

    /// Evaluates open windows and updates activation policy using production AppLifecyclePolicy.
    func updateActivationPolicy() {
        guard NSClassFromString("XCTestCase") == nil else { return }
        let menuBarEnabled = UserDefaults.standard.bool(forKey: "settings.general.menuBarMonitor")
        let currentPolicy: AppActivationPolicy = (NSApp.activationPolicy() == .accessory) ? .accessory : .regular

        let decision = AppLifecyclePolicy.decidePolicy(
            isMenuBarEnabled: menuBarEnabled,
            hasNormalWindows: hasNormalAppWindows(),
            hasActiveModalOrSheet: hasActiveModalOrSheet(),
            currentPolicy: currentPolicy
        )

        if decision.shouldTerminate {
            NSApp.terminate(nil)
            return
        }

        let targetNS: NSApplication.ActivationPolicy = (decision.desiredPolicy == .accessory) ? .accessory : .regular
        if NSApp.activationPolicy() != targetNS {
            NSApp.setActivationPolicy(targetNS)
        }
    }

    private func isNormalAppWindow(_ window: NSWindow) -> Bool {
        guard !(window is NSPanel) else { return false }
        guard window.styleMask.contains(.titled) else { return false }
        guard window.sheetParent == nil else { return false }
        let className = String(describing: type(of: window))
        guard !className.contains("NSStatusBarWindow"), !className.contains("NSPopover") else { return false }
        // Minimized windows still count as open windows
        return window.isVisible || window.isMiniaturized
    }

    private func hasNormalAppWindows() -> Bool {
        NSApp.windows.contains { isNormalAppWindow($0) }
    }

    private func hasActiveModalOrSheet() -> Bool {
        NSApp.modalWindow != nil || NSApp.windows.contains { $0.attachedSheet != nil }
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        let result = AppLifecyclePolicy.handleReopen()
        if result.presentMain {
            NSApp.setActivationPolicy(.regular)
            presentMainWindow()
        }
        return true
    }

    func presentMainWindow() {
        NSApp.setActivationPolicy(.regular)
        if let controller = menuBarController {
            controller.presentMainWindow()
        } else {
            let existing = NSApp.windows.first { $0.identifier == MenuBarController.mainWindowIdentifier }
            if let window = existing {
                if window.isMiniaturized { window.deminiaturize(nil) }
                window.makeKeyAndOrderFront(nil)
                NSApp.activate(ignoringOtherApps: true)
            } else {
                WindowOpener.shared.open?("main")
                NSApp.activate(ignoringOtherApps: true)
            }
        }
    }

    /// Finder Services entry point. Declared in Info.plist as NSMessage `uninstallApp`.
    @objc func uninstallApp(_ pboard: NSPasteboard,
                            userData: String?,
                            error: AutoreleasingUnsafeMutablePointer<NSString>?) {
        let urls = (pboard.readObjects(forClasses: [NSURL.self],
                                       options: [.urlReadingFileURLsOnly: true]) as? [URL]) ?? []
        guard let appURL = urls.first(where: { $0.pathExtension == "app" }) else {
            error?.pointee = "Select an application (.app) to uninstall." as NSString
            return
        }
        NSApp.setActivationPolicy(.regular)
        presentMainWindow()
        NSApp.activate(ignoringOtherApps: true)

        ExternalUninstallBuffer.pendingPath = appURL.path
        NotificationCenter.default.post(
            name: .vxCleanExternalUninstall,
            object: nil,
            userInfo: ["path": appURL.path]
        )
    }

    /// Synchronize menu-bar status item with settings toggle.
    @objc func syncMenuBarMonitor() {
        guard NSClassFromString("XCTestCase") == nil else { return }
        let enabled = UserDefaults.standard.bool(forKey: "settings.general.menuBarMonitor")
        if enabled {
            if menuBarController == nil {
                menuBarController = MenuBarController()
            }
        } else {
            if let controller = menuBarController {
                controller.teardown()
                menuBarController = nil
            }
            let currentPolicy: AppActivationPolicy = (NSApp.activationPolicy() == .accessory) ? .accessory : .regular
            let result = AppLifecyclePolicy.handleMenuBarDisabledInBackground(
                hasNormalWindows: hasNormalAppWindows(),
                currentPolicy: currentPolicy
            )
            if result.reopenMainWindow {
                NSApp.setActivationPolicy(.regular)
                presentMainWindow()
            }
        }
    }
}

/// Capture helper for SwiftUI openSettings on macOS 14+
struct SettingsOpenerCapture: View {
    var body: some View {
        if #available(macOS 14.0, *) {
            SettingsOpenerCaptureV14()
        } else {
            Color.clear.frame(width: 0, height: 0)
        }
    }
}

@available(macOS 14.0, *)
private struct SettingsOpenerCaptureV14: View {
    @Environment(\.openSettings) private var openSettings

    var body: some View {
        Color.clear
            .frame(width: 0, height: 0)
            .onAppear {
                AppWindowManager.shared.openSettingsAction = {
                    openSettings()
                }
            }
    }
}

@main
struct MCleanApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var appState = AppState()
    @StateObject private var theme = ThemeManager.shared
    @AppStorage("VXClean.OnboardingComplete") private var onboardingComplete = false

    init() {
        // Enter CLI mode only when first arg is a known command
        if let first = CommandLine.arguments.dropFirst().first,
           CLI.isKnownCommand(first) {
            CLI.run()
        }
    }

    var body: some Scene {
        WindowGroup(id: "main") {
            Group {
                if onboardingComplete {
                    MainWindow()
                        .environmentObject(appState)
                        .frame(minWidth: 900, minHeight: 600)
                } else {
                    OnboardingView(isComplete: $onboardingComplete)
                }
            }
            .environmentObject(theme)
            .preferredColorScheme(theme.appearance.colorScheme)
            .background(MainWindowLifecycleCapture())
            .background(SettingsOpenerCapture())
        }
        .windowStyle(.automatic)
        .windowToolbarStyle(.unified)
        .windowResizability(.contentMinSize)
        .defaultSize(width: 1000, height: 680)
        .commands {
            CommandGroup(replacing: .newItem) {}
            CommandMenu("Updates") {
                Button("Check for Updates (Unavailable)") {
                    UpdateService.shared.checkForUpdates()
                }
                .disabled(true)
                .keyboardShortcut("u", modifiers: [.command, .shift])
            }
        }

        Settings {
            SettingsView()
                .environmentObject(appState)
                .background(SettingsLifecycleCapture())
        }
    }
}
