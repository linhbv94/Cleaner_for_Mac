# Đối soát engine hiện tại và contract mục tiêu

> **Cập nhật implementation local 2026-10-10:** xem [truth sau triển khai](17_local_implementation_status.md) và [báo cáo build/QA](../local_completion_report.md). Nội dung target dưới đây không đồng nghĩa mọi gate đã pass; các nhánh thiếu evidence đang blocked.


> **Contract chuẩn bị release — 2026-10-10:** [Scope mới](14_quick_detailed_scope.md), [policy backend](15_cleanup_protection_policy.md), [menubar/Dock](16_menubar_release_ui.md) và [API/QA hiện hành](00_system_overview.md) ưu tiên cho target mới. Giữ nội dung dưới làm lịch sử/chi tiết không mâu thuẫn; không áp yêu cầu giữ nguyên Quick cũ hoặc coi policy/tray đã triển khai.


Ngày cập nhật: 2026-10-10. Phạm vi: source local working tree, không chỉ HEAD; review chỉ đọc các nhánh desktop maintenance/telemetry và scanner/policy liên quan. Không sửa engine, không rerun mutation tests, không xác nhận installed bundle tương đương source. Đây là truth của implementation được đọc, không phải chứng nhận toàn diện an toàn.

## Thứ tự đọc spec

Tài liệu này sửa các mô tả implementation cũ trong 00–06; 10 giữ broad uninstall/Node path protection; 11 là target app lifecycle; 12 là target dictionary. [Spec 14](14_quick_detailed_scope.md) là scope sản phẩm mới nhất: Quick ba nhóm, Node/Brew và nhóm chuyên biệt sang Detail; cache build thực sự disposable được dọn; Node chỉ exact cache, không runtime. Yêu cầu giữ nguyên Quick trước đây đã được thay. Khi mục tiêu chưa có trong source, giữ nhãn “chưa triển khai”; các mục implementation bên dưới vẫn mô tả source hiện tại, không phải target đã chạy.

## 1. Đường thực thi và dữ liệu thật

Desktop: React bridge → Tauri Rust maintenance_bridge → Swift MaintenanceCLI → ScanEngine/orphan/CompactLensScanner. **Cleanup desktop không dùng CleaningEngine nguyên bản MClean**; sự lệch allowlist .ollama/.lmstudio của MClean không tự là lỗi VXClean. Browser Preview có mock scan/clean/apps/lens/orphans; desktop không fallback mock khi native lỗi. Metrics preview báo không có engine.

Metrics Swift dùng SystemMonitor, sample CPU delta trong khoảng 2,1 giây rồi kết thúc; Rust telemetry timeout 6 giây, validate protocol_version/platform. RAM là active + wired + compressed; disk dùng total - available; battery từ OS. Không coi lịch sử CPU 30 mẫu của class monitor là lịch sử dashboard desktop tồn tại xuyên subprocess. Menu bar lifecycle ở spec cũ là mục tiêu riêng, chưa chứng minh feature desktop đã nối trong lượt audit này.

Maintenance DTO là final JSON stdout + event JSON stderr, không có version/platform envelope như metrics; Rust execute parse JSON Value, không validate schema chặt tương đương telemetry. Input Swift stdin <4 MB, stdout Rust <=32 MB, maintenance timeout 120 giây. Scan/lens có cancellation ID; clean không đăng ký cancellation tương đương scan. Hết timeout sau mutation có thể không nhận được final per-file report; hiện không có durable mutation journal/Undo cho cleanup.

## 2. Scanner: tất cả category và defaults thực tế

Quick và Detailed gọi cùng `scan --all`. Detailed thêm `--include-empty`; khác hiển thị nhóm rỗng, **chưa khác engine scope**. UI quick sort System Junk → User Cache → Large & Old → Node → Brew rồi nhóm còn lại; không phải chỉ scan 5 nhóm. Engine scannable có 10 nhóm, trừ smartScan/purgeableSpace. Xcode/AI/Docker vắng dữ liệu được ẩn trong quick, không có nghĩa engine không thử quét.

