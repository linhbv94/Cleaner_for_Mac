> **Cập nhật rule Quick theo user:** mục “Điều chỉnh theo user: góc nhìn dọn rác” trong [spec21](21_quick_scan_clean_parity.md) ưu tiên hơn các yêu cầu24h/giữ build-tool dưới đây; detailed không đổi.

> Override hiện hành 2026-10-11: riêng System Junk Quick clone toàn bộ rule MClean, không còn filter tên/profile/IPC/lock/tuổi/hardlink. Quyết định và kiểm chứng ở [spec21](21_quick_scan_clean_parity.md). User Cache/detailed giữ policy riêng.


# Ưu tiên release Quét nhanh — 2026-10-11

> **Contract mới nhất:** [spec21](21_quick_scan_clean_parity.md) mở lại gate Quick, bỏ filter vendor rộng, yêu cầu mọi target trong kết quả dọn có grant và actual cleanup/rescan; inventory updater/state giữ riêng. Các mức15/97/321MB và nghiệm thu trước là lịch sử.


User yêu cầu lấy engine MClean làm nền, maintenance rồi cho chạy; chấp nhận rủi ro cache tái tạo. **Gate release hiện tại là Quick scan + chọn + dọn**, dọn chi tiết hoàn thiện sau. Thay checklist full-detail trước đó; không coi chức năng detail chưa xong là blocker Quick release, nhưng hiển thị supported/unsupported đúng.

- Giữ scan MClean ba nhóm và root hiện có. Dọn thường: User Cache tại ~/Library/Caches (ngoài nhóm chuyên biệt/updater/self/runtime/state); System caches tại /Library/Caches; logs tại ~/Library/Logs,/Library/Logs,/private/var/log; temp tại /private/tmp,/private/var/tmp. Chỉ child, không cấp quyền xóa structural root, /System,/usr,/bin,/etc hay ngoài allowlist.
- Dùng policy tương thích MClean thay khóa mọi unknown cache: cache bên trong root đúng, tên/state/runtime được bảo vệ, manifest đầy đủ. Không cần chứng minh schema riêng từng app để dọn cache thường sau quyết định user này.
- Giữ logs/temp mới trong24giờ, lock/socket/service state nhận diện được; không coi mtime cũ là bằng chứng tuyệt đối tệp không đang được sử dụng; báo cáo diagnostic riêng7ngày như đã có. Giữ tmp backupQA/journal/isolated-delete/source của agent đang làm; bộ công cụ QA/release, executable/library và IPC/shared-memory (ví dụ boost_interprocess) không coi là tệp tạm hết sử dụng chỉ vì mtime cũ. Không nâng quyền admin tự động; mục không thể ghi hiện lý do quyền và skip, không báo sạch hết.
- Mixed parent có protected/fresh/link không được dọn toàn bộ; tách child eligible với traversal bounded, giữ phần còn lại chỉ đọc, tổng byte không cộng trùng. Metadata và mutation dùng cùng rule; thao tác dọn chỉ file regular, không follow symlink/hardlink; content/identity thay đổi từ chối.
- Large Files vẫn opt-in/Trash. Không mặc định chọn project/source/database/credential. Cleanup/uninstall/lens authority riêng không đổi. Không tự dọn máy thật khi chỉ cần fixture để chứng minh.

Nghiệm thu Quick: UI→host→native scan, mặc định chọn đúngcache; chọn/bỏ chọn; confirm→dọn fixture thật→quét lại giảm đúng; critical/state/runtime và freshlog/temp giữ; permissions/partial/race/cancel báo đúng; không chạy CLI Node/Brew/Docker; scan retention hoạt động. Một gói cuối/QA trên app thực, signature/hash/handoff đạt rồi dừng trước publish. Chrome thật trước đây là bằng chứng riêng, không dọn lại chỉ để tăng số test.
