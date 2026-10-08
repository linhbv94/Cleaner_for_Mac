# Báo cáo Kiểm chứng Mã nguồn VXClean

Tài liệu này ghi nhận kết quả kiểm chứng độc lập thực tế cho phạm vi mã nguồn **VXClean** được runner kiểm tra sau khi hoàn tất các chỉnh sửa, dựa trên nhật ký chạy thực tế tại [verification_final.log](../_work/verification_final.log) (mã thoát `exit 0`; log cục bộ trong thư mục `_work/` được Git bỏ qua). Toàn bộ kết quả mô phỏng trước đây đã được gỡ bỏ và thay thế hoàn toàn bằng bằng chứng thực tế từ bộ công cụ kiểm thử nguồn.

---

## 1. Lệnh Kiểm thử và Cơ chế Thực thi Runner

Để tái lập toàn bộ quy trình kiểm chứng từ thư mục gốc dự án:
```bash
python3 scripts/verify_source.py
```

Bộ runner [scripts/verify_source.py](../scripts/verify_source.py) được cấu hình an toàn và độc lập:
- **Đường dẫn macOS SDK:** Tự động phát hiện thông qua tham số argv của `xcrun --show-sdk-path`.
- **Môi trường cách ly:** Sử dụng thư mục tạm (`tempfile.TemporaryDirectory`) riêng biệt cho từng tác vụ biên dịch kiểm thử, không can thiệp thư mục mã nguồn.
- **Kiểm soát tiến trình:** Thiết lập giới hạn thời gian chạy (timeout) 90 giây cho từng tiến trình con (`subprocess.run`), ngăn ngừa nguy cơ treo tiến trình.
- **Bảo mật:** Tuyệt đối không dùng `shell=True`, tham số được truyền dưới dạng danh sách đối số trực tiếp.

---

## 2. Kết quả Kiểm chứng Thực tế

Toàn bộ các bước kiểm tra dưới đây đều đạt (PASS) trong lần chạy độc lập:

### A. Kiểm tra Cú pháp Swift AST (Frontend Parse)
24 tập tin Swift được runner chọn đều vượt qua kiểm tra phân tích cú pháp AST (`swiftc -frontend -parse`):
- [MClean/Core/AppConstants.swift](../MClean/Core/AppConstants.swift)
- [MClean/Logic/Scanning/AppInfoFetcher.swift](../MClean/Logic/Scanning/AppInfoFetcher.swift)
- [MClean/Logic/Scanning/Conditions.swift](../MClean/Logic/Scanning/Conditions.swift)
- [MClean/Logic/Utilities/CLI.swift](../MClean/Logic/Utilities/CLI.swift)
- [MClean/Logic/Utilities/Logger.swift](../MClean/Logic/Utilities/Logger.swift)
- [MClean/MCleanApp.swift](../MClean/MCleanApp.swift)
- [MClean/Services/CleaningEngine.swift](../MClean/Services/CleaningEngine.swift)
- [MClean/Services/FullDiskAccessManager.swift](../MClean/Services/FullDiskAccessManager.swift)
- [MClean/Services/Haptics.swift](../MClean/Services/Haptics.swift)
- [MClean/Services/MenuBarController.swift](../MClean/Services/MenuBarController.swift)
- [MClean/Services/SchedulerService.swift](../MClean/Services/SchedulerService.swift)
- [MClean/Services/SystemMonitor.swift](../MClean/Services/SystemMonitor.swift)
- [MClean/Services/UpdateService.swift](../MClean/Services/UpdateService.swift)
- [MClean/ViewModels/AppState.swift](../MClean/ViewModels/AppState.swift)
- [MClean/ViewModels/SpaceLensViewModel.swift](../MClean/ViewModels/SpaceLensViewModel.swift)
- [MClean/Views/Components/AppBundleDragHandle.swift](../MClean/Views/Components/AppBundleDragHandle.swift)
- [MClean/Views/Components/AppTheme.swift](../MClean/Views/Components/AppTheme.swift)
- [MClean/Views/Components/FDADemoView.swift](../MClean/Views/Components/FDADemoView.swift)
- [MClean/Views/Components/MenuBarMonitorView.swift](../MClean/Views/Components/MenuBarMonitorView.swift)
- [MClean/Views/Components/PermissionSheet.swift](../MClean/Views/Components/PermissionSheet.swift)
- [MClean/Views/MainWindow.swift](../MClean/Views/MainWindow.swift)
- [MClean/Views/OnboardingView.swift](../MClean/Views/OnboardingView.swift)
- [MClean/Views/Orphans/OrphanListView.swift](../MClean/Views/Orphans/OrphanListView.swift)
- [MClean/Views/Settings/SettingsView.swift](../MClean/Views/Settings/SettingsView.swift)

