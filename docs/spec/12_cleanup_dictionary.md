# Từ điển local cho toàn bộ Dọn rác chi tiết

> **Contract chuẩn bị release — 2026-10-10:** [Scope mới](14_quick_detailed_scope.md), [policy backend](15_cleanup_protection_policy.md), [menubar/Dock](16_menubar_release_ui.md) và [API/QA hiện hành](00_system_overview.md) ưu tiên cho target mới. Giữ nội dung dưới làm lịch sử/chi tiết không mâu thuẫn; không áp yêu cầu giữ nguyên Quick cũ hoặc coi policy/tray đã triển khai.


Ngày cập nhật: 2026-10-10. Trạng thái: metadata từ registry executable đã nối engine/UI; JSON68entries còn design-only, không cấp quyền mutation. Mức nghiệm thu ở [spec17](17_local_implementation_status.md). Dictionary áp dụng Dọn chi tiết; scope Quick được quyết định riêng ở spec 14.

Scope và flow bulk mới nhất ở [spec 14](14_quick_detailed_scope.md): Quick được thu hẹp theo quyết định mới của user; dictionary vẫn áp toàn Detail. Có dọn từng nhóm, dọn các mục đã chọn xuyên nhóm và Chọn tất cả cấp tổng quan có hậu quả/giới hạn rõ ràng. Những action này chưa được triển khai đầy đủ. Safety/protected policy dùng chung tại backend để Quick không vượt qua các nhánh Detail cần giữ; không áp trực tiếp defaults từ JSON design-only vào Quick.

## Quyết định đã chốt

- Mọi dòng Dọn rác chi tiết phải giải thích mình là gì, xóa phần nào, tác động và phần cần giữ. Áp dụng System Junk, User Cache, Large & Old, Mail, Trash, Xcode, Brew, Node, Docker, AI Apps, Orphans và Media Apps/Chrome mới.
- Dòng an toàn tái tạo **có tick mặc định khi adapter và môi trường đã được kiểm chứng**. Dòng dữ liệu cá nhân, rủi ro hoặc chưa rõ vẫn hiển thị, mặc định không tick. Không coi research-only như safety test đã pass.
- Có checkbox **Chọn tất cả** cho danh mục/danh sách đang xem, không âm thầm chọn danh mục ẩn. Nó chọn cả mục rủi ro có hỗ trợ mutation; có trạng thái indeterminate và Bỏ chọn tất cả. Mục thông tin/critical/unsupported vẫn không được cấp quyền xóa.
- Tick là lựa chọn, không phải mutation authorization. Trước Dọn hiển thị tổng mục/dung lượng và hậu quả của các mục rủi ro; user đã tick all vẫn phải thấy rõ “Xóa project”, “Mất bản phục hồi”, “Xóa vĩnh viễn”. Không silently skip rủi ro rồi gọi là đã chọn tất cả.

## Tách dọn rác và gỡ app

`operation_scope` bắt buộc là `detailed_cleanup`, `quick_cleanup`, `uninstall`, `orphan_cleanup` hoặc `lens_trash`; grant không dùng chéo.

- **Dọn rác CapCut:** exact CEF HTTP/code/shader/log; project/resources bị bỏ chọn và giải thích hậu quả. Nếu hỗ trợ opt-in xóa dữ liệu cá nhân thì cần policy/adapter riêng, không tự mở broad root cleanup.
- **Gỡ CapCut:** bundle + known residuals + candidate `~/Movies/CapCut` từ app association; có thể chọn cả folder để bỏ app và toàn bộ project/data. Candidate broad discovery vẫn mặc định không tick; UI phải nói rõ không chỉ cache. Không dùng dictionary “rebuildable cache” để tự chọn root này. Recheck association/identity trước Trash, không admin fallback cho broad candidate.
- Cùng file xuất hiện ở nhiều mục chỉ được tính/xóa một lần; ưu tiên rule cụ thể, phân hoạch parent/child. Parent có dữ liệu bảo vệ không thể nhận nhãn safe vì một child safe.

## Contract của từ điển

