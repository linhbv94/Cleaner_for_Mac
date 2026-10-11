# Scope Quick và Dọn chi tiết đã chốt

> **Chốt mới 2026-10-11:** Detailed không nhận target đã cleanable bởi Quick, kể cả child dưới target đó. Chỉ bổ sung vùng/target ngoài coverage Quick; không cần user dọn Quick trước. Quy tắc parent-child, scope và QA ở [spec21](21_quick_scan_clean_parity.md). Engine đã nối loại trùng theo target Quick cleanable; kiểm chứng mới ở spec22.

> **Chốt phạm vi theo user 2026-10-11:** Cache của Chrome, Adobe, CapCut và Codex nằm trong `~/Library/Caches` vẫn thuộc User Cache của Quick, theo rule đủ điều kiện. Có nhóm Chrome/Media/AI trong Detailed không phải lý do loại vendor đó khỏi Quick. Detailed bổ sung các vùng riêng (Application Support, Movies, cache chuyên biệt) và matcher chi tiết; không bắt buộc thay thế toàn coverage Quick. Việc Detailed User Cache đánh owner `adobe` là `unvalidated` chỉ chặn lựa chọn trong scope Detailed, không ngăn Quick dọn `Library/Caches/Adobe`. Đây là phân phạm vi được user chấp nhận; hạn chế coverage Detailed ghi riêng, không coi là lỗi chuyển nhánh. Audit: [user_cache_rule_audit.md](../user_cache_rule_audit.md).

> **Contract mới nhất:** [spec21](21_quick_scan_clean_parity.md) mở lại gate Quick, bỏ filter vendor rộng, yêu cầu mọi target trong kết quả dọn có grant và actual cleanup/rescan; inventory updater/state giữ riêng. Các mức15/97/321MB và nghiệm thu trước là lịch sử.


> **Ưu tiên hiện hành 2026-10-11:** [spec20](20_quick_release_priority.md) thay các yêu cầu adapter riêng cho mọi cache Quick và gate full-detail dưới đây. Cache thường MClean được maintenance; logs/temp ≥24giờ có guard runtime/IPC/quyền. Số 0B/15MB và trạng thái chỉ-adapter dưới đây là bằng chứng lịch sử, không mô tả source hiện hành. Kết quả gói cuối xem [checklist](../release_readiness_checklist.md).


> **Cập nhật implementation local 2026-10-10:** xem [truth sau triển khai](17_local_implementation_status.md) và [báo cáo build/QA](../local_completion_report.md). Nội dung target dưới đây không đồng nghĩa mọi gate đã pass; các nhánh thiếu evidence đang blocked.


> **Contract chuẩn bị release — 2026-10-10:** [Scope mới](14_quick_detailed_scope.md), [policy backend](15_cleanup_protection_policy.md), [menubar/Dock](16_menubar_release_ui.md) và [API/QA hiện hành](00_system_overview.md) ưu tiên cho target mới. Giữ nội dung dưới làm lịch sử/chi tiết không mâu thuẫn; không áp yêu cầu giữ nguyên Quick cũ hoặc coi policy/tray đã triển khai.


Ngày cập nhật: 2026-10-10. Trạng thái: **scope đã triển khai; mức nghiệm thu và nhánh khóa ở spec17/18**. Tài liệu này thay yêu cầu “giữ nguyên Quick” trước đó trong spec 11–13. [Spec13](13_engine_behavior_truth.md) dẫn đến truth source/gói hiện tại; target không đồng nghĩa mọi adapter đã nghiệm thu.

## 1. Quyết định và ranh giới

User chấp nhận dọn cache không quan trọng, kể cả cache chỉ phục vụ build và có thể tái tạo. Chấp nhận build/index/tải lại chậm hơn; không đồng nghĩa chấp nhận mất project, runtime, phiên đang chạy hoặc dữ liệu offline duy nhất. Node chỉ dọn cache riêng đã được nhận diện, không dọn cả thư mục Node/npm vì tên là cache.

