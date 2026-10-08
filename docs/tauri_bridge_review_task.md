# Hoàn tất bản thử sau review

[Sub-process Task: DO NOT invoke other agent CLIs]

Chỉ sửa các điểm dưới đây và chạy checks đến khi có kết quả, không khảo sát lại source/theme. User đã ủy quyền UI cho Anti, Codex review. Các file cần đọc chỉ desktop/native/main.swift, desktop/src_tauri/src/engine_bridge.rs, desktop/src_tauri/tauri.conf.json, desktop/package.json, desktop/src/App.tsx, desktop/src/main.tsx, desktop/src/index.css, scripts/verify_tauri_bridge.py và components đã tạo. Không gọi CLI khác.

1. Compile script dùng -parse-as-library nhưng main.swift có top-level run(): chuyển entry sang @main struct, static @MainActor func main() gọi run(), bỏ top-level run. Deployment target giữ macOS13 như baseline. Đặt module cache vào workspace hoặc /tmp để không cần write home.
2. Import App đang trỏ components/sidebar và dashboard chưa tồn tại lowercase. Hoàn tất snake_case: sidebar.tsx, dashboard.tsx, app.tsx; sửa import. Dọn duplicate Sidebar.tsx/Dashboard.tsx/TitleBar.tsx/UnmigratedView.tsx chỉ khi đã có counterpart. Chỉ các file Anti vừa tạo.
3. Tailwind dark variant phải là @custom-variant dark (&:where(.dark, .dark *)); để toggle dark/light theo class.
4. Resource dùng explicit mapping {"../native/vxclean_engine":"vxclean_engine"} trong tauri.macos.conf.json; config chung không bundle binary Mac trên Windows. Resolve_engine_path chỉ resource_dir/vxclean_engine, và dev fallback **cfg(debug_assertions)** với CARGO_MANIFEST_DIR path, không release fallback từ cwd hoặc arbitrary files. Timeout kill rồi wait để reap child; try_wait error cũng kill/wait. Validate protocol_version == 1.0 và platform == macos trước trả DTO.
5. package script tauri chạy tại src_tauri (cd src_tauri && tauri) để config discovery hoạt động. Tauri main capability JSON tối thiểu core:default, quyền drag cần thêm core:window:allow-start-dragging; không shell/fs quyền tổng quát. Không bịa icon hoặc readiness.
6. Rút gọn copy UI: không đưa Mach kernel/IOKit/IPC/cấu trúc bridge/"trung thực không giả lập" vào flow người dùng. Browser notice: "Mở ứng dụng desktop để xem chỉ số hệ thống." Card labels CPU/RAM/Ổ đĩa/Pin; subtitle "Chỉ số tại lần cập nhật gần nhất" vì chỉ refresh theo yêu cầu, không streaming live. Badge dùng "Đã cập nhật". Giữ thông báo bản thử/các chức năng chưa chuyển rõ ràng.
7. Verification script không cargo online fallback hoặc npx tự tải. Dùng desktop/node_modules/.bin/tsc và vite trực tiếp; cargo check --offline timeout180s, không tải mới. Swift compile timeout120s và cache local. Chạy script bằng python3 scripts/verify_tauri_bridge.py, **phải đợi command_status đến kết thúc trước final**, nếu background bị dừng khi CLI exit thì chưa chứng minh gì. Ghi results JSON/log vào _work/ gitignored; docs/tauri_bridge_verification.md mô tả kết quả thật/giới hạn. Thêm link docs/readme.md. Không claim GUI/Windows/full feature parity nếu chưa test.

Lưu ý: Bắt buộc tuân thủ quy chuẩn AGENTS.md — Tuyệt đối KHÔNG dùng cú pháp LaTeX, Tiếng Việt chuyên nghiệp, snake_case.
