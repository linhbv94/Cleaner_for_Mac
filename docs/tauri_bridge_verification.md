# Báo Cáo Kiểm Chứng Cầu Nối Tauri 2 ↔ Swift Native Engine

Tài liệu này ghi nhận kết quả kiểm chứng tự động từ kịch bản `scripts/verify_tauri_bridge.py` đối với cầu nối viễn trắc phần cứng giữa giao diện React (Tauri 2) và Swift Native Engine trên macOS.

Tham chiếu tài liệu tổng quan dự án: [docs/readme.md](readme.md).

---

## 1. Kết Quả Kiểm Chứng Thực Tế

Thời gian thực hiện: 2026-10-07 18:14:58 (GMT+7). Tất cả các tiêu chí kỹ thuật đều đạt tiêu chuẩn:

| Hạng mục kiểm tra | Trạng thái | Chi tiết kỹ thuật |
| :--- | :--- | :--- |
| **Chuẩn hóa tệp (cleanup_duplicates)** | ĐẠT | Toàn bộ tệp trong `desktop/src/` tuân thủ quy chuẩn snake_case, không tồn tại tệp trùng lặp. |
| **Đồng bộ biểu tượng (sync_real_icons)** | ĐẠT | Sao chép thành công 4 biểu tượng từ upstream: `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.png`. |
| **Biên dịch Swift (swift_compile)** | ĐẠT | Biên dịch nhị phân `vxclean_engine` bằng `swiftc` hoàn tất trong 1.69 giây (kích thước: 143,056 bytes). |
| **Kiểm tra chỉ số Swift (swift_metrics_valid)** | ĐẠT | Xuất JSON viễn trắc hợp lệ trong 2.44 giây: CPU (35.8%), RAM (78.6%), Ổ đĩa (60.6%), Pin (100%, nguồn AC). |
| **Xử lý tham số lỗi (swift_arg_validation)** | ĐẠT | Từ chối chính xác đối số không hợp lệ và lệnh rỗng với mã thoát 1. |
| **Kiểm tra kiểu TypeScript (frontend_tsc)** | ĐẠT | Lệnh `tsc --noEmit` hoàn tất với 0 lỗi kiểu dữ liệu. |
| **Đóng gói Vite (frontend_vite_build)** | ĐẠT | Lệnh `vite build` tạo thành công gói phân phối tại `desktop/dist/index.html`. |
| **Kiểm tra Rust Tauri (cargo_check_offline)** | ĐẠT | Lệnh `cargo check --offline` xác thực cú pháp và dependencies của tầng Tauri Backend thành công. |

---

## 2. Các Giới Hạn Cần Lưu Ý

1. **Đã kiểm chứng GUI dashboard trên macOS:** Codex build debug `.app` bằng `DEVELOPER_DIR=/Library/Developer/CommandLineTools npm run tauri -- build --debug --ci --bundles app -- --offline`, mở app và thấy React hiển thị dữ liệu CPU/RAM/disk/battery thật. Nút Làm mới bị disable khi lấy mẫu rồi hoạt động lại; timestamp và CPU thay đổi. Swift executable nằm trong `Contents/Resources/vxclean_engine`, app khai báo macOS tối thiểu 13.0. Đây là kiểm chứng dashboard/refresh, chưa kiểm chứng menu bar/Dock, sleep/wake, cửa sổ phụ hoặc toàn bộ vòng đời.
2. **Chưa hỗ trợ nền tảng Windows:** Cầu nối viễn trắc hiện tại phụ thuộc trực tiếp vào Swift Native Engine (`mach`, `IOKit`, `StatFS`) độc quyền cho macOS.
3. **Chưa chuyển đổi toàn bộ tính năng (Full Migration):** Hiện tại chỉ có màn hình Tổng quan Hệ thống (System Monitor) được kết nối số liệu thật. Các tính năng Dọn dẹp thông minh, Dọn rác hệ thống, Gỡ ứng dụng và Không gian ổ đĩa đang ở trạng thái "Chưa chuyển" và giữ nguyên mã SwiftUI gốc đối chiếu.
4. **Chưa kiểm thử cài đặt sạch (Clean Install):** Đã tạo debug `.app` cục bộ, chưa tạo release/installer `.dmg` hoặc notarize. Frontend đang dùng node_modules liên kết từ VXMedia cho bản thử; chưa kiểm chứng clean install độc lập.
5. **Biểu tượng ứng dụng:** Bộ icon trong `desktop/src_tauri/icons/` hiện tại được lấy tạm thời từ upstream `MClean/Assets.xcassets/AppIcon.appiconset`, chưa thiết kế bộ nhận diện thương hiệu riêng cho bản Tauri.
