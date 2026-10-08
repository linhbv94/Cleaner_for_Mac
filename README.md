# VXClean — Trình Dọn Dẹp & Quản Lý Hệ Thống macOS

VXClean là ứng dụng tiện ích quản trị, phân tích dung lượng và dọn dẹp hệ thống dành cho macOS, được phát triển và tối ưu hóa dựa trên nền tảng mã nguồn mở [MClean](https://github.com/maclifevn/MClean). Ứng dụng cung cấp các công cụ trực quan giúp người dùng kiểm soát tài nguyên phần cứng, giải phóng dung lượng ổ đĩa và gỡ cài đặt ứng dụng triệt để.

---

## 1. Phạm Vi Tính Năng Cốt Lõi

* **Dọn dẹp hệ thống (System Cleanup):**
  Quét và loại bỏ bộ nhớ đệm (User/System Caches), nhật ký hệ thống (System Logs), tệp Xcode DerivedData, và các tệp tải về tạm thời.
* **Gỡ cài đặt ứng dụng (App Uninstaller & Orphan Finder):**
  Gỡ bỏ hoàn toàn ứng dụng kèm theo toàn bộ tệp tàn dư liên quan (Application Support, Caches, Preferences, Saved Application State). Tự động phát hiện các tệp mồ côi từ những ứng dụng đã bị xóa trước đó.
* **Bản đồ dung lượng trực quan (Space Lens):**
  Phân tích cấu trúc thư mục dạng đồ thị bong bóng (Bubble map), giúp định vị nhanh các thư mục và tập tin chiếm dụng nhiều dung lượng nhất trên ổ đĩa.
* **Theo dõi hệ thống thời gian thực (Menu Bar Monitor):**
  Hiển thị trực quan mức tải CPU (kèm đồ thị lịch sử 1 phút), trạng thái bộ nhớ chi tiết (Active Pages, Wired, Compressed), dung lượng khả dụng theo macOS (có thể bao gồm purgeable space), và tình trạng pin trong (Internal Battery).

---

## 2. Hành Vi Cửa Sổ & Vòng Đời Nền (Window & Lifecycle Policy)

Nhằm tối ưu hóa trải nghiệm người dùng tiện ích thanh menu, VXClean áp dụng chính sách vòng đời ứng dụng linh hoạt:

1. **Chế độ chạy nền (Background Accessory Mode):**
   Khi tính năng **Menu Bar Monitor** được bật trong Cài đặt, việc đóng cửa sổ thông thường cuối cùng (gồm cửa sổ chính và Cài đặt) sẽ chuyển ứng dụng sang chế độ nền (`.accessory`). Ứng dụng sẽ ẩn khỏi Dock nhưng tiến trình vẫn tiếp tục duy trì để cập nhật các chỉ số trên thanh menu.
2. **Kích hoạt lại cửa sổ chính:**
   Người dùng có thể nhấp vào biểu tượng thanh menu và chọn **Open VXClean**, hoặc mở lại ứng dụng từ Finder/Launchpad để đưa ứng dụng trở lại chế độ cửa sổ thông thường (`.regular`).
3. **Mở Cài đặt từ nền:**
   Mục **Settings…** trong popover thanh menu hỗ trợ mở trực tiếp giao diện Cài đặt trên macOS 14+ thông qua cơ chế capture `openSettings` của SwiftUI, đồng thời duy trì selector tương thích cho macOS 13.

---

## 3. Cảnh Báo An Toàn Thao Tác Xóa Tệp (Safety Notice)

Khác với các tuyên bố trong tài liệu upstream ban đầu, **không phải mọi thao tác xóa tệp đều chuyển vào Thùng rác (Trash)**:
* **Xóa vĩnh viễn:** Các tác vụ dọn dẹp bộ nhớ đệm hệ thống, dọn tệp mồ côi và dọn dẹp tự động theo lịch sử dụng trực tiếp `FileManager.removeItem` hoặc quyền quản trị viên `/bin/rm -rf`. Dữ liệu này bị xóa vĩnh viễn và không thể khôi phục từ Thùng rác.
* **Chuyển vào Thùng rác:** Thao tác xóa thủ công trong phân hệ **Space Lens** sử dụng `FileManager.trashItem`, cho phép người dùng khôi phục tệp nếu cần.

Chi tiết đối soát mã nguồn được trình bày tại [docs/safety_audit.md](docs/safety_audit.md).

---

## 4. Hướng Dẫn Xây Dựng Từ Mã Nguồn (Build From Source)

### Yêu cầu môi trường
* macOS 13.0 trở lên theo deployment target của dự án.
* Bộ công cụ **Xcode đầy đủ** (cấu hình dự án hiện khai báo Xcode 16.4 và Swift 5.9).
* Công cụ tạo dự án [XcodeGen](https://github.com/yonaskolb/XcodeGen):
  ```bash
  brew install xcodegen
  ```

### Các bước biên dịch
1. Khởi tạo dự án Xcode từ đặc tả `project.yml`:
   ```bash
   xcodegen generate
   ```
2. Mở tệp dự án `MClean.xcodeproj` trong Xcode.
3. Chọn scheme **MClean** (sản phẩm đầu ra được cấu hình là `VXClean.app`).
4. Nhấn `Cmd + B` để build hoặc `Cmd + R` để chạy ứng dụng trong môi trường phát triển.

> [!NOTE]
> **Về bản dựng và tệp nhị phân trong thư mục `dist/`:**
> Tệp `dist/MClean.app` vẫn là binary upstream phục vụ đối chiếu. Đã tạo debug `VXClean.app` cho bản thử Tauri + React trong `desktop/src_tauri/target/debug/bundle/macos/`; chưa có bản dựng native SwiftUI mới.
>
> **Trạng thái kiểm thử hệ thống:**
> Native SwiftUI đã qua kiểm chứng mã nguồn và unit policy; chưa chạy `xcodebuild`, `XCTest` hoặc GUI/FDA runtime của bản native mới. Bản thử Tauri đã build bằng Command Line Tools và kiểm chứng GUI dashboard/refresh đọc số liệu Swift thật. Smart Scan, cleanup, uninstaller, Space Lens, menu bar/Dock chưa chuyển sang Tauri. Chi tiết: [kiểm chứng bản thử Tauri](docs/tauri_bridge_verification.md).

> [!NOTE]
> **Về biểu tượng ứng dụng (App Icon):**
> Phiên bản VXClean hiện tại tạm thời tiếp tục sử dụng asset biểu tượng ứng dụng gốc (`MCleanAppIcon`) trong khi chờ bộ nhận diện thương hiệu hình ảnh mới được thiết kế.

---

## 5. Mục Lục Tài Liệu Kỹ Thuật (Docs Index)

Toàn bộ tài liệu kỹ thuật, báo cáo đối soát và hồ sơ chuyển giao được lưu trữ trong thư mục `docs/`:

* [docs/readme.md](docs/readme.md): Tổng quan và chỉ mục chi tiết toàn bộ tài liệu dự án.
* [docs/upstream_provenance.md](docs/upstream_provenance.md): Hồ sơ nguồn gốc mã nguồn upstream, remote URL và commit cơ sở.
* [docs/baseline_build_test.md](docs/baseline_build_test.md): Báo cáo hiện trạng công cụ biên dịch và kiểm thử tại thời điểm tiếp nhận.
* [docs/safety_audit.md](docs/safety_audit.md): Báo cáo đối soát chi tiết cơ chế xóa tệp trong mã nguồn.
* [docs/verification.md](docs/verification.md): Báo cáo kết quả kiểm chứng tự động mã nguồn và các giới hạn runtime.
* [docs/_vxclean_handoff.md](docs/_vxclean_handoff.md): Đặc tả phân tích và kế hoạch triển khai ban đầu.
* [docs/_vxclean_review.md](docs/_vxclean_review.md): Biên bản đánh giá phản biện kỹ thuật từ Codex.
* [docs/_vxclean_task_02.md](docs/_vxclean_task_02.md): Yêu cầu thực thi hạng mục Task 02.
* [docs/_vxclean_task_03.md](docs/_vxclean_task_03.md): Yêu cầu hoàn thiện thương hiệu, tài liệu và kiểm chứng Task 03.
* [docs/_vxclean_final_review.md](docs/_vxclean_final_review.md): Biên bản rà soát kỹ thuật và chỉ đạo sửa lỗi dứt điểm từ Codex.

---

## 6. Giấy Phép & Ghi Nhận Bản Quyền (License & Attribution)

Dự án được phân phối dưới giấy phép **MIT License**.
Dựa trên mã nguồn gốc MClean. Bản quyền: Copyright 2026 MClean Contributors.
Xem toàn văn giấy phép tại [LICENSE](LICENSE).