Source thiết kế machine-readable: [cleanup_dictionary.json](../cleanup_dictionary.json), version 0.1.0, 68 entries. Đây là tài sản local có version; path selector hiện là mô tả thiết kế, **không phải glob được phép chạy**.

Policy implementation mới nhất ở [15](15_cleanup_protection_policy.md), [contract bảo vệ](../cleanup_protection_contract.json). Dòng cache đã validation có thể tick để vào Quit flow; preconditions được enforce trước mutation, không lấy `lifecycle conditions satisfied` trong JSON design-only làm lý do bỏ flow tự Quit. Target DTO/API và journal theo spec 04/15; chưa có runtime registry nối 68 entries.

Mỗi rule có `rule_id`, category, title/description/consequence tiếng Việt, safety, default, selection_mode, matching_scope, validation_status và evidence_refs. UI không tự suy an toàn theo tên path; adapter emit rule_id sau match canonical exact scope. DTO dự kiến thêm `operation_scope`, `dictionary_version`, `rule_id`, `effective_safety`, `default_selection_reason`, `conditions`, `can_delete`, `blocked_reason`, app/platform/version/layout context. Không dùng `is_cleanable=true` như bằng chứng semantic safety.

Safety: `rebuildable` (cache có căn cứ tái tạo), `user_data` (xóa có hậu quả người dùng), `unknown` (chưa xác định), `protected` (không cho mutation ở scope này). Badge lần lượt “Có thể tạo lại”, “Có thể mất dữ liệu”, “Chưa xác minh”, “Được bảo vệ”. Tránh chữ “an toàn tuyệt đối”. Log cũ là `rebuildable` ở đây theo khả năng app tiếp tục hoạt động, nhưng log đã xóa không tái tạo được; consequence phải nói mất bằng chứng chẩn đoán.

Detail UI mỗi dòng: tên + một câu hậu quả + badge; nút thông tin mở phần đầy đủ, target thật, method Trash/remove, điều kiện đóng app, phần giữ, evidence/validation. Không đưa schema/internal IDs vào UI người dùng. Dung lượng có thể thu hồi và Trash bytes phải phân biệt.

## Ma trận giải thích local

