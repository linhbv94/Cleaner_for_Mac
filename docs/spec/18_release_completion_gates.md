# Hoàn thiện trước đóng gói/release — 2026-10-10

> **Contract mới nhất:** [spec21](21_quick_scan_clean_parity.md) mở lại gate Quick, bỏ filter vendor rộng, yêu cầu mọi target trong kết quả dọn có grant và actual cleanup/rescan; inventory updater/state giữ riêng. Các mức15/97/321MB và nghiệm thu trước là lịch sử.


> **Ưu tiên hiện hành 2026-10-11:** [spec20](20_quick_release_priority.md) thay các yêu cầu adapter riêng cho mọi cache Quick và gate full-detail dưới đây. Cache thường MClean được maintenance; logs/temp ≥24giờ có guard runtime/IPC/quyền. Số 0B/15MB và trạng thái chỉ-adapter dưới đây là bằng chứng lịch sử, không mô tả source hiện hành. Kết quả gói cuối xem [checklist](../release_readiness_checklist.md).


User yêu cầu triển khai đến đủ điều kiện đóng gói/release rồi dừng trước phát hành. Không commit/push/tag/publish trong task này.

## Gate triển khai

- Menubar native và lifecycle cửa sổ; xác minh panel/sampler/actions/quit trên gói thực.
- Dọn chi tiết: phân biệt hard block với cache cần Quit. Popup xác nhận, Quit bình thường, không force kill; snapshot và journal app vốn chạy, chờ helper; quét lại và chỉ giữ đúng lựa chọn cũ đủ điều kiện; nếu thay đổi hậu quả cần review lại. Mở lại đúng app; Chrome yêu cầu native restore-last-session, báo kết quả restore riêng, không đồng nhất launch với phục hồi đầy đủ.
- Quyền Automation nếu OS yêu cầu: thông báo cấp quyền trong Settings hoặc đóng app thủ công; Cancel/timeout giữ dữ liệu. Không xin admin/FDA tự động.
- Recovery: không replay delete; hiển thị nghĩa vụ mở lại sau interrupted. Journal có giới hạn đọc và retention bảo thủ, không xóa pending/unknown/reopen obligations.
- Các adapter thiếu ownership/layout/source proof vẫn disabled theo spec15; không coi disabled là thực thi được tính năng đó. Báo rõ phạm vi shipping và gate còn thiếu, không tự giảm yêu cầu để ghi release-ready.
- Fixture thực đi qua host/native, packaged read-only QA, Trash thành công trên fixture riêng, rollback/retry/permission/crash safety. Không thao tác dữ liệu thật của user.

## Điểm dừng

Bàn giao package + evidence + checklist release cho agent khác. Không phát hành. Mac arm64 local không tự chứng minh Intel/macOS13/Windows; phải ghi đúng compatibility tier và CI gates cần chạy bởi agent phát hành.

## Updater và build tái lập

- Updater kiểm tra khi mở app và khi user bấm trong Settings; cài cần xác nhận version. Chữ ký updater độc lập với codesign ad-hoc của bundle.
- Trước cài, host chặn khi mutation hoặc nghĩa vụ mở lại app chưa giải quyết; kết thúc engine/sampler, không restart giữa dọn. Lỗi cài phải cho phép engine tiếp tục và hiển thị lỗi; không báo phiên bản mới nhất khi endpoint hỏng/404.
- Lockfile npm riêng, không phụ thuộc node_modules runtime dùng chung. CI hai kiến trúc macOS; preparation workflow tạo draft GitHub Release khi được agent phát hành chạy; không dùng Actions cache/artifact và không tự publish. Developer ID/notarization và test OS cũ là gate phân phối còn riêng.
- AI Apps: UI phân biệt dung lượng phát hiện và dung lượng đủ điều kiện dọn. Scanner nhận Codex/Antigravity/ChatGPT theo vùng tồn tại thực; lịch sử/ảnh/plugin/runtime/updater không được bật bởi tên `cache`. Cache frontend chưa cold-start QA vẫn có thể hiển thị read-only, nhưng không được báo tính năng dọn AI đã nghiệm thu.

## Scan bị giữ bởi OS/provider

QA gói mới: Large & Old Files có thể treo ở syscall open khi duyệt Downloads/Documents/Desktop. Không suy diễn là đã được cấp quyền hoặc cả nhóm trống. Cô lập scanner này thành subprocess chỉ đọc, timeout hữu hạn, kill/reap đúng worker sở hữu; trả partial và giữ các nhóm khác. Không tăng timeout toàn app vô hạn. Fixture phải mô phỏng worker treo và chứng minh AI/nhóm khác vẫn trả kết quả, không có mutation. Quick vẫn chỉ ba nhóm đã chốt.

## Chrome — bổ sung kịch bản người dùng

User xác nhận Chrome hiện bật “Continue where you left off”. Tách nghiệm thu thành: (1) Quit thường→mở lại, không dọn; (2) cùng kịch bản nhưng dọn đúng cache rồi mở lại; (3) settings không bật continue, cần `--restore-last-session`; (4) nhiều profile/window. Reboot macOS là case compatibility riêng, không thay case2 và không tự reboot máy làm việc. Giữ Sessions/Local State/Preferences khỏi cleanup.

