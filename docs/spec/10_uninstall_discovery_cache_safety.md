# Quét rộng khi gỡ ứng dụng và an toàn cache động

> **Contract chuẩn bị release — 2026-10-10:** [Scope mới](14_quick_detailed_scope.md), [policy backend](15_cleanup_protection_policy.md), [menubar/Dock](16_menubar_release_ui.md) và [API/QA hiện hành](00_system_overview.md) ưu tiên cho target mới. Giữ nội dung dưới làm lịch sử/chi tiết không mâu thuẫn; không áp yêu cầu giữ nguyên Quick cũ hoặc coi policy/tray đã triển khai.

Ngày: 2026-10-10 — trạng thái: đã triển khai source macOS, kiểm chứng native/fixture; chưa QA visual hoặc phát hành

## Quyết định user
- Dữ liệu tìm bằng quét rộng khi gỡ app không được chọn mặc định.
- Đường dẫn cache lấy từ CLI không phải bằng chứng cho phép xóa.

## Phạm vi và contract
- Lập chỉ mục tên đường dẫn một lần mỗi lượt native apps/uninstall, trong Home: Movies, Documents, Downloads, Desktop, Music, Pictures và Library/Application Support, Caches, Logs, Containers, Application Scripts. Chỉ thư mục, không đọc nội dung file; không theo symlink, không đi vào package; tối đa 3 tầng/20.000 mục/3 giây. Không cam kết tìm mọi dấu vết; vùng thiếu quyền hoặc vượt giới hạn phải báo chưa đầy đủ.
- So khớp chính xác tên folder với tên bundle/display name hoặc bundle ID; tên app dưới 4 ký tự không dùng heuristic. Không match substring. Loại trùng/ancestor với các mục đã biết. Nhóm discovery: `file_type=discovered`, `discovery_reason`, `is_selected_by_default=false`; UI nhãn Có thể liên quan, luôn bỏ chọn khi chọn app/refresh.
- Các mục gỡ hiện có giữ nguyên defaults. Mục discovery có thể chứa project: chỉ Trash sau khi user chọn và xác nhận, native xác thực lại ứng viên, grant và identity như trước; không admin fallback cho discovery.
- Node cache: allowlist độc lập chỉ chấp nhận npm trong ~/.npm hoặc ~/.cache/npm; Yarn trong ~/Library/Caches/Yarn hoặc ~/.cache/yarn; pnpm trong ~/Library/pnpm/store hoặc ~/.local/share/pnpm/store. Đường dẫn phải tuyệt đối, không dot traversal/control/newline, không symlink, là directory thật. Ngoài allowlist bị bỏ qua và đưa vào báo cáo đường dẫn chưa được hỗ trợ. Kiểm tra lại policy ở bước xóa. Custom cache ở Documents, Home, System, ổ ngoài không tự được phép; bổ sung nơi mới cần rule kiểm chứng.

## Nghiệm thu
- Fixture ứng dụng có dữ liệu Movies tìm thấy nhưng mặc định bỏ chọn; tên gần giống, symlink, package, root không được nhận diện.
- CLI npm trả Home/Documents/System/đường dẫn tương đối/symlink không được đưa vào mục dọn; cache hợp lệ được nhận diện.
- Native từ chối xóa custom cache ngoài allowlist, giữ byte fixture. UI defaults không chọn discovery. Build frontend và regression native đạt; không dọn dữ liệu user.

## Kết quả và giới hạn
- Native regression: 11 nhóm đạt; có CLI giả trả Documents/Home/System/relative/traversal/symlink và custom npm hợp lệ; đường dẫn nguy hiểm bị bỏ qua, thao tác dọn bị từ chối, byte Documents giữ nguyên. 5 tests defaults UI và 6 Rust grant/identity tests đạt. Frontend build và diff whitespace đạt.
- Native production đọc máy thật: 13,35 giây cho toàn bộ danh sách app (bao gồm đo dung lượng bundle và dữ liệu); tìm `/Users/vic/Movies/CapCut`, 1.991.155.712 bytes allocated, discovery mặc định false. `discovery_incomplete=true` được chuyển tới UI. Giới hạn 3 giây áp dụng lập chỉ mục tên, không phải toàn bộ đo dung lượng/app listing.
- Không xóa dữ liệu user hoặc cấp quyền mới. Regression Trash trên fixture bị sandbox từ chối; kiểm chứng được báo lỗi/giữ nguồn, chưa chứng minh Trash thành công trong lượt này. Chưa runtime visual của app hoặc Windows; chưa rebuild bộ cài/thay app đang cài, commit/push/release.
- Quét theo tên vẫn có false positives/negatives: không tìm nội dung file, folder ẩn, đường dẫn tự đặt tên khác app hoặc sâu hơn 3 tầng. Engine chưa cam kết gỡ mọi dấu vết hoặc an toàn toàn hệ thống; scope safety tổng thể trong backlog còn phải kiểm chứng độc lập.
- Đường dẫn cache bị policy từ chối nằm trong `unsupported_cache_paths`, không gán nhầm là lỗi Full Disk Access. Mở rộng allowlist sau này phải có rule và fixtures tương ứng.

## Bổ sung triển khai tách operation scope — 2026-10-10

- Scan native trả `operation_scope=quick_cleanup|detailed_cleanup`. Host lấy scope từ kết quả đã giữ, không tin scope/association do UI tự gửi; từ chối đổi scope hoặc gửi `authorized_app` vào cleanup.
- Native kiểm tra scope khớp command trước mutation: cleanup, uninstall, orphan_cleanup và lens_trash không dùng chéo. Revalidation cleanup giữ scope của lần scan. CLI mutation cũ thiếu scope bị từ chối; các producer host đã bổ sung scope tương ứng.
- Uninstall vẫn có discovery `~/Movies/<app>` mặc định bỏ chọn; lựa chọn này đi qua association/identity rồi Trash, không admin fallback. Cleanup không dùng app discovery để cấp quyền xóa cả root.
- Đây là sửa ranh giới operation, chưa triển khai toàn bộ policy/registry/protocol 2.0 trong spec 15, cũng chưa đổi danh sách scanner Quick sang ba nhóm của spec 14. Không coi mọi cache hiện tại đã được chứng minh an toàn.
- Kiểm chứng: Rust 7 tests; native fixture 12 nhóm, gồm project root chỉ thuộc uninstall và payload scope sai giữ nguyên dữ liệu; frontend production build và 5 tests uninstall defaults đạt. Sandbox từ chối Trash fixture: xác minh được association tới bước Trash và failure reporting, chưa xác minh Trash thành công/native GUI trên app đang cài.