| Mã | Nhóm | Hạng mục | Khi tick và dọn | Mức | Tick thiết kế |
|---|---|---|---|---|---|
| capcut_http | media_apps | CapCut — Cache web | Phải đóng CapCut; lần mở sau tải hoặc biên dịch lại, có thể chậm hơn. | rebuildable | Có, sau validation |
| capcut_code | media_apps | CapCut — Cache mã giao diện | Phải đóng CapCut; lần mở sau tải hoặc biên dịch lại, có thể chậm hơn. | rebuildable | Có, sau validation |
| capcut_gpu | media_apps | CapCut — Cache dựng hình | Phải đóng CapCut; lần mở sau tải hoặc biên dịch lại, có thể chậm hơn. | rebuildable | Có, sau validation |
| capcut_dawn | media_apps | CapCut — Cache Dawn | Phải đóng CapCut; lần mở sau tải hoặc biên dịch lại, có thể chậm hơn. | rebuildable | Có, sau validation |
| capcut_shader | media_apps | CapCut — Cache shader | Phải đóng CapCut; lần mở sau tải hoặc biên dịch lại, có thể chậm hơn. | rebuildable | Có, sau validation |
| capcut_graphite | media_apps | CapCut — Cache Graphite | Phải đóng CapCut; lần mở sau tải hoặc biên dịch lại, có thể chậm hơn. | rebuildable | Có, sau validation |
| capcut_legacy_shader | media_apps | CapCut — Cache shader bổ sung | Phải đóng CapCut; lần mở sau tải hoặc biên dịch lại, có thể chậm hơn. | rebuildable | Có, sau validation |
| capcut_resources | media_apps | CapCut — Effect/nhạc/font | Project có thể mất hiệu ứng, âm thanh hoặc font; tải lại không được bảo đảm. | user_data | Không |
| capcut_music | media_apps | CapCut — Nhạc và beat | Project có thể mất âm thanh/beat. | user_data | Không |
| capcut_resource_db | media_apps | CapCut — Database tài nguyên | Có thể mất catalog, favorite và trạng thái tài nguyên. | user_data | Không |
| capcut_smartcrop | media_apps | CapCut — Kết quả SmartCrop | Có thể mất kết quả xử lý media đang phục vụ project. | unknown | Không |
| capcut_network | media_apps | CapCut — Media phát qua mạng | Có thể mất nội dung offline, cần tải lại. | unknown | Không |
| capcut_fontimage | media_apps | CapCut — Ảnh chữ/font | Có thể ảnh hưởng render chữ nếu tài nguyên gốc không còn. | unknown | Không |
| capcut_images | media_apps | CapCut — Ảnh và template | Có thể là asset đang dùng, không phải mọi ảnh đều là preview. | unknown | Không |
| capcut_download | media_apps | CapCut — Tài nguyên tải xuống | Có thể mất asset/template offline. | unknown | Không |
| capcut_ai_template | media_apps | CapCut — Template AI | Có thể mất template hoặc tài nguyên project. | unknown | Không |
| capcut_gecko | media_apps | CapCut — Module nhúng | Tái tạo chưa được xác minh; có thể ảnh hưởng tính năng. | unknown | Không |
| capcut_project | media_apps | CapCut — Project | Xóa project, media và bản phục hồi nằm trong mục đã chọn. | user_data | Không |
| capcut_state | media_apps | CapCut — Thiết lập và state | Có thể reset thiết lập hoặc trạng thái tài khoản. | user_data | Không |
| capcut_cef_state | media_apps | CapCut — dữ liệu webview | Có thể mất đăng nhập, nội dung offline và trạng thái giao diện. | user_data | Không |
| adobe_cfa | media_apps | Adobe — Audio conform | Đóng Premiere/After Effects/Media Encoder liên quan; tạo lại chậm và cần source media còn truy cập được. | rebuildable | Có, sau validation |
| adobe_pek | media_apps | Adobe — Waveform | Đóng Premiere/After Effects/Media Encoder liên quan; tạo lại chậm và cần source media còn truy cập được. | rebuildable | Có, sau validation |
| adobe_other_media | media_apps | Adobe — Cache media chưa xác định | File .ims/.prmdc2 chưa xác minh đủ; chưa bật mutation adapter. | unknown | Không |
| adobe_ccx | media_apps | Adobe — Learn/Stock/Discover assets | Có template .psdt và media tải về; có thể mất tài nguyên dùng offline. | unknown | Không |
| adobe_templates | media_apps | Adobe — Template Motion Graphics | Mất template .mogrt và tài nguyên phục vụ project. | user_data | Không |
| adobe_dunamis | media_apps | Adobe — Dữ liệu Dunamis | Chưa xác định vai trò/tái tạo; không coi là junk. | unknown | Không |
| adobe_state | media_apps | Adobe — Thiết lập, plugin và sync | Có thể reset tài khoản/cấu hình hoặc làm app/đồng bộ lỗi. | user_data | Không |
| system_junk_unknown | system_junk | Chưa phân loại hạng mục này | Có thể mất dữ liệu/state; không chọn mặc định và không cho dọn khi thiếu adapter được duyệt. | unknown | Không |
| user_caches_unknown | user_caches | Chưa phân loại hạng mục này | Có thể mất dữ liệu/state; không chọn mặc định và không cho dọn khi thiếu adapter được duyệt. | unknown | Không |
| ai_apps_unknown | ai_apps | Chưa phân loại hạng mục này | Có thể mất dữ liệu/state; không chọn mặc định và không cho dọn khi thiếu adapter được duyệt. | unknown | Không |
| chrome_unknown | chrome | Chưa phân loại hạng mục này | Có thể mất dữ liệu/state; không chọn mặc định và không cho dọn khi thiếu adapter được duyệt. | unknown | Không |
| xcode_junk_unknown | xcode_junk | Chưa phân loại hạng mục này | Có thể mất dữ liệu/state; không chọn mặc định và không cho dọn khi thiếu adapter được duyệt. | unknown | Không |
| brew_cache_unknown | brew_cache | Chưa phân loại hạng mục này | Có thể mất dữ liệu/state; không chọn mặc định và không cho dọn khi thiếu adapter được duyệt. | unknown | Không |
| node_cache_unknown | node_cache | Chưa phân loại hạng mục này | Có thể mất dữ liệu/state; không chọn mặc định và không cho dọn khi thiếu adapter được duyệt. | unknown | Không |
| docker_cache_unknown | docker_cache | Chưa phân loại hạng mục này | Có thể mất dữ liệu/state; không chọn mặc định và không cho dọn khi thiếu adapter được duyệt. | unknown | Không |
| mail_downloads_unknown | mail_downloads | Chưa phân loại hạng mục này | Có thể mất dữ liệu/state; không chọn mặc định và không cho dọn khi thiếu adapter được duyệt. | unknown | Không |
| trash_bin_unknown | trash_bin | Chưa phân loại hạng mục này | Có thể mất dữ liệu/state; không chọn mặc định và không cho dọn khi thiếu adapter được duyệt. | unknown | Không |
| large_files_unknown | large_files | Chưa phân loại hạng mục này | Có thể mất dữ liệu/state; không chọn mặc định và không cho dọn khi thiếu adapter được duyệt. | unknown | Không |
| orphan_residues_unknown | orphan_residues | Chưa phân loại hạng mục này | Có thể mất dữ liệu/state; không chọn mặc định và không cho dọn khi thiếu adapter được duyệt. | unknown | Không |
| system_temp | system_junk | File tạm hệ thống | File đang dùng có thể làm dịch vụ lỗi; cần rule và kiểm chứng riêng. | unknown | Không |
| user_log | system_junk | Nhật ký cũ | Mất log debug cũ; giữ file active và phiên gần nhất. | rebuildable | Có, sau validation |
| generic_app_cache | user_caches | Cache ứng dụng | Tên Cache không đủ chứng minh an toàn; cần phân loại nhánh. | unknown | Không |
| updater_staging | user_caches | Bộ cập nhật đang lưu | Xóa có thể làm update thất bại; không chọn mặc định. | unknown | Không |
| chrome_http | chrome | Chrome — cache web | Đóng Chrome; lần tải trang sau cần tải lại, giữ cookie/tab/session. | rebuildable | Có, sau validation |
| chrome_code | chrome | Chrome — cache mã | Đóng Chrome; biên dịch lại, có thể tải trang chậm lần đầu. | rebuildable | Có, sau validation |
| chrome_gpu | chrome | Chrome — cache đồ họa | Đóng Chrome; tạo lại cache dựng hình. | rebuildable | Có, sau validation |
| chrome_site | chrome | Chrome — dữ liệu website | Có thể mất nội dung offline và dữ liệu website chưa đồng bộ. | user_data | Không |
| chrome_model | chrome | Chrome — model AI | Có thể mất tính năng offline hoặc tải lại nhiều GB. | unknown | Không |
| ai_frontend | ai_apps | AI — cache giao diện | Đóng app và helper; tải/biên dịch lại, giữ conversation/tool runtime. | rebuildable | Có, sau validation |
| ai_history | ai_apps | AI — lịch sử hội thoại | Mất lịch sử hoặc khả năng resume; 6 tháng chỉ là retention dự kiến. | user_data | Không |
| ai_history_image | ai_apps | AI — ảnh trong lịch sử | Chat cũ không xem lại được ảnh; user chấp nhận nhưng phải có ownership mapping và bảo vệ task active. | user_data | Không |
| ai_runtime | ai_apps | AI — runtime/MCP/plugin | Có thể làm tool/agent ngừng chạy; không phải cache dọn thường. | protected | Không |
| ai_saved_state | ai_apps | AI — trạng thái cửa sổ | Có thể mất trạng thái cửa sổ hoặc auth/offline data. | user_data | Không |
| xcode_derived | xcode_junk | Xcode — DerivedData | Đóng Xcode; build/index lần sau mất thời gian; cần source/dependency còn đủ. | rebuildable | Có, sau validation |
| xcode_archive | xcode_junk | Xcode — Archives | Có thể mất bản để phân phối hoặc symbol cần đọc crash; không chọn mặc định. | user_data | Không |
| xcode_cache | xcode_junk | Xcode — simulator/cache | Chưa coi nguyên simulator/device data là cache; có thể phải tải/tạo lại. | unknown | Không |
| brew_download | brew_cache | Brew — cache tải xuống | Cần tải lại khi cài/reinstall; không đụng Cellar/runtime, không dọn khi brew chạy. | rebuildable | Có, sau validation |
| npm_download | node_cache | npm — cache tải xuống | Có thể cần mạng để tải lại; tránh manager đang chạy. | rebuildable | Có, sau validation |
| npx_runtime | node_cache | npx — môi trường tool | Tool có thể lỗi hoặc phải cài lại; không chọn mặc định. | user_data | Không |
| yarn_pnpm_store | node_cache | Yarn/pnpm — cache/store | Chưa coi toàn store disposable; cần manager lifecycle và test mode liên kết. | unknown | Không |
| docker_cache | docker_cache | Docker — cache/build data | Đang dùng có thể làm build/daemon lỗi; cần Docker lifecycle, không xóa VM disk/volumes. | unknown | Không |
| docker_reclaimable | docker_cache | Docker — dung lượng reclaimable | Chỉ thông tin; không xóa executable hoặc tự chạy prune. | protected | Không |
| mail_attachment | mail_downloads | Mail — tệp đính kèm tải về | Có thể mất bản offline/chỉnh sửa; không bảo đảm còn trên server. | user_data | Không |
| trash_content | trash_bin | Thùng rác | Xóa vĩnh viễn, mất khả năng Put Back từ Trash. | user_data | Không |
| large_personal | large_files | Tệp lớn hoặc cũ | Lớn/cũ không đồng nghĩa rác; có thể mất tài liệu/source/ảnh gốc. | user_data | Không |
| orphan_cache | orphan_residues | Cache có vẻ mồ côi | Không thấy app không chứng minh data vô dụng; cần rule riêng. | unknown | Không |
| orphan_data | orphan_residues | Dữ liệu có vẻ mồ côi | Có thể mất project, settings hoặc app ở vị trí khác; hiện mutation bị policy chặn. | protected | Không |
| critical | system_junk | Dữ liệu được bảo vệ | Không cho xóa; Select all không được vượt policy. | protected | Không |