### B. Kiểm tra Hệ thống Kiểu Dữ liệu Tĩnh (Typecheck Subset)
Biên dịch kiểm tra kiểu tĩnh thành công trên target `arm64-apple-macosx13.0` đối với:
- [MClean/Core/AppConstants.swift](../MClean/Core/AppConstants.swift)
- [MClean/Services/SystemMonitor.swift](../MClean/Services/SystemMonitor.swift)

Các lời gọi Mach VM, Combine và IOKit power sources (`IOKit.ps`) vượt qua kiểm tra kiểu với SDK hiện có; chưa đối chiếu số liệu lúc chạy app.

### C. Tính toàn vẹn Cấu hình & Đối xứng Ngôn ngữ (Localization Parity)
- **Cú pháp Plist & Strings:** `plutil -lint` thành công cho [MClean/Info.plist](../MClean/Info.plist) và 5 tập tin chuỗi [Localizable.strings](../MClean/en.lproj/Localizable.strings).
- **Đối xứng Khóa dịch (Key Parity):** Bộ khóa cơ sở tiếng Anh (`en`) gồm 385 khóa. Cả 4 ngôn ngữ (`vi`, `ja`, `zh-Hans`, `zh-Hant`) đều đối xứng 100% với 385/385 khóa.

### D. Cấu hình Dự án & Scheme Xcode (Textual Config Check)
Kiểm tra cấu hình văn bản (Textual Check, không chạy qua `xcodegen` hay `xcodebuild`):
- `project.yml`: `PRODUCT_NAME` là `VXClean`, `PRODUCT_MODULE_NAME` là `MClean`.
- `project.pbxproj`: `PRODUCT_NAME = VXClean;`, `PRODUCT_MODULE_NAME = MClean;`, `TEST_HOST` trỏ tới `VXClean.app`, đường dẫn product reference là `VXClean.app`.
- `MClean.xcscheme`: `BuildableName` đồng bộ sang `VXClean.app`.

### E. Kiểm thử Logic Vòng đời Sản xuất (AppLifecyclePolicy Runtime Tests)
Biên dịch và chạy 7 trường hợp kiểm thử trực tiếp trên mã nguồn sản xuất của `AppLifecyclePolicy` kết hợp với [MClean/Core/AppConstants.swift](../MClean/Core/AppConstants.swift) thật (chỉ kiểm tra logic thuần, không giả lập môi trường đồ họa Dock hay NSWindow):
1. **Không còn cửa sổ thường + Menu Bar đang bật:** Chuyển sang `.accessory` (ẩn biểu tượng Dock, tiếp tục chạy ngầm).
2. **Không còn cửa sổ thường + Menu Bar đang tắt:** Trả về `.regular` và `shouldTerminate = true` (yêu cầu kết thúc ứng dụng).
3. **Còn cửa sổ thường mở (kể cả khi thu nhỏ):** Duy trì chính sách `.regular`.
4. **Hộp thoại modal / sheet cấp quyền đang hiển thị:** Giữ nguyên chính sách hiện tại, không hạ xuống accessory.
5. **Tắt Menu Bar khi đang chạy ngầm (không còn cửa sổ):** Kích hoạt reopen (chuyển `.regular` và yêu cầu mở Main Window).
6. **Tắt Menu Bar khi đang ở `.regular` và còn cửa sổ:** Giữ nguyên trạng thái, không kích hoạt reopen không cần thiết.
7. **Xử lý sự kiện Reopen (`handleReopen`):** Chuyển sang `.regular` và yêu cầu hiển thị Main Window.

