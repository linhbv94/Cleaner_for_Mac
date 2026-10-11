# Truth implementation local — 2026-10-10

> **Contract mới nhất:** [spec21](21_quick_scan_clean_parity.md) mở lại gate Quick, bỏ filter vendor rộng, yêu cầu mọi target trong kết quả dọn có grant và actual cleanup/rescan; inventory updater/state giữ riêng. Các mức15/97/321MB và nghiệm thu trước là lịch sử.


> **Ưu tiên hiện hành 2026-10-11:** [spec20](20_quick_release_priority.md) thay các yêu cầu adapter riêng cho mọi cache Quick và gate full-detail dưới đây. Cache thường MClean được maintenance; logs/temp ≥24giờ có guard runtime/IPC/quyền. Số 0B/15MB và trạng thái chỉ-adapter dưới đây là bằng chứng lịch sử, không mô tả source hiện hành. Kết quả gói cuối xem [checklist](../release_readiness_checklist.md).


Tài liệu này cập nhật baseline spec13 sau lượt triển khai; target đầy đủ ở spec14–16 không tự trở thành pass chỉ vì source/build đạt. Bản macOS local 0.1.0, chưa publish.

## Đã triển khai

- Quick native chỉ gọi System Junk/User Cache/Large Files, cả lúc revalidation; không probe Node/Brew/Docker CLI. Dedicated cache root bị bỏ qua trước đo dung lượng trong User Cache. File cá nhân mặc định bỏ tick/Trash; project/source/credential/database và runtime bị policy chặn.
- Cleanup và uninstall authority riêng. Rust bind scope từ snapshot, reject đổi scope/association; Swift kiểm tra protocol2.0/platform/policy/scope. API path compatibility vẫn lookup exact grants, không nhận safety do frontend khai.
- Executable registry macOS ở cleanup_policy.swift. Dọn chi tiết có metadata hậu quả, safety, lý do blocked; chọn/dọn từng nhóm hoặc xuyên nhóm; Select all chỉ mục eligible. JSON dictionary68 entries còn design-only, không chạy glob từ file đó.
- Cache được nhận diện: pip http-v2/wheels; npm _cacache; Brew downloaded archives; Chrome HTTP/code/graphics; CapCut CEF **child** HTTP/code/shader. Node runtime/_npx/project, updater, profile/cookie/session/offline DB/model và parent chứa child protected giữ lại. Tool cache đang dùng → blocked. Chrome/CapCut/cache frontend AI có popup Quit bình thường → quét lại đúng vùng đã chọn → dọn → mở lại; không force kill.
- Full bounded manifest device/inode/type/size/mtime/ctime; child mới/same inode thay đổi/symlink/hardlink/partial từ chối. Cache mutation chỉ regular files đã grant qua descriptor/no-follow + isolate-before-unlink; giữ directory và child mới. Không rm whole cache root.
- Orphan host gửi identity+manifest thật; heuristic absence không cấp authority cho unknown data. Uninstall retry residual sau bundle success được host completed-ticket hẹp cho phép; broad discovery no-admin. Lens boundary giữ nguyên, Trash không tính là physical space freed.
- Durable journal native intent/outcome + host outcome/interrupted; query history ở main, không tự replay delete. Shutdown stop-next-target và kill/reap owned process group sau grace; metrics child shutdown riêng. Byte counters là logical estimate.
- Menubar native dùng raster18/36 chính SVG user; OS template image18pt. Panel340px có CPU20samples/RAMbreakdown/disk/battery/error/theme/actions; left toggle, right native menu; Esc/blur đóng. Shared metrics singleflight/cache5s, foreground-only UI timers. Main close hide+Accessory; open/reopen Regular+focus; Quit cooperative shutdown. Mutations main-only, panel maintenance reads bị chặn.

## Giới hạn và các nhánh đang khóa

