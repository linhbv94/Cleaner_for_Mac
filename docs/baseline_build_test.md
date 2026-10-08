# Báo cáo Baseline Build và Kiểm thử Trước Sửa đổi (Baseline Build & Test)

Tài liệu này ghi nhận hiện trạng môi trường công cụ (toolchain), khả năng biên dịch và kiểm thử của dự án trước khi thực hiện chỉnh sửa mã nguồn cho **VXClean**.

---

## 1. Môi trường Công cụ (Toolchain Baseline)

Khảo sát hệ thống thực tế trên máy:

| Thành phần | Lệnh kiểm tra | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :--- |
| **Active Developer Directory** | `xcode-select -p` | `/Library/Developer/CommandLineTools` | Chỉ có Command Line Tools (CLT) |
| **Xcode.app** | `ls /Applications/Xcode.app` | Không tồn tại trong `/Applications` | Không có Xcode IDE đầy đủ |
| **Swift Compiler** | `swift --version` | Apple Swift version 6.4 (swiftlang-6.4.0.34.1 clang-2100.3.34.1)<br>Target: arm64-apple-macosx26.0 | Sẵn sàng |
| **macOS SDK** | `xcrun --show-sdk-path` | `/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk` | macOS SDK khả dụng |
| **Swiftc Binary** | `xcrun --find swiftc` | `/Library/Developer/CommandLineTools/usr/bin/swiftc` | Sẵn sàng |
| **Xcodebuild** | `xcrun --find xcodebuild` | Lỗi: `unable to find utility "xcodebuild", not a developer tool or in PATH` | Không khả dụng |
| **XcodeGen** | `which xcodegen` | Exit code 1 (không có trong PATH) | Không khả dụng |

---

## 2. Kết quả Thử nghiệm Biên dịch (Compilation Checks)

### A. Toàn bộ mã nguồn dự án (Full Project)
- **Phương thức thực thi:** Khảo sát danh sách tập tin và gọi `swiftc -typecheck -sdk /Library/Developer/CommandLineTools/SDKs/MacOSX.sdk -target arm64-apple-macosx13.0 -parse-as-library` kèm danh sách tường minh các tập tin mã nguồn.
- **Kết quả:** Thất bại (Return code 1).
- **Nguyên nhân:** Các View SwiftUI sử dụng macro `@State` ghi nhận lỗi thiếu external macro plugin `SwiftUIMacros.StateMacro` trên môi trường Command Line Tools SDK hiện tại (`/Library/Developer/CommandLineTools`).

### B. Các thành phần Core, Models, Logic và Services
- **Phương thức thực thi:** Gọi `swiftc -typecheck` trên tập hợp 24 tập tin Swift thuộc các thư mục `MClean/Core`, `MClean/Models`, `MClean/Logic/Scanning`, `MClean/Logic/Utilities`, và `MClean/Services` (trừ `MenuBarController.swift` do phụ thuộc View).
- **Kết quả:** **Thành công (Return code 0)** với một số cảnh báo Swift concurrency.
- **Ý nghĩa:** Kiểm tra thành công tính toàn vẹn cú pháp và hệ thống kiểu dữ liệu tĩnh của các tệp logic với macOS SDK hiện hành; kết quả này mang tính chất kiểm tra tĩnh và không thay thế cho việc kiểm chứng hành vi runtime thực tế.

### C. Bộ kiểm thử đơn vị XCTest (MCleanTests)
- **Phương thức thực thi:** Gọi `swiftc -typecheck -sdk /Library/Developer/CommandLineTools/SDKs/MacOSX.sdk` kèm danh sách tập tin trong `MCleanTests/`.
- **Kết quả:** Thất bại (Return code 1: `error: no such module 'XCTest'`).
- **Nguyên nhân:** Framework `XCTest` chỉ được phân phối kèm ứng dụng Xcode IDE đầy đủ, không có sẵn trong gói Command Line Tools độc lập.

---

## 3. Giới hạn & Biện pháp Đảm bảo Chất lượng

1. **Tuân thủ giới hạn môi trường:**
   - Không cài thêm phần mềm mới (không cài Xcode, không cài xcodegen hay Homebrew packages).
   - Không thay đổi cấu hình `xcode-select` của hệ thống.
   - Không giả mạo kết quả kiểm thử (ghi nhận trung thực rằng `xcodebuild` và `XCTest` không thể thực thi trong môi trường hiện tại).

2. **Chiến lược kiểm định chất lượng thay thế:**
   - Sử dụng `swiftc -typecheck` kiểm tra tính toàn vẹn cú pháp và kiểu dữ liệu cho các file Swift logic.
   - Xây dựng các kịch bản kiểm thử độc lập (pure Swift test runners / validation scripts) không phụ thuộc vào `XCTest` để kiểm tra logic tính toán, chính sách an toàn và lifecycle.
   - Tuyệt đối không chạy ứng dụng dọn dẹp thật hoặc yêu cầu Full Disk Access (FDA) để tránh rủi ro xóa nhầm dữ liệu người dùng.
