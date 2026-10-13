# QA độc lập VXClean 1.0.18
Ngày: 2026-10-13. Phạm vi: luồng Full Disk Access từ bản public1.0.16; chưa đóng lượt của user.

## Review
- Đối chiếu spec25, broker frontend, worker Rust và các điểm gọi Quick/Detail/uninstaller/orphan/Lens. Probe chỉ mở read-only rồi đóng; không đọc hoặc sửa TCC database. Timeout4s, trạng thái không xác minh không được coi là granted.
- FDA không thay native mutation policy/grant/journal/admin. Internal rescan sau đóng app dùng chế độ không tương tác, tránh treo lifecycle chờ modal.
- Pending scan dùng dialog chung, cancellation được kiểm tra trước/sau probe/resume; focus/recheck không phát lại scan đã hoàn tất.

## Kết quả mới
- Frontend build PASS; 48 Rust tests PASS.
- Broker FDA11 nhóm +typed deferral PASS; 7 release guards PASS; history/cache/retention10/selection5/circle18 PASS; git diff --check PASS.
- Native /Applications/VXClean.app About1.0.18, strict/deep signature PASS khi chạy với keychain thật; designated requirement ràng buộc certificate hiện có.
- Settings xác nhận quyền đọc từ worker của app, Kiểm tra lại vẫn confirmed. Quick scan chỉ đọc hoàn tất,2.45GB; System Junk partial hiển thị thật, Large Files mặc định bỏ chọn. Không quan sát prompt quyền từng container trong lượt này. Không dọn dữ liệu thật.
- 35 nhóm native fixtures và9 manager fixtures PASS; fixture7000 tệp/journal16.672s. CI hai kiến trúc, signed release packages/public endpoints chưa thực hiện.

## Ranh giới
- Đây là QA native Apple Silicon; chưa Intel GUI, Windows hoặc auto-update download/install/restart. FDA17→18 theo log và panel18 hiện confirmed, chưa chứng minh qua updater public.
- Public CI hiện ad-hoc khác signer local. User đã cho phép lưu signer local hiện có vào Secrets; đã lưu hai Secrets và chuẩn bị isolated keychain/config overlay/strict identity check/cleanup ở CI. Chưa publish, còn chờ CI/package verification.