| Nhóm | Phạm vi source hiện tại | Default source/giới hạn |
|---|---|---|
| System Junk | /Library/Caches, /Library/Logs, /private/var/log, ~/Library/Logs, /tmp, /private/var/tmp; direct child + size subtree | Mục >1 KB được chọn; không có chứng minh mọi root child đều disposable/không critical |
| User Cache | Direct child ~/Library/Caches trừ Homebrew/ollama roots riêng; thêm npm _cacache, pip/yarn/pnpm cache paths | Chọn mục đủ size; có thể bao updater/profile. Dictionary chưa phân loại |
| AI Apps | 8 targets Ollama/LM Studio: logs/cache/WebKit/saved state + optional history | History/conversations false; không Codex/Anti/ChatGPT mới |
| Mail | Hai Mail Downloads user/container roots | Scanner default true; adapter dùng Trash; không email DB toàn bộ |
| Trash | Direct children ~/.Trash | Default true, remove_item vĩnh viễn |
| Large & Old | Downloads/Documents/Desktop; regular files; >100 MB hoặc >10 MB và mtime >12 tháng mặc định | Default false; thresholds/settings/excluded folders theo scanner; không tự nghĩa junk |
| Xcode | DerivedData, Archives, CoreSimulator/Caches, com.apple.dt.Xcode cache | Tất cả source true, **Archives true dù user data**; không DeviceSupport/simulator runtimes toàn bộ |
| Brew | Cache user + known roots từ brew --cache; không chấp nhận custom arbitrary ngoài allowlist | Default true; lifecycle manager chưa bảo vệ đầy đủ |
| Node | npm/yarn/pnpm cache/store roots + CLI-reported roots qua policy realpath/allowlist | Default true; npm nguyên .npm gồm _npx. Path safety không bằng runtime/MCP safety |
| Docker | Các cache/log/tmp/container group/CLI/buildx roots, thêm reclaimable từ docker system df | Folder source true; reclaimable informational false/is_cleanable=false, không xóa docker binary |

`scanDirectory(recursive:maxDepth:)` hiện chỉ list direct children; tham số recursive/maxDepth không tạo DTO sâu. directorySize vẫn tính subtree để ra size. Không mô tả là scan giới hạn độ sâu đã bảo đảm tài nguyên hoặc cây cleanup sâu. Scanner/adapter lọc symlink/canonical path nhưng chưa có independent semantic protection chung cho mọi system target. Unreadable paths trả nhóm fda_limited_categories; không phải mọi lỗi đọc đều chỉ do FDA.

Purgeable/APFS/Time Machine code tồn tại upstream nhưng không trong desktop scannable, không được gọi là action dọn root /; UI storage informative nếu có không cấp grant xóa.

## 3. Mutation cleanup và bảo vệ thực tế

Rust lưu grants/identities device+inode trong RAM tối đa 15 phút, có cap 32 grants; mutation mutex; target phải đúng path/method, không duplicate, 1–10.000 item. Swift re-scan all khi clean rồi kiểm tra exact method/path, canonical/symlink/identities, yêu cầu confirm_direct_delete nếu không Trash. Không tin phương thức do UI đổi để nâng quyền.

Method hiện tại: Large Files/Mail/Xcode Archives/Ollama history/LM Studio conversations → Trash; phần cleanup còn lại remove_item. Cleanup thường **không có admin fallback tự động**, requires_admin chỉ cho thấy không writable. Admin fallback chỉ uninstall với explicit flag, lỗi quyền và không broad-discovered target; gọi admin shell quoting và stat guard. Không sửa spec thành System Junk luôn chạy rm root/admin.