---

## 3. Tính Bất biến và Toàn vẹn So với Upstream

- Tệp `LICENSE` và 3 tệp thuộc `release_support` hoàn toàn trùng khớp từng byte (byte identical) với commit nhập gốc `42cf1f86ae91bc191858d2ae9df197e026da8f2b`.
- Các thành phần cốt lõi: `CleaningEngine`, `ScanEngine`, `SpaceLensEngine`, `AppPathFinder`, `OrphanListView` cùng thư mục `dist/` được giữ nguyên không đổi.
- Riêng [MClean/Logic/Scanning/Conditions.swift](../MClean/Logic/Scanning/Conditions.swift) chỉ bổ sung chuỗi `vxclean` vào danh sách loại trừ bảo vệ tự thân, giữ nguyên toàn bộ giải thuật quét và tính toán an toàn.

---

## 4. Giới hạn và Phạm vi Kiểm chứng

- **Môi trường kiểm thử:** Hệ thống chỉ trang bị Apple Command Line Tools (CLT), chưa cài đặt bộ Xcode.app đầy đủ. Do đó thiếu `xcodebuild`, `XCTest.framework` và plugin dynamic macro `SwiftUIMacros`.
- **Bản dựng:** Chưa thực hiện đóng gói nhị phân `VXClean.app`; tập tin [dist/MClean.app](../dist/MClean.app) vẫn là bản dựng baseline ban đầu.
- **Phạm vi kiểm thử:** Chưa thực hiện full SwiftUI typecheck, `xcodebuild`, kiểm thử giao diện GUI runtime, cấp quyền Full Disk Access (FDA) thực tế hoặc chạy dọn dẹp xóa file thật trên đĩa.
- **Không cam kết tuyệt đối:** Báo cáo không đưa ra khẳng định "an toàn tuyệt đối" hay "100% ứng dụng đã test".
- **Độ chính xác số liệu:** Số liệu RAM (Active, Wired, Compressed) là ước tính từ Mach VM; dung lượng đĩa khả dụng (`diskAvailable`) có thể chứa cả dung lượng có thể giải phóng (purgeable space).

---

## 5. Danh mục Kiểm tra Thủ công Giao diện (Manual GUI Checklist)

Dành cho môi trường macOS có giao diện đồ họa đầy đủ:
1. **Đóng cửa sổ cuối cùng:** Đóng cửa sổ chính khi Menu Bar bật → xác nhận icon biến mất khỏi Dock và ứng dụng chạy ngầm.
2. **Reopen và Smart Scan:** Kích hoạt lại từ Menu Bar hoặc Finder/Launchpad → kiểm tra Dock icon xuất hiện lại và kích hoạt đúng chức năng Smart Scan.
3. **Quản lý đa cửa sổ:** Mở đồng thời Main Window và Settings, hoặc khi có cửa sổ thu nhỏ / modal sheet → xác nhận bấm "Open VXClean" mở đúng Main Window, không mở nhầm Settings, không ẩn nhầm cửa sổ.
4. **Bật / tắt Menu Bar:** Đổi tùy chọn Menu Bar nhiều lần trong Settings → xác nhận ứng dụng phản hồi chính xác và timer cập nhật ổn định.
5. **Tương thích macOS:** Kiểm tra giao diện Cài đặt (Settings) trên cả macOS 13 và macOS 14+.
6. **Hiển thị thông số Pin:** Kiểm tra hiển thị pin thực tế trên MacBook; tự động ẩn hoàn toàn trên máy để bàn (không có pin tích hợp); kiểm tra trạng thái sạc tối ưu (optimized charging).
7. **Thoát thủ công:** Chọn thoát (`manualQuit` / `Cmd+Q`) → xác nhận ứng dụng kết thúc hoàn toàn (terminate).
