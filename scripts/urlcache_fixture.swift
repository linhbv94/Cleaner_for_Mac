import Foundation
// Synthetic URLCache only. Called by test_native_maintenance inside its disposable home.
let root = CommandLine.arguments[2]
let cache = URLCache(memoryCapacity: 0, diskCapacity: 10_000_000, diskPath: root)
let request = URLRequest(url: URL(string: "https://vxclean.invalid/fixture")!)
if CommandLine.arguments[1] == "store" {
  let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: ["Cache-Control": "max-age=3600", "Content-Type": "application/octet-stream"])!
  cache.storeCachedResponse(CachedURLResponse(response: response, data: Data(repeating: 65, count: 500_000), storagePolicy: .allowed), for: request)
  RunLoop.current.run(until: Date().addingTimeInterval(2))
}
print(cache.cachedResponse(for: request)?.data.count ?? -1)
