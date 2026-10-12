import AppKit
import Foundation

/// Only bundle IDs attached to executable cache rules are accepted. Never force-quit.
@MainActor
struct AppLifecycle {
  static var quitTimeout: TimeInterval {
    #if ENGINE_TESTING
    return 1
    #else
    return 30
    #endif
  }
  static let supported = Set(["com.google.Chrome", "com.lemon.lvoverseas", "com.openai.codex", "com.google.antigravity", "com.google.antigravity-ide"])
  static func file(_ id: String) throws -> URL {
    guard UUID(uuidString: id) != nil else { throw MaintenanceCLI.failure("invalid_request: lifecycle id") }
    let root = MaintenanceCLI.url(MaintenanceCLI.home + "/Library/Application Support/com.vxclean.desktop/operations/" + id)
    guard MaintenanceCLI.unchanged(root.path) else { throw MaintenanceCLI.failure("path_changed: lifecycle journal") }
    try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true, attributes: [.posixPermissions: 0o700])
    let file = root.appendingPathComponent("lifecycle.json")
    guard MaintenanceCLI.unchanged(file.path) else { throw MaintenanceCLI.failure("path_changed: lifecycle journal") }
    return file
  }
  static func save(_ value: [String: Any], id: String) throws {
    let url = try file(id)
    try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]).write(to: url, options: .atomic)
    try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: url.path)
  }
  static func prepare(_ payload: [String: Any]) async throws -> [String: Any] {
    guard let id = payload["operation_id"] as? String,
      payload["protocol_version"] as? String == "2.0", payload["platform"] as? String == "macos",
      let scope = payload["operation_scope"] as? String, ["quick_cleanup", "detailed_cleanup"].contains(scope),
      payload["confirm_app_quit"] as? Bool == true,
      let paths = payload["targets"] as? [[String: Any]], !paths.isEmpty else { throw MaintenanceCLI.failure("invalid_request: app quit confirmation") }
    var ids = Set<String>()
    for target in paths {
      guard let path = target["path"] as? String, let category = target["category"] as? String else { throw MaintenanceCLI.failure("invalid_request") }
      let rule = CleanupPolicy.rule(path, category: category, scope: scope)
      guard rule.enabled, rule.apps.allSatisfy({ supported.contains($0) }) else { throw MaintenanceCLI.failure("unsupported_rule: lifecycle") }
      ids.formUnion(rule.apps)
    }
    var apps = [[String: Any]]()
    for bundleID in ids.sorted() {
      for app in NSRunningApplication.runningApplications(withBundleIdentifier: bundleID) {
        #if ENGINE_TESTING
        guard app.bundleURL?.path.hasPrefix(MaintenanceCLI.home + "/Applications/") == true else { continue }
        #endif
        guard let url = app.bundleURL, MaintenanceCLI.unchanged(url.path), let bundle = Bundle(url: url), bundle.bundleIdentifier == bundleID else { throw MaintenanceCLI.failure("app_identity_changed") }
        apps.append(["bundle_id": bundleID, "path": url.path, "pid": Int(app.processIdentifier), "closed": false, "reopened": false,
          "version": bundle.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? ""])
      }
    }
    var state: [String: Any] = ["operation_id": id, "status": "quitting_apps", "apps": apps, "automatic_replay": false]
    try save(state, id: id) // obligation exists before requesting Quit
    for i in apps.indices {
      guard let pid = apps[i]["pid"] as? Int, let app = NSRunningApplication(processIdentifier: pid_t(pid)) else { continue }
      // terminate() requests normal app termination; a Save/Cancel dialog is owned by the app.
      apps[i]["quit_requested"] = true; state["apps"] = apps; try save(state, id: id)
      let accepted = app.terminate()
      let deadline = Date().addingTimeInterval(quitTimeout)
      while accepted && !app.isTerminated && Date() < deadline && getppid() != 1 {
        try await Task.sleep(nanoseconds: 100_000_000)
      }
      apps[i]["closed"] = app.isTerminated
      apps[i]["quit_status"] = app.isTerminated ? "closed" : "cancelled_or_timeout"
      state["apps"] = apps; try save(state, id: id)
    }
    state["status"] = apps.allSatisfy { $0["closed"] as? Bool == true } ? "ready_for_rescan" : "cancelled"
    state["apps"] = apps; try save(state, id: id)
    return state
  }
  static func finish(_ payload: [String: Any]) async throws -> [String: Any] {
    guard let id = payload["operation_id"] as? String else { throw MaintenanceCLI.failure("invalid_request") }
    let data = try Data(contentsOf: file(id))
    guard data.count < 1024 * 1024, var state = try JSONSerialization.jsonObject(with: data) as? [String: Any],
      var apps = state["apps"] as? [[String: Any]] else { throw MaintenanceCLI.failure("invalid_journal") }
    for i in apps.indices {
      if apps[i]["quit_requested"] as? Bool == true, let pid=apps[i]["pid"] as? Int, NSRunningApplication(processIdentifier:pid_t(pid)) == nil { apps[i]["closed"] = true }
      guard apps[i]["closed"] as? Bool == true, apps[i]["reopened"] as? Bool != true else { continue }
      guard let bundleID = apps[i]["bundle_id"] as? String, supported.contains(bundleID),
        let path = apps[i]["path"] as? String, MaintenanceCLI.unchanged(path),
        let bundle = Bundle(path: path), bundle.bundleIdentifier == bundleID else {
        apps[i]["reopen_status"] = "app_identity_changed"; continue
      }
      if NSRunningApplication.runningApplications(withBundleIdentifier: bundleID).contains(where: { $0.bundleURL?.path == path }) {
        apps[i]["reopened"] = true; apps[i]["reopen_status"] = "already_running"; continue
      }
      // Passive reconciliation never launches an app. Running identity is enough
      // even when the user has since installed a newer version of that app.
      if payload["reconcile_only"] as? Bool == true { continue }
      guard bundle.object(forInfoDictionaryKey:"CFBundleVersion") as? String == apps[i]["version"] as? String else {
        apps[i]["reopen_status"] = "app_identity_changed"; continue
      }
      let configuration = NSWorkspace.OpenConfiguration()
      configuration.activates = false
      #if ENGINE_TESTING
      configuration.createsNewApplicationInstance = true
      #endif
      if bundleID == "com.google.Chrome" {
        configuration.arguments = ["--restore-last-session"]
        #if ENGINE_TESTING
        configuration.arguments += ["--user-data-dir=" + MaintenanceCLI.home + "/Library/Application Support/Google/Chrome", "--no-first-run", "--no-default-browser-check", "--disable-background-networking"]
        #endif
      }
      do {
        _ = try await NSWorkspace.shared.openApplication(at: URL(fileURLWithPath: path), configuration: configuration)
        apps[i]["reopened"] = true
        apps[i]["reopen_status"] = bundleID == "com.google.Chrome" ? "restore_requested_not_verified" : "opened"
      } catch { apps[i]["reopen_status"] = "launch_failed: \(error.localizedDescription)" }
      state["apps"] = apps; try save(state, id: id)
    }
    state["apps"] = apps; state["status"] = apps.allSatisfy { $0["closed"] as? Bool != true || $0["reopened"] as? Bool == true } ? "reopened" : "reopen_pending"
    try save(state, id: id); return state
  }
}