| Quick | Nhận vào phạm vi | Mặc định và phần giữ |
|---|---|---|
| System Junk | Log cũ và file tạm đã hết nhu cầu sử dụng, được rule cụ thể nhận diện; cache hệ thống chỉ khi có rule riêng đủ bằng chứng | Tick rule đã kiểm chứng và đủ điều kiện mutation. Không chọn toàn `/Library/Caches`, `/private/var/log`, `/tmp`, `/private/var/tmp` hoặc mọi child chỉ vì size >1 KB. Giữ log active/phiên gần nhất, temp của phiên đang chạy, socket/lock/service state, cache OS chưa xác minh |
| User Cache | Cache thông thường trong `~/Library/Caches`, gồm Chrome/Adobe/CapCut/Codex nếu rule đủ điều kiện; pip theo matcher hiện hành. Không loại vendor chỉ vì có nhóm Detailed | Tick các mục đủ điều kiện, có lifecycle khi cần; các filter giữ lại được audit riêng. Node/Brew chuyên biệt không chạy trong Quick |
| Large & Old Files | Giữ discovery Downloads/Documents/Desktop và ngưỡng hiện có | Mặc định bỏ tick, user xem rồi chọn từng file, chuyển Trash. Không coi file lớn/cũ là junk hoặc tự chọn bằng nút dọn cache |

Quick có đúng **3 nhóm**. AI, Mail, Trash, Xcode, Docker cùng Node/Brew đều nằm ngoài Quick. Large & Old vẫn là công cụ xem xét dữ liệu cá nhân trong Quick, không nằm trong lựa chọn dọn mặc định. Quick không thêm Chrome/Media adapter mới đã nghiên cứu.

Dọn chi tiết có System Junk/User Cache để xem kỹ các mục chung, cùng các nhóm chuyên biệt **Chrome, AI, Media Apps (CapCut/Adobe), Node, Brew, Xcode, Docker, Mail và Trash**. Large & Old có thể tiếp tục truy cập để xem/chọn file. Orphans giữ flow/operation riêng trong giao diện Dọn chi tiết; App Uninstaller và Space Lens vẫn là chức năng riêng, không bị một nút dọn tổng hợp cấp quyền xóa.

Chuyển nhóm không chỉ là ẩn trên UI: Quick phải yêu cầu đúng scope từ backend, không `scan --all` rồi giấu Node/Brew/Docker. Bước revalidate trước xóa cũng phải theo scope tương ứng. Không chạy các CLI chuyên biệt từ Quick. Không cộng trùng hoặc cấp hai grant cho cùng dữ liệu dưới hai nhóm.

User xác nhận thêm: **hạng mục ngoài scope Quick không cần được quét trong Quick**, kể cả ở bước revalidation trước xóa. Large & Old vẫn được quét để user xem/chọn dù mặc định bỏ tick. User cũng đã đồng ý bảo vệ OS/runtime/updater và chống parent xóa child cần giữ ở **cả Quick lẫn Detail**, thực thi tại backend; không chỉ cảnh báo hoặc lọc checkbox trên UI.

## 2. Phân loại cache build và các nhóm chuyên biệt

- **User Cache:** không loại bỏ mọi cache dev chỉ vì liên quan build. Giữ cache build/download thực sự disposable sau phân loại; đưa cache đã có nhóm chuyên biệt sang đúng nhóm đó. Node/Brew/Xcode/Docker/Chrome/AI/Media đã được rule chuyên biệt sở hữu phải loại khỏi broad User Cache ở cả Quick và Detail. Không bỏ sót bằng cách chỉ loại tên root rồi vẫn chọn một parent bao phủ child ấy.
- **Node:** npm content/download cache `_cacache` là ứng viên. Không xóa nguyên `~/.npm`; giữ `_npx` và package/runtime đang phục vụ tool/MCP. Không dọn `node_modules`, binary Node, project, lockfile hoặc cấu hình. Yarn/pnpm cần matcher riêng theo manager/version/layout; `.yarn/cache` có thể phục vụ runtime, pnpm store không tự được bật chỉ vì có thể tải lại. Không nhận các root store/cache chưa phân loại vào default cleanup.
- **Brew:** chỉ cache download/artifact được xác minh; không dọn Cellar/Caskroom/opt/bin hoặc bản app/tool đã cài. Gói updater đang dùng/pending được giữ.
- **Chrome/AI/Media:** chỉ mở exact child cache được dictionary/adapter nhận diện. Giữ profile parent, cookie/session, project/resources, model, runtime, worktree, DB/WAL và updater chưa xác minh. Theo [scope v1 và audit](../engine_scope_audit_2026_10_10.md), AI history/ảnh còn chờ ownership mapping; Figma chưa được tự thêm vào Media.
- **Xcode/Docker:** giữ project/source/runtime và dữ liệu người dùng; Archives không là cache tái tạo và không tick mặc định theo target. Docker VM/volumes/container data không là cache được phép wipe. Node/store, Xcode build hay Adobe cache đang được sử dụng phải skip/chờ theo adapter, không suy “tạo lại được” thành “xóa lúc nào cũng được”.

