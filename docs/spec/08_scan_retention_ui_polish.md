# VXClean — Giữ kết quả quét và đồng bộ UI

> **Contract chuẩn bị release — 2026-10-10:** [Scope mới](14_quick_detailed_scope.md), [policy backend](15_cleanup_protection_policy.md), [menubar/Dock](16_menubar_release_ui.md) và [API/QA hiện hành](00_system_overview.md) ưu tiên cho target mới. Giữ nội dung dưới làm lịch sử/chi tiết không mâu thuẫn; không áp yêu cầu giữ nguyên Quick cũ hoặc coi policy/tray đã triển khai.


Version: 1.0.0 — Ngày cập nhật: 2026-10-09

Cập nhật trước thực thi theo brief mới của user; nối tiếp [spec 07](07_ui_engine_feedback.md).

## Hành vi

- Giữ trong bộ nhớ kết quả và state (lựa chọn, path, mode, sort/search) của các màn đã mở trong 5 phút tính từ lần đọc thành công. Đổi menu và quay lại trong TTL không scan lại. Chỉ mount màn lần đầu khi được mở, không quét tất cả nền. Quét đang chạy không tạo job trùng khi đổi menu; có thể quay lại xem tiến trình/cancel. Hết TTL chỉ làm mới khi quay lại màn; Smart Scan về idle, các màn tự quét giữ hành vi tự quét. Nút quét/làm mới chủ động bỏ cache. Dọn/gỡ/Trash làm mất hiệu lực dữ liệu liên quan ở các màn khác, không tái dùng grant chỉ vì UI còn cache. Không lưu đường dẫn/kết quả vào localStorage; restart app bắt đầu phiên mới. Backend TTL 15 phút/inode guards giữ nguyên.
- Dashboard: nút Quét nhanh dạng tròn lớn nổi bật chính giữa dưới cụm metrics; vẫn một click chuyển và scan thật.
- Các page header cùng visual đồng bộ icon/title/subtitle, cỡ chữ, padding, alignment; Space Lens và Uninstaller dùng chung chuẩn. Tách folder picker/path/circle-list/rescan của Lens xuống toolbar bên dưới header.
- Giữ nguyên ngưỡng label circles: tên r>=18, size/% r>=65; không sửa packing, size calculation hoặc thresholds. Click nền trống SVG bỏ chọn; click circle vẫn chọn.
- List: click tên file/folder toggle chọn/bỏ chọn; double click directory vào trong giữ nguyên. Click size/bar không đổi lựa chọn. Bar mỏng dưới dung lượng, chiều rộng chuẩn 96px (responsive cho hẹp), max child bytes là 100%, child khác size/max; nếu max=0 width=0, không NaN. Cột % vẫn size/parent size.

## Phân công và nghiệm thu

Codex sở hữu app.tsx, services/retention và bridge, lifecycle/cache và invalidation. Anti thực thi UI components/header/dashboard/Lens click/bar, không sửa app/bridge/native. Không hai agent sửa cùng file; Codex sửa retention components sau Anti kết thúc. Anti CLI task mới theo feedback này: lượt đầu + tối đa 3 sửa/review, hiện đã dùng 1/3; tối đa 2 tham vấn/lượt (runner yêu cầu trả câu hỏi về Codex, không gọi agent). Bộ đếm brief spec07 đã hết không đặt lại; spec08 là yêu cầu mới độc lập.

QA: đổi menu/back không chạy lại và giữ selection; TTL expiry/invalidation bằng kiểm thử clock; manual refresh; dashboard vị trí + một click; header đồng bộ; circles background unselect/thresholds; list name toggle/double click/bar tỷ lệ/max0/parent%. Build và native runtime, cập nhật [work log](../../../_summary/work_log.md) và handoff. Không commit/push/release, không dọn dữ liệu user.

## Bàn giao thực thi

Cache session giữ React state của màn đã mở, không giữ nội dung file hoặc ghi kết quả vào ổ đĩa. Màn ẩn có aria-hidden/inert; hết TTL thì unmount để nhả dữ liệu/DOM, RSS giảm tùy WebKit/GC. Mutation invalidate trước/sau; failed/cancelled/late result không làm mới cache. Dashboard CTA yêu cầu lượt scan mới, chọn menu dùng cache; Orphans có scope riêng. Handoff và QA: [anti_ui_polish_handoff](../anti_ui_polish_handoff.md).

Anti task spec08: lượt đầu + sửa/phục hồi 1/3, 0 tham vấn, còn 2 vòng chưa dùng. Hai subprocess đã kết thúc và khôi phục quyền; lượt sửa đã thực thi UI nhưng không hoàn tất checks/handoff do command headless không khớp grant. Codex review/sửa retention và chạy build/checks/runtime độc lập, không gọi lại khi không cần. Spec07 vẫn 3/3 đã hết.
