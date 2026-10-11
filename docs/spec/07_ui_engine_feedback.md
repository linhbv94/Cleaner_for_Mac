# VXClean — Feedback UI/engine ngày 2026-10-09

> **Contract chuẩn bị release — 2026-10-10:** [Scope mới](14_quick_detailed_scope.md), [policy backend](15_cleanup_protection_policy.md), [menubar/Dock](16_menubar_release_ui.md) và [API/QA hiện hành](00_system_overview.md) ưu tiên cho target mới. Giữ nội dung dưới làm lịch sử/chi tiết không mâu thuẫn; không áp yêu cầu giữ nguyên Quick cũ hoặc coi policy/tray đã triển khai.


Version: 1.0.0 — Ngày cập nhật: 2026-10-09

Tài liệu này cập nhật trước triển khai theo brief user, ưu tiên hơn mô tả UI cũ khi mâu thuẫn. Ground truth engine: [native integration](../native_engine_integration.md), [types](../../desktop/src/types.ts), [bridge](../../desktop/src/services/tauri_bridge.ts). Không đổi logic scan MClean hoặc bảo vệ thao tác dọn để phục vụ trình bày.

## Phạm vi và hành vi nghiệm thu

Thứ tự master sidebar theo bổ sung user: Tổng quan → Quét nhanh → Space Lens → Gỡ ứng dụng → Dọn rác chi tiết. Không có nav Tệp mồ côi riêng.

1. Dashboard có nút Quét nhanh → chuyển Smart Scan và tự gọi scan một lần, không cần click thêm; giữ progress/cancel/lỗi và không tạo scan trùng khi React render lại.
2. Scan result ưu tiên hiển thị: System Junk → User Cache → Large & Old Files → Node Cache → Brew Cache; nhóm khác theo sau. Nhóm rỗng không hiện; chỉ sort render, không đổi thứ tự engine. Lựa chọn theo item, không kéo history AI/large files vào lựa chọn mặc định theo category.
3. Dọn rác chi tiết có đủ 10 category MClean, kể cả Xcode/AI/Brew/Docker/Mail/Trash không có dữ liệu (hiển thị rỗng rõ ràng). Dùng `runDetailedScan` mới, trả category rỗng với include_empty. Tệp mồ côi là tab/nhóm bên trong Dọn rác chi tiết; bỏ nav riêng, dùng lại OrphansView và policy hiện có.
4. App Uninstaller ẩn app có is_system_protected. VXClean tự thân vẫn bảo vệ. Danh sách compact kiểu Finder với tên, dung lượng và sorting tên/dung lượng tăng/giảm; search hoạt động cùng sorting. Nút gỡ không ngắt số mục sang dòng khác; summary dung lượng xuống dòng có chủ đích. Scan/uninstall thật giữ snapshot/path/inode/running-app guards.
5. Bỏ toggle theme khỏi headbar; Settings có System/Light/Dark, mặc định System khi chưa lưu, lưu lựa chọn, theo matchMedia changes khi mode System. Giữ native menu theme tương thích; không đổi setting OS. Hoạt động browser lẫn WKWebView.
6. Space Lens: hai mode circles/list compact (không grid). Circles lấy diện tích tương ứng dung lượng, packing không overlap trong vùng nội dung, nhãn chính đọc được; list hàng thấp. Click chọn xem info, double click vào directory; không drill package/denied. Shared selected node và breadcrumb cho cả hai mode. Giữ Finder/Terminal/Copy/Trash và confirmation hiện có.
7. Space Lens mở mặc định `~/`; chọn thư mục khác qua native picker (và nhập path làm fallback). Được scan read-only các thư mục dữ liệu khác như /Applications, /Users, /Volumes; không scan toàn `/`, `/System`, `/private`, `/dev`, `/proc` hay system roots chỉ có giá trị thấp. External root trash không nằm trong scope: chỉ xem/Finder; backend trả can_trash từng node đúng policy, UI không đề xuất dọn khi không được phép.
8. Flow quyền: picker native cho lựa chọn thư mục; denied/partial scan có thông báo rõ, nút mở Full Disk Access và quét lại sau user cấp quyền. Không tự cấp FDA/admin hoặc giả lập quyền. Có progress/cancel cho home scan dài, chống stale response. Mỗi scan lens có operation_id, lens_id riêng; không tái dùng grant sau đổi root.

