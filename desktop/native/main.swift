import Foundation

/// Entrypoint nhị phân Swift native cho VXClean Engine.
/// Biên dịch cùng MClean/Services/SystemMonitor.swift thực tế.
/// Chỉ hỗ trợ duy nhất đối số cố định "metrics", đảm bảo an toàn tuyệt đối:
/// không quyền xóa tệp, không shell thực thi tùy ý, không yêu cầu Full Disk Access (FDA).
@main
struct EngineMain {
    @MainActor
    static func main() {
        run()
    }

    @MainActor
    static func run() {
        let args = CommandLine.arguments

        // Kiểm tra tính hợp lệ của đối số đầu vào (chỉ chấp nhận duy nhất đối số "metrics")
        guard args.count == 2 && args[1] == "metrics" else {
            let programName = (args.first as NSString?)?.lastPathComponent ?? "vxclean_engine"
            let errorMessage = "Lỗi: Đối số không hợp lệ.\nCách dùng: \(programName) metrics\n"
            FileHandle.standardError.write(Data(errorMessage.utf8))
            exit(1)
        }

        // Khởi tạo và kích hoạt bộ đo hệ thống thực tế SystemMonitor
        let monitor = SystemMonitor.shared
        monitor.start(interval: 2.0)
        monitor.startDetail()

        // Chạy RunLoop đủ 2.1 giây để timer kích hoạt và thu thập CPU delta chuẩn xác từ Mach kernel
        let targetTime = Date().addingTimeInterval(2.1)
        while Date() < targetTime {
            RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.1))
        }

        // Dừng quan sát để giải phóng tài nguyên sau khi lấy xong snapshot
        monitor.stop()
        monitor.stopDetail()

        // Đóng gói dữ liệu viễn trắc thành cấu trúc JSON chuẩn theo hợp đồng (Contract)
        let payload: [String: Any] = [
            "protocol_version": "1.0",
            "platform": "macos",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "metrics": [
                "cpu": [
                    "usage": monitor.cpuUsage,
                    "history": monitor.cpuHistory
                ],
                "memory": [
                    "used_bytes": monitor.memoryUsed,
                    "total_bytes": monitor.memoryTotal,
                    "active_bytes": monitor.memoryActive,
                    "wired_bytes": monitor.memoryWired,
                    "compressed_bytes": monitor.memoryCompressed,
                    "fraction": monitor.memoryFraction
                ],
                "disk": [
                    "used_bytes": monitor.diskUsed,
                    "total_bytes": monitor.diskTotal,
                    "available_bytes": monitor.diskAvailable,
                    "fraction": monitor.diskFraction
                ],
                "battery": [
                    "has_battery": monitor.batteryState.hasBattery,
                    "charge_percent": monitor.batteryState.chargePercent,
                    "is_charging": monitor.batteryState.isCharging,
                    "is_ac_powered": monitor.batteryState.isACPowered,
                    "is_charged": monitor.batteryState.isCharged
                ]
            ]
        ]

        do {
            let jsonData = try JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys])
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                print(jsonString)
                exit(0)
            } else {
                let errorMessage = "Lỗi: Không thể chuyển đổi dữ liệu thành chuỗi UTF-8.\n"
                FileHandle.standardError.write(Data(errorMessage.utf8))
                exit(2)
            }
        } catch {
            let errorMessage = "Lỗi: Không thể mã hóa JSON: \(error.localizedDescription)\n"
            FileHandle.standardError.write(Data(errorMessage.utf8))
            exit(2)
        }
    }
}