## Môi trường khác và fallback

Baseline: macOS 26.7 quan sát tại máy khảo sát, CapCut 9.5.0 và các đường dẫn trong báo cáo. Đây không phải declaration toàn bộ OS/app version được hỗ trợ. `home` resolve theo user thật, không hardcode /Users/vic. Một tên folder giống nhau trên Windows không chứng minh semantics giống nhau.

Platform adapter phải có bundle/package identity, app version/layout fingerprint, allowed/protected roots, lifecycle, deletion method và môi trường tests. Platform/version/layout mới: giữ explanation nếu nhận diện được loại dữ liệu, hạ safety về unknown và bỏ tick cho tới validate; không copy rule macOS thành %APPDATA% máy móc. Dữ liệu không khớp rule dùng fallback rõ hậu quả chưa biết, không nhãn cache safe. Đồng bộ trạng thái từ điển/match/policy tại scan và trước xóa.

Xem [tổng quan đa thiết bị](../../../_summary/master_overview.md). Việc ghi safety cho detail không tự sửa defaults scanner gốc; sự lệch hiện tại được ghi trong [audit engine](13_engine_behavior_truth.md).

## Acceptance để nối sau

Mọi item có rule hoặc fallback; snapshot explanation đúng file; safe chỉ tick khi validation và lifecycle đủ; risky/unknown false; Select all chọn đúng mục đang xem nhưng không cấp quyền critical; confirm liệt kê hậu quả data; unsupported không gọi filesystem deletion; người dùng hủy/save dialog cancel không mutation. Negative fixtures chứa sibling path/symlink/nested protected/database/project/runtime. Rule upgrade làm cũ scan thì require rescan, không tái sử dụng grant với nghĩa dictionary mới. Baseline và 2 home paths khác nhau cho cùng semantics; Windows chưa test không được bật default.
