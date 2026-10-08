import Foundation
import AppKit

#if canImport(Sparkle)
import Sparkle
#endif

final class UpdateService: ObservableObject {
    static let shared = UpdateService()

    #if canImport(Sparkle)
    private var updaterController: SPUStandardUpdaterController?
    #endif

    private init() {
        #if canImport(Sparkle)
        // Do not start automatic checking by default; keep control minimal.
        updaterController = SPUStandardUpdaterController(startingUpdater: false, updaterDelegate: nil, userDriverDelegate: nil)
        #endif
    }

    func checkForUpdates() {
        // Update checks are intentionally disabled for VXClean internal builds.
        // No fake update URLs are used.
        Logger.shared.log("Update checks are disabled for VXClean internal builds", level: .info)
    }
}