Công cụ browser từ chối `chrome://settings/onStartup` do URL policy; không dùng alternate surface/CLI/file edit để đổi setting này. Session name của browser tool chỉ đặt tên nhóm làm việc, không chứng minh profile riêng. Tab example thử đã đóng; chưa Quit Chrome/dọn cache/reboot và chưa có runtime pass. Cần môi trường/profile Chrome riêng được thiết lập hợp lệ, hoặc user cho phép thử phiên hiện có; không báo đã tái hiện.

## Cho phép QA Chrome thật — cùng lượt2026-10-10

User đã chọn cửa sổ VL, rồi đồng ý thử dọn Chrome khi không ngồi máy. Phạm vi là nhánh cache Chrome đã nhận diện trong VXClean, Quit bình thường và mở lại; không gỡ Chrome, không dọn profile/cookie/password/Sessions/Local State/Preferences. VL đã tìm đúng menu Window, profile thứ ba trong các tên Viet Linh trùng nhau. Sau đóng riêng VL, chọn lại đúng profile đã khôi phục cùng3tab, tênVL và tab active. Đây mới là baseline mở profile, chưa phải cache cleanup. QA tiếp theo qua product UI và native journal; lưu baseline metadata/hashes hoặc backup local riêng khi cần, không đưa URL/secret vào docs/repo.

### Chrome QA thật: lỗi manifest và tiêu chuẩn sửa

Lượt dọn 9 cache (~858 MB) bị host từ chối vì tổng manifest vượt 4 MiB; chưa có native deletion. Chrome Quit/mở lại đã chạy. Không coi thay đổi Preferences/Sessions sau mở Chrome là bằng chứng Cleaner sửa dữ liệu.

Host phải chia payload theo đường dẫn đã chọn, giữ manifest đầy đủ, giới hạn 4 MiB mỗi request và kiểm tra lại identity/nội dung trước từng lô. Preflight toàn bộ lô trước khi xoá; một mục riêng vượt giới hạn phải chặn toàn bộ. Mỗi lô có journal riêng, dừng khi lỗi và báo số mục đã thành công; không replay tự động. Kiểm thử phân lô, giữ đúng phạm vi và chặn mục quá lớn trước QA Chrome thật.

### Chrome QA: nhật ký trên cache lớn

Lô cache đầu tiên timeout120giây sau~6278 tệp; journal cũ serialize toàn bộ targets hai lần/tệp (chi phí tăng bậc hai). Không gọi là hoàn tất; giữ journal gián đoạn, không tự replay. Chuyển ghi từng intent/outcome sang JSONL append+fsync có giới hạn16MiB/lô; result.json giữ checkpoint trạng thái và kết quả cuối. Host đọc log có giới hạn, kiểm tra records và dựng lại kết quả từng path; log hỏng/truncated giữ trạng thái chưa xác minh, chặn updater. Phải test mất/thiếu outcome, log lỗi và tương thích journal cũ trước retry Chrome.

### Menubar: icon mất do RGBA stride

Ảnh PNG36×36 đúng nhưng rawRGBA chứa5760bytes (stride160 thay vì144); ảnh18×18 tương tự1728 thay vì1296. Tauri `.icon()` bỏ qua lỗi convert nên ready=true/panel hoạt động không chứng minh icon xuất hiện. Sửa dữ liệu tightly packed, thêm kiểm tra compile-time và fixturealpha/length; QA native menu extra click mở panel, không chỉ gọi menu fallback.

### Kết quả QA Chrome thật sau sửa

Lượt cuối9/9success,0failure,804.438.535logicalbytes cache đã xóa.50tệp trạng thái profile đối chiếu SHA-256 khi Chrome vẫn đóng, sau cả9lô:0thay đổi. Chrome tự mở lại8window; VL3tab, thứ tự và selected giữ. Tổng90tab thanh trình duyệt trước/sau (có1tab QA); đã đóng tab QA sau đối chiếu, còn89tab user. Không đếm tab điều hướng trong nội dung YouTube/Proton. Social có bộ đếm Facebook động; Zalo hiện tài khoản sau tải hoàn tất. Không thử reboot/ẩn danh/form; chỉ chứng minh layout máy này, chưa chứng nhận mọi profile/OS. [Evidence](../chrome_cleanup_runtime_evidence.json).

Hai journal lỗi cũ được giữ, không xóa/đổi thành success hoặc replay.20Rusttests/20nhóm native đạt; fixture7000file có log intent/outcome đầy đủ dưới30s, profile không đổi. Icon đã sửa packedRGBA/alpha đúng PNG; click tray thật vẫn chưa xác minh do công cụ CUA không có window của SystemUIServer. Không gọi menubar QA toàn diện pass.

Host đóng gói greedy các target nhỏ vào cùng lô dưới4MiB (reserve1KiB metadata), tránh9lần fresh-scan khi tổng proof cho phép ít lô hơn. Mọi target giữ nguyên snapshot; một target quá lớn vẫn chặn toàn bộ trước mutation. Native tiếp tục revalidate toàn bộ target mỗi lô, không bỏ fresh-scan/permission guards. QA thật vừa rồi dùng9lô riêng (native tổng221.555ms); tối ưu packing sau QA được kiểm thử Rust, không dọn Chrome thật lần nữa chỉ để kiểm tra tốc độ.
