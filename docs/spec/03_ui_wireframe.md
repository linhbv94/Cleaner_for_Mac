# Screen và component contract VXClean

Version: 2.0.0 — 2026-10-10. Target release preparation; [scope](14_quick_detailed_scope.md), [policy](15_cleanup_protection_policy.md), [menubar design](16_menubar_release_ui.md) và [retention](08_scan_retention_ui_polish.md) là chuẩn hiện hành.

## Shell và dashboard

Giữ theme bộ VX theo [master theme](../../../_summary/master_theme.md): Navy/Slate, Cyan, density desktop hiện có, light/dark, native Mac traffic lights và Windows menu/control branch. Head bar production hiện VXClean, bỏ Bản thử; Browser Preview chỉ browser/mock. Không mở thêm master sidebar mới cho Chrome/Media.

Dashboard giữ CPU/RAM/Disk/Battery từ native, timestamp/error/stale; máy không pin có nhánh no-battery. Refresh single-flight, không debounce quá mức chặn thao tác hoặc nhân đôi sample với tray. Không gọi available disk là junk hoặc promised freed bytes.

## Quick

- Idle: Quét nhanh, mô tả System Junk/User Cache/Large & Old, không quảng cáo 10 nhóm.
- Scanning: progress/current path theo operation, cancel; không hiện CLI chuyên biệt.
- Results: đúng ba nhóm; default safe đã validation, Large Files false. Mỗi row name/size/method/short consequence; protected/unknown disabled và lý do.
- Dọn selection → review vĩnh viễn/Trash/hậu quả → policy/lifecycle → kết quả từng mục. Nút dọn mặc định không auto chọn Large Files.

## Dọn chi tiết

Category list giữ nhóm chung + Chrome, AI, Media, Node, Brew, Xcode, Docker, Mail, Trash. Dictionary giải thích từng dòng, badge tạo lại/mất dữ liệu/chưa xác minh/được bảo vệ; info mở exact scope/conditions/giữ gì. Không đưa internal IDs/schema vào copy user.

Checkbox trong nhóm chỉ Chọn tất cả nhóm đang xem. Trang tổng quan có count/bytes/selected của từng nhóm, Dọn các mục đã chọn xuyên nhóm và Chọn tất cả tổng quan tách rõ. Select all có thể chọn risky supported, không protected/informational/unsupported; indeterminate/deselect. Review global nêu mọi nhóm/hậu quả, không âm thầm chọn nhóm ẩn dưới checkbox category.

Popup Quit: app names, lý do, Đóng và dọn/Bỏ qua app/Hủy. Save/Cancel do app quản; không force quit. Reopen/restore failures tách với cleanup result. In-use row có thể selectable để Quit flow, nhưng hard-block row disabled.

## Uninstall, Orphans, Lens

Uninstaller giữ inventory/search/sort/associated files; Apple apps có thể bị lọc khỏi inventory, không bắt demo Safari hiện nếu source không emit. Self khóa. Known user-data có cảnh báo; discovered có nhãn Có thể liên quan, lý do, default false; Movies/CapCut nói rõ project/resources. Admin retry modal chỉ remaining known permission-denied targets, không discovery.

Orphans dùng copy Có thể là dư liệu, không tuyên bố xác minh app đã gỡ. Supported volatile chọn thủ công; blocked reason hiện. Giữ nav/entry hiện tại, không cần thêm sidebar master mới.

Lens giữ bubble/list renderer, geometry tests, folder chooser, breadcrumb Finder/Terminal/Copy (JS clipboard), depth/drill-down và partial flags. Chỉ can_trash target exact được chọn; quyền scan không là quyền xóa. Không thay UI thành tree cũ >10 MB.

## Menubar, settings và failure states

Menubar glyph/user SVG, panel 340 px, CPU/RAM breakdown/Disk/Battery/status, open main/quick-read/settings/quit theo spec 16. Main close ẩn Dock, panel click không bật Dock. Shared metrics sampler.

Settings hiện theme controls; không trình bày cleaning/scheduler/FDA boolean như đã có nếu chưa nối backend. Quyền chỉ yêu cầu khi operation cần; System Settings user tự cấp. Không mở autostart/autoClean trong task.

Loading, empty, partial, denied, blocked, stale, interrupted và outcome_unknown khác nhau. Native không fallback mock. Results removed estimates/Trash riêng; audit/details đủ cho user biết mục nào thực sự đã xử lý, không hứa Undo direct delete.
