# Xác minh và mở dọn Quét nhanh — 2026-10-10

> **Contract mới nhất:** [spec21](21_quick_scan_clean_parity.md) mở lại gate Quick, bỏ filter vendor rộng, yêu cầu mọi target trong kết quả dọn có grant và actual cleanup/rescan; inventory updater/state giữ riêng. Các mức15/97/321MB và nghiệm thu trước là lịch sử.


> **Ưu tiên hiện hành 2026-10-11:** [spec20](20_quick_release_priority.md) thay các yêu cầu adapter riêng cho mọi cache Quick và gate full-detail dưới đây. Cache thường MClean được maintenance; logs/temp ≥24giờ có guard runtime/IPC/quyền. Số 0B/15MB và trạng thái chỉ-adapter dưới đây là bằng chứng lịch sử, không mô tả source hiện hành. Kết quả gói cuối xem [checklist](../release_readiness_checklist.md).


User yêu cầu xử lý các checkbox bị khóa bằng xác minh kỹ thuật, không chỉ mở checkbox. Giữ ba nhóm Quét nhanh và phân nhánh app/công cụ hiện tại.

- User Cache: thêm adapter cho payload HTTP `fsCachedData` của URLCache tại các owner đã đối chiếu: `com.apple.helpd`, `com.apple.tipsd`, `com.apple.AMPLibraryAgent`. Chỉ leaf UUID là regular file; không cấp quyền parent bundle, Cache.db/WAL/SHM, HSTS, plist, cache tải xuống/updater. Scanner tách parent thành payload đủ điều kiện và dòng phần còn lại chỉ đọc, không đếm trùng. Cần kiểm chứng Foundation URLCache khi mất payload bằng fixture thực trước khi bật.
- System Junk: chỉ thêm báo cáo diagnostic cá nhân `.ips`/`.crash`/`.diag` cũ ≥7 ngày tại `~/Library/Logs/DiagnosticReports` (regular file trực tiếp); còn báo cáo mới, log hoạt động, temp tùy ý và hệ thống ngoài Home giữ nguyên. Chỉ tách leaf, không dọn parent. Xóa mất bằng chứng chẩn đoán; không tác động app/project. Không mở rule theo tên cache chung.
- Snapshot đầy đủ, symlink/hardlink, thay đổi nội dung và fresh scan giữ nguyên; xóa từng file, giữ directory. Test phải kiểm tra parent khác, UUID giả có extension, file mới/đổi nội dung, state/database và quyền không bị kéo theo.
- UI ghi lý do khóa/hậu quả trên từng dòng, tổng số byte phát hiện và đủ điều kiện dọn tách rõ. Cache vừa quét có thể thay đổi bởi app đang chạy; grant đổi phải từ chối, không mở rộng quyền.

Nguồn đối chiếu: [Apple file system](https://developer.apple.com/documentation/foundation/using-the-file-system-effectively), [Apple URLCache](https://developer.apple.com/documentation/foundation/urlcache). Chúng xác định cache tái tạo được và API cache response; không chứng nhận mọi folder Library/Caches an toàn. Fixture chỉ chứng minh layout của Foundation trên OS máy test, các layout khác giữ khóa.

Dung lượng User Cache126MB không phải toàn bộ Caches máy: quick loại Google/Adobe/AI/ShipIt/công cụ. Chrome QA trước đó ghi385.094.063bytes thành công ở lượt bị ngắt và804.438.535bytes ở lượt cuối; không được gán tất cả phần chênh lệch cho cleanup khi thiếu snapshot chiều cùng scope.

## Kiểm tra dung lượng máy hiện tại

Đọc filesystem chỉ đọc: `~/Library/Caches` khoảng1.690MB logical (mẫu trong lúc app tiếp tục chạy), gồm AntigravityShipIt481MB, Adobe422MB, Antigravity363MB, Google296MB. Đây là các vùng quick loại theo scope; không biến mất sau dọn. Quick126MB chủ yếu phần khác như GeoServices56MB, helpd35,5MB, parsecd17,1MB. Không có snapshot chiều cùng scope nên không thể đối chiếu chính xác toàn bộ chênh lệch. Mẫu filesystem này không bao gồm cache trong Application Support.

Báo cáo diagnostic cũ là dữ liệu chẩn đoán không thể tái tạo bản cũ, vì vậy gắn `user_data`, có thể chọn nhưng mặc định bỏ chọn. Không dùng nhãn rebuildable cho báo cáo.

## Nghiệm thu lượt này

22nhóm native/20Rust đạt; native thực sự dọn payload Foundationfixture, DB/WAL/SHM giữ bytes, cold miss và tái tạo500KB đạt. Build app/DMG/updater, codesign strict và hai signatureverifier/tamper đạt. GUI gói mới: quickscan126,17MBfound/14,97MBcacheeligible, group và từng checkbox bỏ/chọn lại đúng số byte, nút dọn enabled, reason/consequence hiện. Không dọn dữ liệu thật lượt này. SystemJunk0Beligible do báo cáo cá nhân đều còn mới; không mở log/temp/system theo tên chung. [Evidence](../quick_cleanup_validation_evidence.json).
