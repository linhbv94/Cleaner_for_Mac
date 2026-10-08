import Foundation

public struct AppConstants {
    public static let appVersion: String = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0"
    public static let productName: String = "VXClean"
}

// MARK: - Central Notifications
extension Notification.Name {
    /// Posted when the "Show system monitor in menu bar" Settings toggle flips.
    public static let vxCleanMenuBarMonitorChanged = Notification.Name("VXClean.MenuBarMonitorChanged")
    /// Posted when a Smart Scan is initiated from the menu-bar popover.
    public static let vxCleanSmartScanRequested = Notification.Name("VXClean.SmartScanRequested")
    /// Posted by the Finder Services handler ("Uninstall with VXClean") with path in userInfo.
    public static let vxCleanExternalUninstall = Notification.Name("VXClean.ExternalUninstall")

    // Compatibility aliases
    public static let mCleanMenuBarMonitorChanged = vxCleanMenuBarMonitorChanged
    public static let mCleanSmartScanRequested = vxCleanSmartScanRequested
    public static let mCleanExternalUninstall = vxCleanExternalUninstall
}

// MARK: - Lifecycle Policy Helper
public enum AppActivationPolicy: Equatable {
    case regular
    case accessory
}

/// Pure production logic coordinator determining activation policy and termination state.
public struct AppLifecyclePolicy {
    public static func decidePolicy(
        isMenuBarEnabled: Bool,
        hasNormalWindows: Bool,
        hasActiveModalOrSheet: Bool,
        currentPolicy: AppActivationPolicy
    ) -> (desiredPolicy: AppActivationPolicy, shouldTerminate: Bool) {
        // Guard: Never lower or change policy during modal sheets or confirmation dialogs
        if hasActiveModalOrSheet {
            return (currentPolicy, false)
        }

        if hasNormalWindows {
            return (.regular, false)
        } else {
            if isMenuBarEnabled {
                return (.accessory, false)
            } else {
                return (.regular, true)
            }
        }
    }

    public static func handleMenuBarDisabledInBackground(
        hasNormalWindows: Bool,
        currentPolicy: AppActivationPolicy
    ) -> (newPolicy: AppActivationPolicy, reopenMainWindow: Bool) {
        if !hasNormalWindows || currentPolicy == .accessory {
            return (.regular, true)
        }
        return (currentPolicy, false)
    }

    public static func handleReopen() -> (newPolicy: AppActivationPolicy, presentMain: Bool) {
        return (.regular, true)
    }
}
