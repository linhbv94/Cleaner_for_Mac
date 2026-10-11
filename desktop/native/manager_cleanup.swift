import Foundation
import Darwin

/// Package managers own store mutation. This adapter never deletes store files.
struct ManagerCleanup {
  struct Plan { let executable: String; let store: String; let base: String }
  static func output(_ executable: String, _ args: [String], mutating: Bool = false) throws -> String {
    guard let text = String(data: try data(executable, args, mutating: mutating), encoding: .utf8) else { throw MaintenanceCLI.failure("invalid_manager_output") }
    return text.trimmingCharacters(in: .whitespacesAndNewlines)
  }
  static func data(_ executable: String, _ args: [String], mutating: Bool = false) throws -> Data {
    let p = Process(), pipe = Pipe()
    p.executableURL = URL(fileURLWithPath: executable); p.arguments = args
    p.currentDirectoryURL = URL(fileURLWithPath: MaintenanceCLI.home)
    var env = ProcessInfo.processInfo.environment
    env["PATH"] = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:" + MaintenanceCLI.home + "/.local/bin"
    env["COREPACK_ENABLE_NETWORK"] = "0"; env["NO_UPDATE_NOTIFIER"] = "1"
    p.environment = env; p.standardOutput = pipe; p.standardError = FileHandle.nullDevice
    try p.run()
    let fd = pipe.fileHandleForReading.fileDescriptor
    _ = fcntl(fd, F_SETFL, fcntl(fd, F_GETFL) | O_NONBLOCK)
    #if ENGINE_TESTING
    let budget: TimeInterval = mutating && ProcessInfo.processInfo.environment["VXCLEAN_TEST_MANAGER_TIMEOUT"] == "1" ? 1 : (mutating ? 90 : 5)
    #else
    let budget: TimeInterval = mutating ? 90 : 5
    #endif
    let deadline = Date().addingTimeInterval(budget)
    var bytes = Data(), buffer = [UInt8](repeating: 0, count: 8192)
    while true {
      let n = read(fd, &buffer, buffer.count)
      if n > 0 { bytes.append(contentsOf: buffer.prefix(n)) }
      if bytes.count > 1024*1024 || Date() > deadline || (mutating && OperationJournal.cancelled()) {
        p.terminate(); if p.isRunning { kill(p.processIdentifier, SIGKILL) }; p.waitUntilExit()
        throw MaintenanceCLI.failure("manager_interrupted: pnpm có thể đã dọn một phần; quét lại, không tự chạy lại")
      }
      if !p.isRunning && n <= 0 { break }
      if n <= 0 { Thread.sleep(forTimeInterval: 0.02) }
    }
    p.waitUntilExit()
    guard p.terminationStatus == 0 else { throw MaintenanceCLI.failure("pnpm_cli_failed: exit \(p.terminationStatus); không coi là dọn thành công") }
    return bytes
  }
  static func plan(_ expected: String? = nil) -> Plan? {
    let h = MaintenanceCLI.home
    #if ENGINE_TESTING
    let choices = [h + "/.local/bin/pnpm"]
    #else
    let choices = ["/opt/homebrew/bin/pnpm", "/usr/local/bin/pnpm", h + "/.local/bin/pnpm", h + "/.volta/bin/pnpm"]
    #endif
    guard let exe = choices.first(where: { FileManager.default.isExecutableFile(atPath: $0) }),
      let active = try? output(exe, ["store", "path"]), active.hasPrefix("/"), !active.contains("\n"),
      MaintenanceCLI.unchanged(active),
      (try? FileManager.default.attributesOfItem(atPath: active)[.type] as? FileAttributeType) == .typeDirectory,
      let base = [h + "/Library/pnpm/store", h + "/.local/share/pnpm/store", h + "/.cache/pnpm"].first(where: { active == $0 || active.hasPrefix($0 + "/") }),
      let pinned = try? output(exe, ["--store-dir", base, "store", "path"]), pinned == active,
      expected == nil || MaintenanceCLI.url(expected!).path == active
    else { return nil }
    return Plan(executable: exe, store: active, base: base)
  }
  static func prune(_ path: String) throws -> Int64 {
    guard let p = plan(path) else { throw MaintenanceCLI.failure("pnpm_store_changed: không xác minh được CLI/store; quét lại") }
    let before = MaintenanceCLI.size(MaintenanceCLI.url(path))
    _ = try output(p.executable, ["--store-dir", p.base, "store", "prune"], mutating: true)
    // Logical store delta, not a promise that all inventory bytes are reclaimable.
    return max(0, before - MaintenanceCLI.size(MaintenanceCLI.url(path)))
  }
  static var installerPaths: [String] {
    let root = MaintenanceCLI.home + "/Library/Caches/com.google.antigravity"
    return [root + "/update.zip", root + "/pending/Antigravity.zip"]
  }
  static func verifiedInstaller(_ path: String) -> Bool {
    guard installerPaths.contains(path), MaintenanceCLI.unchanged(path),
      let data = try? data("/usr/bin/unzip", ["-p", path, "Antigravity.app/Contents/Info.plist"]),
      let info = try? PropertyListSerialization.propertyList(from: data, format: nil) as? [String:Any],
      info["CFBundleIdentifier"] as? String == "com.google.antigravity", let version = info["CFBundleShortVersionString"] as? String else { return false }
    #if ENGINE_TESTING
    let app = MaintenanceCLI.home + "/Applications/Antigravity.app/Contents/Info.plist"
    #else
    let app = "/Applications/Antigravity.app/Contents/Info.plist"
    #endif
    guard let installed = NSDictionary(contentsOfFile: app), installed["CFBundleIdentifier"] as? String == "com.google.antigravity" else { return false }
    return installed["CFBundleShortVersionString"] as? String == version
  }
  static var installerAdvice: String {
    let shipit = MaintenanceCLI.home + "/Library/Caches/com.google.antigravity.ShipIt"
    return FileManager.default.fileExists(atPath: shipit) ? "Có thư mục ShipIt: khuyến nghị mở Antigravity (khác Anti IDE), hoàn tất update rồi quét lại trước khi dọn bộ cài. " : ""
  }
}