## 3. Dọn toàn bộ hoặc từng nhóm

### Thiết kế cũ và implementation hiện có

[Spec 12](12_cleanup_dictionary.md) đã design checkbox **Chọn tất cả trong danh sách/nhóm đang xem**, kể cả mục rủi ro có adapter hỗ trợ, với hậu quả và xác nhận trước mutation. Nó chưa design nút dọn toàn bộ xuyên mọi nhóm một cách đầy đủ.

UI [CleanupView](../../desktop/src/components/cleanup_view.tsx) đã có chọn/dọn nhóm hiện tại và toàn bộ nhóm eligible. Chrome/Media/AI, metadata từ registry và lifecycle đã nối; mức QA và các rule khóa ở spec17. Không tuyên bố “dọn Chrome/Media” đã hoạt động chỉ vì generic cache có thể tìm thấy một path của app đó.

### Contract bổ sung đã chốt cho Dọn chi tiết

1. **Dọn nhóm đang xem:** chọn Chrome/AI/Media/Node… → xem các dòng, hậu quả/default → chọn hoặc Chọn tất cả trong nhóm → Dọn nhóm. Mutation chỉ xử lý những dòng đã chọn của nhóm ấy.
2. **Dọn các mục đã chọn trên toàn bộ nhóm:** trang tổng quan cho thấy số mục/dung lượng của từng nhóm và nút dọn tất cả lựa chọn hiện tại. Default chỉ chọn rule tái tạo đã kiểm chứng. Cách này cho phép một lần dọn cache đủ điều kiện trong nhiều nhóm.
3. **Chọn tất cả ở cấp tổng quan:** chọn mọi dòng selectable thuộc các nhóm đã scan, bao gồm dòng rủi ro có adapter hỗ trợ; hiển thị rõ đây là lựa chọn xuyên nhóm, không nhầm với checkbox trong nhóm. Protected/unknown chưa có adapter/informational vẫn disabled. Nút không có nghĩa “xóa toàn bộ dữ liệu máy”.
4. Trước Dọn, review tổng hợp theo nhóm, nêu riêng dữ liệu cá nhân, xóa vĩnh viễn/Trash và app cần Quit. Large Files, Mail, Trash, Archives, history không tự được nâng thành safe. Không tự chọn kết quả scan mới mà user chưa thấy; selection dựa trên snapshot cụ thể.
5. Các app cần đóng được gom trong flow [spec 11](11_detailed_app_cleanup.md): Quit bình thường, tôn trọng Save/Cancel, không force quit; revalidate, chờ helper, cleanup, mở lại app vốn chạy. App đang đóng không tự được mở. Dependency/shared cache phải được xử lý trước các nhóm còn lại.
6. Partial failure/blocked/timeout phải báo rõ theo nhóm và từng mục; không báo “dọn hết” nếu còn mục bị skip. Mỗi path chỉ đếm/xóa một lần. Với Orphans phải tạo đúng operation/grant riêng; không dùng ticket cleanup thông thường hoặc gọi bên trong batch cho đến khi host/native identity contract được sửa và nghiệm thu.

Đây là bổ sung thiết kế trong lượt này, **chưa có action global trong code**. Dictionary vẫn design-only; các rule chưa có adapter không được biến thành selectable bằng một nút Chọn tất cả.

