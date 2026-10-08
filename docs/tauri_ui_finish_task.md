# Hoàn tất UI bản thử — task giới hạn

[Sub-process Task: DO NOT invoke other agent CLIs]

User giao Anti dựng UI, Codex review. Được sửa source UI trong cleaner_for_mac. Không khảo sát repo/theme thêm, không đọc task lịch sử; budget 6 phút.

Backend đã compile Swift/đọc JSON thật. Cần khôi phục UI sau lỗi cleanup tên file trên filesystem không phân biệt hoa/thường. Codex đã sửa cleanup bằng samefile(), rename App.tsx → app.tsx qua tên trung gian, thêm vite_env.d.ts. **Không tạo PascalCase shim hoặc xóa file nữa**, không sửa cleanup/script/backend.

Chỉ đọc desktop/src/types.ts, desktop/src/services/tauri_bridge.ts, desktop/src/components/title_bar.tsx, desktop/src/components/unmigrated_view.tsx, desktop/src/index.css, desktop/package.json. Có theme navy/cyan/Tailwind4 rồi.

Tạo/overwrite 3 file:
- desktop/src/app.tsx: React state theme, TabId, Capabilities, SystemSnapshot, loading/error; gọi fetchCapabilities/fetchSystemSnapshot từ service đã có, khóa useRef để không refresh song song. Browser báo cần desktop và không tạo số liệu. TitleBar/Sidebar/Dashboard/UnmigratedView kết nối props khớp, export default App. Toggle dark/light class/localStorage, đăng ký mount đúng React StrictMode.
- desktop/src/components/sidebar.tsx: compact sidebar VXClean, các tab dashboard/smart_scan/cleanup/uninstaller/space_lens; badge "Chưa chuyển" trên các tab chưa khả dụng. Props currentTab, onSelectTab, capabilities, isBrowserPreview khớp app. Label tiếng Việt ngắn.
- desktop/src/components/dashboard.tsx: cards CPU/RAM/ổ đĩa/pin từ snapshot DTO, RAM active/wired/compressed, storage available có ghi ước tính có thể gồm purgeable, battery charging/AC/full đúng. Refresh/loading/error/retry; không badge live vì chỉ lấy mẫu khi refresh. Browser notice chỉ "Mở ứng dụng desktop để xem chỉ số hệ thống." Không debug Mach/IOKit/IPC/bridge ở UI. Không cần biểu đồ phức tạp, không code samples/marketing. Max tổng 250 dòng cho 3 file để nhanh và dễ review.

Có thể sửa title_bar subtitle thành "Bản thử" và unmigrated_view thành một trang gọn "Chức năng chưa có trong bản thử; dùng bản native hiện tại", bỏ văn bản kiến trúc/khẳng định an toàn tuyệt đối.

Cuối cùng chạy **python3 scripts/verify_tauri_bridge.py**. Chờ command_status tới EXIT, không final khi còn background task. Cargo offline đã có cache, script sẽ copy icon upstream đúng path và ghi _work/verification_results.json. Nếu compile failure, sửa đúng lỗi rồi check lại; không bịa pass. Ghi docs/tauri_bridge_verification.md ngắn với kết quả thật, nói chưa GUI/Windows/full migration/clean install, icon tạm upstream; thêm link docs/readme.md. Không commit/push.

Lưu ý: Bắt buộc tuân thủ quy chuẩn AGENTS.md — Tuyệt đối KHÔNG dùng cú pháp LaTeX, Tiếng Việt chuyên nghiệp, snake_case.