## Hợp đồng engine/bridge cho UI

Codex sở hữu: `desktop/native/**`, `desktop/src_tauri/**`, `desktop/src/services/tauri_bridge.ts`, `desktop/src/types.ts`, tests và spec này. Anti chỉ sửa components/app/theme; tránh sửa các file Codex sở hữu.

- `runDetailedScan(onProgress?, shouldCancel?)`: cùng ScanResponse nhưng có đủ 10 nhóm, include_empty=true. Không đổi runSmartScan mặc định.
- `runAnalyzeSpaceLens(path, onProgress?, shouldCancel?)`: nhận `LensProgressEvent` {current_path, scanned_bytes, item_count}; process scoped operation_id và cancel, giữ tương thích call một argument.
- `chooseScanFolder(): Promise<string | null>`: native folder dialog, null khi Hủy; preview chỉ cho nhập path, không giả picker thành quyền thật.
- `openFullDiskAccessSettings(): Promise<void>`: mở trang quyền macOS, user tự cấp; không shell từ path frontend.
- `SpaceLensNode.can_trash?: boolean`: false khi root/protected/package self/denied/outside-home; quyết định cuối tại backend, không dựa riêng vào UI. `SpaceLensResponse.is_partial?: boolean`; kiểm tra denied cây con, không báo toàn bộ size đầy đủ khi partial.
- Sorting app name/size và ẩn protected là frontend presentation; backend vẫn giữ block khi có yêu cầu IPC trực tiếp.

## Điều phối, checks và bàn giao

User ủy quyền Codex gọi Anti CLI riêng; không tác động window Anti đang làm job khác. Anti là agent thực thi UI; không gọi CLI agent khác trong runner, báo câu hỏi tham vấn về Codex chủ trì. Task này: thực thi đầu tiên + tối đa 3 vòng sửa/review; đã dùng 3/3 vòng sửa/review, 0 lần tham vấn; không gọi thêm CLI sau lượt cuối, Codex hoàn tất review/sửa độc lập nếu cần. Giữ bộ đếm xuyên session. Không commit/push/release/xóa dữ liệu user.

Anti báo file đã sửa/checks/điểm chưa kiểm chứng vào docs/anti_ui_handoff.md. Codex review diff, chạy build/runtime và ghi bàn giao cuối vào [work log](../../../_summary/work_log.md), không đóng turn nếu user chưa xác nhận. Cần kiểm chứng dashboard auto scan; thứ tự nhóm; cleanup đủ category + orphan nội bộ; app filter/sort/wrapping; theme System persistence; circle/list selection/double click; home scan/cancel/root picker/permission flow. Build không thay runtime.

### Điều chỉnh hiệu năng Lens sau test home

Scanner Foundation ban đầu vượt 125 giây trên home. Codex dùng duyệt POSIX lstat/opendir, allocated bytes st_blocks × 512, không theo symlink, dedup hardlink và chỉ dựng DTO con trực tiếp. Mỗi navigation quét lại subtree. Tổng vẫn là ước tính đĩa/APFS, phần không đọc được báo partial. Double click phải gọi analyzePath để vào directory, không phụ thuộc children lồng sâu.

Picker folder được đưa vào Rust host bằng RFD native thay cho dialog của executable Swift rời, để hộp thoại thuộc đúng VXClean và có thể nghiệm thu Cancel/Choose trong cùng app. API frontend giữ nguyên.

Đối chiếu app engine trong cùng lượt gỡ ứng dụng: bổ sung Containers/Application Scripts khớp chính xác bundle ID (case CapCut), dùng FileSizeCalculator MClean cho allocated size của app/residual, và tìm app trong thư mục hãng dưới Applications (giới hạn 4 tầng, không theo symlink, không đi vào bundle). App Apple/system bị loại trước khi tính size; host/native vẫn chặn yêu cầu gỡ trực tiếp.