## 4. Rà lại Quick và độ tin cậy của MClean

Đối chiếu với commit import local `42cf1f86ae91bc191858d2ae9df197e026da8f2b`: `scanUserCache`, `scanLargeFiles` và toàn bộ `CleaningEngine.swift` hiện còn giống baseline import. `scanSystemJunk` giữ cùng sáu root production, thay nội suy systemRoot để test. Scanner đã thêm kiểm soát CLI/đường dẫn, partial reporting và fixture hooks ở các nhánh khác. Đây là baseline import local, **không phải upstream commit đã xác minh**; xem [provenance](../upstream_provenance.md).

| Hạng mục | Điểm tốt đang có | Rủi ro còn lại và quyết định |
|---|---|---|
| System Junk | Scan phạm vi root cụ thể, bỏ symlink ở cấp item; native kiểm tra canonical path/identity | Scanner chọn child >1 KB bất kể tuổi/phiên/process. Fixture mới chứng minh temp có descriptor đang mở và log vừa tạo vẫn default tick rồi bị xóa trực tiếp. Có thể làm app/dịch vụ mất path làm việc, mất log chẩn đoán; chưa có bằng chứng phá OS trên máy thật. Thu hẹp bằng rule/lifecycle, giữ unknown OS-managed |
| User Cache | Cache thông thường trong `~/Library/Caches`, gồm Chrome/Adobe/CapCut/Codex nếu rule đủ điều kiện; pip theo matcher hiện hành. Không loại vendor chỉ vì có nhóm Detailed | Tick các mục đủ điều kiện, có lifecycle khi cần; các filter giữ lại được audit riêng. Node/Brew chuyên biệt không chạy trong Quick |
| Large & Old | Default false; scoped discovery, Tauri dùng Trash; package descendants bị skip | File cá nhân hoặc project vẫn có thể rất quan trọng. Xóa lựa chọn rõ ràng, không đưa vào mặc định dọn cache. Symlink/identity guard vẫn còn check/use window; không chứng nhận chống race hoàn toàn |
| Mutation desktop | Grant path/method + device/inode, re-scan, mutex; cleanup thường không tự admin fallback | **Không dùng CleaningEngine gốc.** Membership trong scanner vẫn là authority chính, chưa independent semantic protection chung; thư mục cùng inode có thể có child mới. Quyền đọc/FDA không phải bằng chứng quyền an toàn để xóa |
| Cleaner gốc | Allowlist có boundary, canonical/symlink recheck | Allowlist chấp nhận cả broad root và descendants, không chứng minh từng file là junk; normal cleanup là `removeItem`, admin pass `rm -rf`. Cam kết README “mọi thứ vào Trash” không đúng cho toàn cleanup. Xem [audit gốc](../safety_audit.md) |

Không có default Quick nào hiện nhắm thẳng kernel/framework, `/System/Library`, boot, Keychain hoặc toàn user profile; fixture OS marker ngoài roots không được scan. Đây là giới hạn phạm vi có ích, không chứng minh rằng mọi item trong `/Library/Caches` hay temp đều an toàn cho hoạt động OS.

MaintenanceCLI riêng không tự làm hệ thống nguy hiểm hơn hoặc an toàn hơn. Nó có lợi thế grant/identity/re-scan và method Trash riêng cho file cá nhân, nhưng tạo trách nhiệm đối chiếu behavior với MClean và target VXClean: không mặc định các guard của CleaningEngine được kế thừa, không nhầm scan membership với semantic safety, không báo timeout như chưa từng mutation. Giữ MaintenanceCLI và bổ sung policy chung/negative fixtures phù hợp hơn quay lại nguyên cleaner gốc, vì cleaner gốc cũng có broad allowlist và xóa trực tiếp. Việc đổi executor cần kiểm chứng các invariant bảo vệ dữ liệu, không yêu cầu tái hiện nguyên mọi behavior cũ.

