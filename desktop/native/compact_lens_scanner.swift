import Foundation
import Darwin

/// Full allocated-size traversal with bounded DTO memory. Never follows symlinks.
/// Only direct children become nodes; entering a directory requests its own scan.
actor CompactLensScanner {
  private struct Inode: Hashable { let device: Int32; let inode: UInt64 }
  private var seen = Set<Inode>()
  private var bytes: Int64 = 0
  private var count = 0
  private var lastProgress = Date.distantPast
  private var report: (@Sendable (SpaceLensEngine.Progress) -> Void)?
  private func progress(_ path: String, _ size: Int64) {
    bytes += size
    count += 1
    let now = Date()
    if now.timeIntervalSince(lastProgress) >= 0.1 {
      lastProgress = now
      report?(SpaceLensEngine.Progress(scannedBytes: bytes, itemCount: count, currentPath: path))
    }
  }
  private func metadata(_ path: String) -> stat? {
    var value = stat()
    return path.withCString { lstat($0, &value) } == 0 ? value : nil
  }
  private func fileSize(_ path: String, _ value: stat) -> Int64 {
    if value.st_nlink > 1 && value.st_mode & S_IFMT == S_IFREG {
      let key = Inode(device: value.st_dev, inode: value.st_ino)
      if !seen.insert(key).inserted { progress(path, 0); return 0 }
    }
    let size = max(0, Int64(value.st_blocks)) * 512
    progress(path, size)
    return size
  }
  private func entries(_ path: String) -> [String]? {
    guard let directory = path.withCString({ opendir($0) }) else { return nil }
    defer { closedir(directory) }
    var result = [String]()
    while true {
      errno = 0
      guard let entry = readdir(directory) else {
        if errno != 0 { return nil }
        break
      }
      let name = withUnsafePointer(to: &entry.pointee.d_name) {
        $0.withMemoryRebound(to: CChar.self, capacity: 1024) { String(cString: $0) }
      }
      if name != "." && name != ".." { result.append(path + "/" + name) }
    }
    return result
  }
  private func directorySize(_ root: String) -> (Int64, Bool, Bool, Int) {
    var total: Int64 = 0
    var partial = false
    var stack = [root]
    var rootDenied = false
    var directCount = 0
    while let path = stack.popLast() {
      guard let list = entries(path) else {
        partial = true
        if path == root { rootDenied = true }
        continue
      }
      if path == root { directCount = list.count }
      for child in list {
        guard let value = metadata(child) else { partial = true; continue }
        if value.st_mode & S_IFMT == S_IFDIR {
          stack.append(child)
        } else {
          // Includes link inode bytes; link targets are never traversed.
          total += fileSize(child, value)
        }
      }
    }
    return (total, partial, rootDenied, directCount)
  }
  func scan(root: URL, onProgress: @escaping @Sendable (SpaceLensEngine.Progress) -> Void) async throws -> SpaceLensNode {
    report = onProgress
    defer { report = nil }
    guard let paths = entries(root.path) else {
      let node = SpaceLensNode(url: root, isDirectory: true)
      node.isAccessDenied = true
      return node
    }
    var children = [SpaceLensNode]()
    for path in paths {
      try Task.checkCancellation()
      let url = URL(fileURLWithPath: path)
      guard let value = metadata(path) else {
        let denied = SpaceLensNode(url: url, isDirectory: false)
        denied.isAccessDenied = true
        children.append(denied)
        continue
      }
      let isDirectory = value.st_mode & S_IFMT == S_IFDIR
      let isPackage = isDirectory && ((try? url.resourceValues(forKeys: [.isPackageKey]).isPackage) == true || url.pathExtension == "app")
      let size: Int64
      let partial: Bool
      let denied: Bool
      let directCount: Int
      if isDirectory {
        (size, partial, denied, directCount) = directorySize(path)
      } else {
        size = fileSize(path, value)
        partial = false
        denied = false
        directCount = 0
      }
      let child = SpaceLensNode(url: url, isDirectory: isDirectory && !isPackage, isPackage: isPackage, size: size, prunedCount: directCount)
      child.isAccessDenied = denied
      child.hasAccessDeniedDescendants = partial
      children.append(child)
    }
    children.sort { $0.size > $1.size }
    let node = SpaceLensNode(url: root, isDirectory: true, size: children.reduce(0) { $0 + $1.size }, children: children)
    node.hasAccessDeniedDescendants = children.contains { $0.isAccessDenied || $0.hasAccessDeniedDescendants }
    onProgress(SpaceLensEngine.Progress(scannedBytes: bytes, itemCount: count, currentPath: root.path))
    return node
  }
}
