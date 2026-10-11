# Dọn rác chi tiết theo app và đóng/mở lại app

> **Chốt mới 2026-10-11:** Detailed không nhận target đã cleanable bởi Quick, kể cả child dưới target đó. Chỉ bổ sung vùng/target ngoài coverage Quick; không cần user dọn Quick trước. Quy tắc parent-child, scope và QA ở [spec21](21_quick_scan_clean_parity.md). Engine đã nối loại trùng theo target Quick cleanable; kiểm chứng mới ở spec22.

> **Chốt phạm vi theo user 2026-10-11:** Cache của Chrome, Adobe, CapCut và Codex nằm trong `~/Library/Caches` vẫn thuộc User Cache của Quick, theo rule đủ điều kiện. Có nhóm Chrome/Media/AI trong Detailed không phải lý do loại vendor đó khỏi Quick. Detailed bổ sung các vùng riêng (Application Support, Movies, cache chuyên biệt) và matcher chi tiết; không bắt buộc thay thế toàn coverage Quick. Việc Detailed User Cache đánh owner `adobe` là `unvalidated` chỉ chặn lựa chọn trong scope Detailed, không ngăn Quick dọn `Library/Caches/Adobe`. Đây là phân phạm vi được user chấp nhận; hạn chế coverage Detailed ghi riêng, không coi là lỗi chuyển nhánh. Audit: [user_cache_rule_audit.md](../user_cache_rule_audit.md).

> **Contract chuẩn bị release — 2026-10-10:** [Scope mới](14_quick_detailed_scope.md), [policy backend](15_cleanup_protection_policy.md), [menubar/Dock](16_menubar_release_ui.md) và [API/QA hiện hành](00_system_overview.md) ưu tiên cho target mới. Giữ nội dung dưới làm lịch sử/chi tiết không mâu thuẫn; không áp yêu cầu giữ nguyên Quick cũ hoặc coi policy/tray đã triển khai.


Ngày cập nhật: 2026-10-10. Trạng thái: scope đã chốt; implementation và gate nghiệm thu hiện tại ở [spec17](17_local_implementation_status.md).

## Quyết định sản phẩm

- Quyết định giữ nguyên Quick trong lượt design ban đầu đã được thay bởi [scope mới](14_quick_detailed_scope.md): Quick chỉ System Junk/User Cache/Large & Old; nhóm chuyên biệt sang Detail. Chrome/Media mới vẫn chỉ thêm vào Detail. Scope này đã được nối và có fixture.
- Dọn rác chi tiết có nhóm **Media Apps**, gồm CapCut và Adobe; có nhóm **Chrome** riêng. Không tạo thêm master sidebar.
- Figma và cache frontend AI đã nghiên cứu chưa được user chỉ định nhóm mới; không tự gom Figma vào Media Apps hoặc mở thêm category trong lượt này.
- Nghiên cứu [CapCut và AI](../capcut_ai_cache_research.md) và [Library](../library_cleanup_scope_research.md) là nguồn thiết kế. Rule executable/nhánh khóa ở spec17 là truth; user đã giao triển khai scope, không mở adapter thiếu evidence.

## Flow đóng/mở lại

Scan read-only bình thường không cần đóng app. Hiểu yêu cầu mở lại sau thao tác là **sau dọn**, khi cần cache measurement ổn định thì đóng ở bước chuẩn bị dọn → quét lại vùng đã chọn → dọn → mở lại. Không restart app chỉ vì chuyển menu hoặc quét xem dung lượng.