Xcode guard đang kiểm tra path chứa /Library/Developer/Xcode/ và bundle Xcode đang chạy, chỉ trả skipped yêu cầu tự đóng; chưa popup Quit/reopen. Không có app lifecycle guard tương đương cho toàn cache Chrome/CapCut/Adobe/AI. Kiểm tra inode không kiểm tra nội dung thay đổi cùng inode hoặc child mới thêm vào folder giữa scan và remove; vẫn còn check/use window, không tuyên bố triệt tiêu TOCTOU.

Counts/bytes: scanner cleanup và size() mutation dùng logical fileSize nhưng traversal khác; inventory app dùng allocated, Lens dùng st_blocks và dedup inode. Trash bytes không phải space freed thực tế. Native có per-item success/skipped/permission_denied và freed/trashed tách riêng; lỗi IO khác có thể bị map skipped chứ không có error taxonomy chi tiết. Parent/child cùng method được coalesce trước mutation; tổng scan category có thể overlap (npm _cacache + nguyên .npm), không cam kết category totals luôn unique.

## 4. Uninstall: độc lập cleanup, gồm Movies/CapCut

App inventory các Applications roots độ sâu folder giới hạn, .app package; loại bundle com.apple.* và /System/* (rộng hơn chỉ SIP). Self app vẫn hiển thị flag bảo vệ. Associated known paths exact bundle ID tại Application Support/Caches/Preferences/Saved State/Logs/Containers/Application Scripts + bundle.

Broad discovery roots Home Movies/Documents/Downloads/Desktop/Music/Pictures và một số Library; BFS tối đa 3 tầng, 20.000 entries, 3 giây metadata index; không hidden/symlink/package. Match exact lowercased basename/displayName/bundle ID dài >=4, không substring. Match `~/Movies/CapCut` có thể gom **toàn bộ project/resources**, không chỉ cache. UI default helper bỏ chọn discovered; known residuals có thể chứa user data dù association đúng.

Giới hạn 3 giây chỉ index, không toàn lượt apps hoặc size traversal. Discovery partial trả discovery_incomplete; quyền đọc sâu size còn hạn chế reporting. Không quảng bá broad scan phát hiện mọi dư liệu mọi app.

Uninstall validate app metadata/inventory, reject app đang chạy, recheck association + identities; Trash selected known/discovered. Broad candidate không admin fallback. **Chọn Movies/CapCut trong uninstall được phép xóa cả root theo ý user; scope khác cache cleanup.** Không tự thay default false của broad discovery.

## 5. Orphans: phát hiện và lỗi integration cần sửa

Scan direct child user Library Caches/Logs/Application Support/Preferences, tên có dấu chấm, không com.apple.*, không match installed bundle IDs. App ở vị trí khác/CLI hoặc nickname khiến absence không phải proof orphan. OrphanSafetyPolicy cho volatile roots; Preferences/Application Support thường bị chặn. UI có thể cho thấy blocked candidates và không tick.

**Gap xác định từ source:** Rust `clean_orphans` validate targets nhưng không gọi bind_identities và không gửi identities trong payload, trong khi Swift clean yêu cầu identities cho mọi target. Vì vậy đường này có thể trả skipped “Thiếu định danh tệp từ host”, không phải dọn thành công. Chưa tái hiện runtime lượt audit; chứng cứ là producer/consumer contract mismatch. Không ghi thành đã fix. Spec phải yêu cầu parity identity giống cleanup/uninstall/lens trước nghiệm thu.

## 6. Space Lens

Dùng CompactLensScanner hiện tại, không renderer gốc SpaceLensEngine traversal: allocated size bằng lstat/st_blocks, inode dedup, không follow symlink, scan subtree đủ để cộng size nhưng DTO direct children, cấp sâu qua request mới. Không filter chỉ node >10 MB như mô tả cũ. Read root cho Home,/Users,/Volumes,/Applications,/opt; deny root system/private/usr/Library/dev/proc. Partial denied flags.

Trash Lens chỉ nonhidden top branch dưới Home, không Library/Applications/dotpath hoặc folder chứa app đang chạy/self; external roots chỉ read, không Trash. Rust lens ticket unique/15 phút, path phải thuộc node can_trash + identity; root scan không xóa. Không lấy quyền quét folder làm quyền xóa cả folder đó.

## 7. Retention và lifecycle UI

5 phút là React session state giữ screen khi ẩn, dữ liệu/scopes invalidated trước/sau mọi mutation; ẩn quá TTL unmount, restart app mất state. retainedRead không phải cache result tự trả về ở service; UI giữ mounted state mới tránh gọi lại khi đổi menu. Host grant 15 phút là giới hạn authorize khác 5 phút UI, không durable cache. Mới chuyển menu không yêu cầu lại scan nếu còn fresh; hết hạn cần renew state, không duy trì quyền xóa vĩnh viễn.

## 8. Truth mục tiêu user vừa chốt và trạng thái

| Yêu cầu | Trạng thái source |
|---|---|
| Quick ba nhóm theo spec 14; thay quyết định giữ nguyên cũ | Chưa triển khai; baseline ở mục 2 vẫn scan all 10 nhóm |
| Media Apps/Chrome trong detail | Chưa có category/rule native tương ứng |
| Dictionary mọi detail item/hậu quả/safe default | JSON local 68 entries + spec thiết kế, chưa DTO/engine/UI wiring |
| Safe tick, risky/unknown bỏ tick, Select all | Target detail; source hiện chỉ dùng isSelected/is_cleanable, chưa semantic safety; category Select all đã có nhưng chưa consequence dictionary |
| Popup Quit/reopen và restore Chrome profile/tab | Chưa implementation; incognito/form ngoài yêu cầu |
| Cleanup khác uninstall Movies/CapCut | Uninstall candidate có rồi, default false; cleanup Media Apps chưa có |
| Đối chiếu platform/OS/app/layout | Master overview + target contract; chưa runtime validation matrix |

Không dùng target để hợp thức hóa baseline chưa safe: Archives/default cache/Node risk giữ gap công khai; source chưa đổi. Quick/defaults sẽ triển khai theo spec 14, Detail theo dictionary/adapter đã được validation; không dùng broad parent để vượt protected policy chung.

## 9. Gaps cần giao triển khai/verification

1. Ưu tiên integrity: sửa missing identity Orphans, negative fixture source/host parity; chưa tự sửa trong task này.
2. Dictionary version/operation scope DTO, exact adapter classifiers, risk confirm/default logic + Select all policy.
3. App Quit/reopen và Chrome session fixture; Adobe shared cache queue/save dialogs.
4. Independent protected policy cho system/caches, manager runtime lifecycle, category overlap/dedup/bytes truth; không suy cache safe từ scanner membership.
5. Durable reporting/recovery và typed maintenance response nếu mở scope mutation; chưa hứa Undo.
6. Windows adapter/version matrix, macOS older/new OS support evidence; không claims cross-platform ready 100% từ UI reuse.

## Evidence source

[MaintenanceCLI](../../desktop/native/maintenance_cli.swift), [Rust bridge](../../desktop/src_tauri/src/maintenance_bridge.rs), [telemetry bridge](../../desktop/src_tauri/src/engine_bridge.rs), [entrypoint](../../desktop/native/main.swift), [scanner](../../MClean/Services/ScanEngine.swift), [category](../../MClean/Models/Models.swift), [monitor](../../MClean/Services/SystemMonitor.swift), [Lens](../../desktop/native/compact_lens_scanner.swift), [Orphan policy](../../MClean/Logic/Utilities/OrphanSafetyPolicy.swift), [frontend bridge](../../desktop/src/services/tauri_bridge.ts), [retention](../../desktop/src/services/scan_retention.ts). Source paths có thể đổi về sau; audit phải cập nhật khi implementation đổi.

Checks lượt này: source read-only, JSON dictionary/unique IDs/local links/selection invariants, git diff whitespace; không dùng lịch sử tests cũ làm bằng chứng engine mới đã runtime pass.