Apple hướng dẫn Caches chứa dữ liệu app không cần để hoạt động và có thể tái tạo, nhưng đó là contract cho app lưu đúng nội dung; không chứng minh app bên thứ ba tuân thủ tuyệt đối. Temp có thể được hệ thống purge khi app không chạy, không là căn cứ xóa toàn bộ temp khi app/dịch vụ vẫn dùng. [Apple filesystem](https://developer.apple.com/documentation/foundation/using-the-file-system-effectively).

SIP bảo vệ một số vùng của OS, trong khi `/Library` vẫn có vùng phần mềm bên thứ ba ghi được. Vì vậy không dùng SIP/permission denied như safety policy thay cho classifier. [Apple SIP](https://support.apple.com/en-ie/102149).

## 5. Bằng chứng và gate triển khai

[Evidence lượt rà Quick](../quick_scope_recheck_evidence.json) lưu SHA-256 source và kết quả fixture synthetic dưới thư mục tạm. Compile riêng `ENGINE_TESTING` redirect home/system roots; không xóa OS/user data thật, không cấp admin, không Quit app thật. Fixture vừa tạo file temp/log nên chứng minh thiếu guard với file mới/in-use, không chứng minh OS thực tế bị crash. Large File fixture default false/Trash; không thử Trash thực tế trong lượt này.

[Audit trước](../engine_scope_audit_2026_10_10.md) và [evidence](../engine_scope_audit_evidence.json) đã chứng minh npm parent gồm `_npx`, parent cache bao child mới, cùng các gap Orphans/uninstall retry. Các regression pass trước đó không phủ hết các trường hợp này.

Trước bật scope Quick mới:

- Backend filter Quick đúng ba nhóm; User Cache không nhận lại Node/Brew hoặc root chuyên biệt qua đường cha. Quick lẫn Detail dùng cùng nền bảo vệ tại mutation nhưng có rule/selection riêng theo operation.
- Chỉ cấp target exact theo rule/version/layout đã kiểm chứng. Protected child và injection ngoài scope bị từ chối dù scanner/UI sai; ancestor không nhận quyền wipe subtree.
- System log/temp chưa có rule xác định stale/in-use/ownership phải bị chặn mặc định. [Policy 15](15_cleanup_protection_policy.md) chọn default triển khai bảo thủ cho log user-app rotated/closed: ≥30 ngày và giữ phiên mới nhất, vẫn cần active/session proof; không dùng mtime/“7 ngày” hay tuổi đơn thuần chứng minh không sử dụng. OS-owned/cache hệ thống chưa được validation nằm ngoài mutation v1.
- Test bản packaged đúng source, synthetic negative fixtures, app đang chạy/đang build, permission failure và partial reporting. Không nâng admin chỉ để xóa item bị OS từ chối.

Scope đã đủ rõ để giao triển khai contract, classifier và fixture trước; **chưa đủ bằng chứng để bật cleanup rộng trên dữ liệu thật**. Quyết định chọn Quick hẹp + Detailed theo app đổi lấy ít dung lượng dọn tự động hơn và chi phí viết adapter, thay vì giữ broad parent MClean hoặc mở toàn dictionary design-only ngay.

## 6. Trả lời ranh giới hai cuộc hội thoại

- **Hiện tại:** Quick/Detail cùng `scan --all` (Detail thêm nhóm rỗng); Quick vẫn 10 category. Node/Brew chưa bị bỏ khỏi code trong lượt review trước. Source scanner kế thừa MClean có sửa, mutation desktop là MaintenanceCLI riêng.
- **Mục tiêu mới:** Quick ba nhóm như mục 1; Node/Brew và nhóm chuyên biệt sang Detail. Đây là thay đổi user chốt trong convo hiện tại, thay yêu cầu giữ Quick cũ.
- **Scope từ convo “Review UI và nối engine”:** Chrome/Media, dictionary toàn Detail và Quit/reopen/restore là target Dọn chi tiết. Không tự thêm category ấy vào Quick. Tuy nhiên bảo vệ runtime/updater/OS/parent-child phải áp tại nền mutation chung, để Quick không xóa qua parent những gì Detail đã yêu cầu giữ.
- **Lượt hiện tại:** chỉ cập nhật quyết định/docs và rà bằng fixture; chưa sửa engine/UI, build bundle hoặc dọn dữ liệu thật.