Khi user bấm Dọn và vùng đã chọn yêu cầu app đóng:
1. Snapshot app/bundle/path/version đang chạy và scope đã chọn. Hiện popup tên các app liên quan, giải thích sẽ đóng tạm và mở lại; nút Đóng và dọn / Bỏ qua app này / Hủy. Đây là xác nhận trong sản phẩm, không phải hỏi thêm user trong chat.
2. Gửi Quit bình thường, để app tự hỏi lưu project nếu cần. User Cancel ở save dialog hoặc timeout → không dọn app đó. Không force quit, không tự discard unsaved work.
3. Chờ app và helper đang dùng vùng đó kết thúc; Adobe Common chia sẻ giữa Premiere, After Effects, Media Encoder nên không chỉ nhìn Premiere. Không kill mọi process Adobe/Google hoặc daemon license/sync.
4. Quét lại target để loại dữ liệu đã đổi, revalidate grant/identity/canonical path và chống scope parent bao trùm dữ liệu được bảo vệ; tránh đếm/xóa lặp khi scan mặc định cũng tìm thấy cùng vùng.
5. Dọn, ghi kết quả từng item. Dù có partial failure, Cancel sau Quit hoặc cleaner bị restart, lưu danh sách app đã thực sự đóng để đề nghị/mở lại khi phù hợp; không tự chạy app vốn đang đóng trước thao tác, không spawn duplicate.
6. Mở lại đúng app/path ban đầu. Chrome khôi phục các profile thường và tab đang mở trước dọn. User xác nhận **không cần khôi phục tab ẩn danh hoặc form chưa gửi**. Không đổi startup preferences để cưỡng ép.
7. Báo riêng dọn thành công, app mở lại, phiên đã khôi phục hay chưa; process start thành công chưa chứng minh tab/project đã phục hồi.

## Khả năng kỹ thuật và quyền

- AppKit hỗ trợ Quit bình thường và quan sát termination; không dùng forceTerminate như fallback tự động.
- Chrome có `--restore-last-session` và logic last opened profiles trong source Chromium. Đường launch macOS cần nghiệm thu riêng; lệnh `open -a` đơn thuần chưa đủ. Không đọc/sửa thủ công session DB để giả mạo state.
- Chrome AppleScript dictionary trên máy có windows/tabs/mode/URL/active tab nhưng không property profile rõ ràng. Không dựa vào snapshot URL để suy profile và không coi mở URL là phục hồi toàn session. Ưu tiên Chrome tự lưu/restore; snapshot/kiểm chứng sâu chỉ xin Automation nếu thực sự cần.
- Quyền Automation có thể cần khi gửi AppleEvents/đọc Chrome scripting state; nếu user không cấp, skip nhánh cần quyền hoặc cho user Quit thủ công. Không yêu cầu Accessibility/FDA/admin toàn máy chỉ để restart app. Không phát sinh permission prompt trong nghiên cứu hiện tại.
- CapCut/Adobe/Figma: mở lại executable không bảo đảm mở lại project hoặc unsaved state. Bảo vệ bằng Quit bình thường và app-native state; chỉ đưa cam kết khôi phục project vào sản phẩm khi có adapter và test cụ thể.

## Acceptance trước ship

- Quick theo đúng scope mới ở spec 14; detail scan không double count hoặc dùng parent bao phủ child được bảo vệ. Lựa chọn/rule riêng từng scope; nền bảo vệ mutation dùng chung.
- Chrome fixture: ít nhất 2 profile, mỗi profile 2 cửa sổ, tab ghim/thường/group; startup không mặc định Continue where left off; Quit + clean cache + restore vẫn đúng profile/tab, Cookies/Bookmarks/History/extension không đổi ngoài thay đổi tự nhiên của app. Guest/incognito/form ngoài cam kết; không lưu URL ẩn danh vào log.
- Chrome đóng trước Dọn không bị mở lại; background mode/helper chưa thoát không bị dọn vội. Profile bị policy khóa không báo khôi phục thành công giả.
- CapCut/Adobe fixture đang có unsaved edit: Save/Cancel được tôn trọng; Cancel không mutation. Adobe queue/export active phải chờ hoặc skip.
- Timeout, app restart giữa Quit và cleanup, permission denied, cleaner crash, partial deletion, launch fail: không force quit, không success giả và có hướng mở lại.

Nguồn: [Apple terminate](https://developer.apple.com/documentation/appkit/nsrunningapplication/terminate()), [Chromium startup/restore](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/ui/startup/startup_browser_creator.cc), [Adobe shared media cache](https://helpx.adobe.com/media-encoder/desktop/encoding-and-exporting/media-cache-database.html).

## Bổ sung scope 2026-10-10

[Từ điển](12_cleanup_dictionary.md) áp dụng **toàn bộ Dọn chi tiết**, không chỉ Media. [Truth engine](13_engine_behavior_truth.md) ghi gaps. Uninstall là operation riêng: chọn Movies/CapCut có thể Trash cả project/resources; không gộp root đó vào rule cleanup cache, không tự tick broad candidate. [Spec 14](14_quick_detailed_scope.md) thay quyết định giữ Quick cũ và bổ sung dọn các lựa chọn xuyên nhóm; source đã nối các lựa chọn xuyên nhóm đủ điều kiện.