- System junk/temp/log và generic cache chưa có ownership/rotated/closed/layout proof: chỉ xem, không mặc định cấp quyền. Không dùng age30days như đủ proof. Xcode/Trash/Mail/Docker/AI legacy chưa có semantic adapter đủ evidence nên khóa mutation; AI history/images không xóa.
- Adobe cfa/pek hiện hiển thị nhưng **blocked**: chưa chứng minh source media và shared-helper lifecycle. Extension khác unknown.
- Lifecycle Quit/Cancel/reopen đã qua app AppKit fixture riêng. Chrome có restore-last-session nhưng phục hồi đầy đủ regular profiles/windows/pinned/groups **chưa QA**; không đồng nhất launch với restore, không đóng browser thật của user để test.
- Typed maintenance envelope đầy đủ/target-ID-only APIs chưa chuyển hết; giữ flat compatibility protocol2.0 với host shape/version checks. UUID tickets nội bộ apps/orphans, scope/identity/manifest được enforce; current UI vẫn app_id/path compatibility. Cancellation mutation qua shutdown marker; UI chưa có nút cancel mutation độc lập.
- Crash trong atomic isolation có thể để .vxclean_remove_UUID cạnh cache: journal thể hiện chưa rõ kết quả, không replay; chưa có recovery tự động restore isolated file. Race/power-loss không được tuyên bố loại hoàn toàn. Uninstall/Trash directory race sau check chưa có descriptor-relative Trash API; chưa chứng minh an toàn dưới attacker cùng user chạy đồng thời.
- Journal completed/recognized tự hết hạn sau180ngày; pending/unknown/reopen obligation giữ lại; history đọc toàn bộ đến5000entries, vượt giới hạn báo lỗi và chặn updater để không bỏ sót nghĩa vụ recovery. Đã nối single-instance plugin; direct binary launch, sleep/wake/multi-monitor/1x display và Windows chưa QA toàn diện.
- Trash fixture đã thành công ngoài sandbox với file và app giả lập, giữ source khi lỗi quyền trong sandbox. Không xóa user data/admin/FDA, không thay app installed/phát hành.

## Checks

Native fixture19groups, gồm Quick/noCLI cả revalidation, protected/newchild/hardlink, CapCutchild/profile/project, protocol/scope, durable journal và **Rust orphan producer → Swift consumer**. Rust lib14tests (roundtrip thực thi trong fixture env); frontend build, retention10cases, uninstalldefaults5cases, circlegeometry18cases. Packaged/native GUI evidence và hash ghi trong [báo cáo local](../local_completion_report.md) sau QA.

## AI Apps mới

Scanner quét Codex/Antigravity/ChatGPT thay rule Ollama/LM Studio của MClean. Rule dọn hẹp: Codex `Library/Caches/Codex/Default` và AS Antigravity/Antigravity IDE → Cache/Code Cache/GPU/Dawn child. CachedData/logs/updater/cache DB, lịch sử, ảnh/artifact và plugin/runtime hiển thị nhưng giữ lại. ChatGPT chưa thấy layout độc lập đủ xác minh nên không tự cấp mutation. Fixture18 chứng minh cache AI exact bị dọn, history/state/plugin giữ nguyên; chưa chứng minh cold-start mọi version AI/MCP trên thiết bị khác. UI phân biệt bytes phát hiện và bytes có thể chọn.

Updater đã nối kiểm tra/cài xác nhận và host quiescence; chưa runtime-test chuỗi update thật. CI cũ MClean được thay bằng checks/package preparation VXClean hai kiến trúc, chưa chạy remote. Node lockfile riêng audit0; khóa private local gitignored, không upload secrets/publish.

### QA tiếp nối Chrome và menubar

Hiện tại native20nhóm/Rust20đạt. Chrome9/9cache0failure/804.438.535logicalbytes;50profile fileSHA256giữ khi đóng;8window/90browser tab trước/sau (1QA), VL3tab giữ order/selected. Đã đóng riêng nhóm QA có thể mở lại, không Delete Group từ các thiết bị sync. [Evidence](../chrome_cleanup_runtime_evidence.json). Icon rawstride sửa5184bytes/36×36; alphaPNG/compile-timeassert đạt, physical tray click còn chưa kiểm chứng. Full scope release-ready vẫnfalse.

## Quét nhanh — cập nhật tiếp2026-10-10

Adapter mới cho HTTPpayload UUID tại fsCachedData của helpd/tipsd/AMPLibraryAgent; giữ parent/database/WAL/SHM/HSTS/state. Diagnostic cá nhân .ips/.crash/.diag trực tiếp cũ≥7ngày có thể chọn, mặc định bỏ chọn vì báo cáo cũ không tái tạo. System/temp/log khác vẫn khóa. UI hiển thị lý do khóa, hậu quả và tổng phát hiện/đủ điều kiện riêng.22nativegroups/20Rust đạt: Foundation cold cache500KB→native dọn payload→cache miss→tạo lại500KB; database/state giữ bytes; báo cáo mới/type sai/nested bị từ chối. Scan thật chỉ đọc~15MB cacheeligible; không dọn dữ liệu thật lượt này. [Spec](19_quick_cleanup_validation.md) · [Evidence](../quick_cleanup_validation_evidence.json). Gói/QA UI ghi trạng thái hiện tại trong evidence, không suy từ build sang nghiệm thu mọi scope.
