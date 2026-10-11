# Quick: phạm vi cache và scan/clean parity — 2026-10-11

> Quy tắc System Junk hiện hành là mục **Quyết định thay thế: System Junk clone MClean toàn bộ** bên dưới; các giới hạn System Junk trước mục đó đã bị user bác bỏ. User Cache/detailed giữ policy riêng.

User bác bỏ nghiệm thu321MB khi scan tính cả1GB bị khóa. Gate Quick mở lại; không ready cho đến khi mọi item trong kết quả dọn đều được chọn/dọn bằng engine. Không chỉ đổi nhãn hoặc giấu lỗi coverage để đạt con số đẹp.

- Đối chiếu MClean gốc trong repo: User Cache duyệt ~/Library/Caches, chỉ loại Homebrew/Ollama theo nhóm chuyên biệt. VXClean thêm filter Google/Adobe/AI/ShipIt gây127MB; bỏ filter rộng đó cho discovery. Không thêm Application Support/Movies vào Quick. Node/Brew CLI vẫn không chạy.
- Cache thực tế ordinary trong Library/Caches (Google/Chrome, Adobe, AI frontend) cần executable cleanup rules và lifecycle tương ứng, không loại cả vendor chỉ vì có nhánh detail. Giữ pending/update staging/state và updater đang dùng, không dọn project/runtime/system critical. Inventory excluded phải có tên/byte/lý do riêng và không gọi là rác có thể dọn.
- Quick categories chỉ chứa target cleanable; category total và total_cleanable_bytes là tổng chính xác cùng tập target. Large Files vẫn opt-in/Trash; không nhận diện file cá nhân là cache. Giữ excluded_items riêng chỉ đọc để user kiểm tra toàn ledger, không cấp grant; scan partial phải nói rõ.
- Foundation HTTP cache: fsCachedData và các file Cache.db/WAL/SHM/journal nhận diện exact đều là cache tái tạo; full selection phải kiểm chứng cache miss→store/read lại, giữ Preferences/cookie/auth ngoài scope. Không khóa riêng database chỉ vì là DB trong cache đã biết.
- Có cache cần đóng app: Quick dùng flow Quit/Cancel/rescan/reopen như detail, nhưng giữ operation_scope=quick_cleanup toàn đường đi; không mượn detail/uninstall grant. Hủy/Skip báo rõ chưa dọn đủ, không ghi completed-all.
- Quick không đạt gate chỉ vì metadata is_cleanable=true: test scan tất cả eligible→host/native mutation thật→rescan0 eligible trên fixture, giữ excluded hashes; có Google/Adobe/AI ordinary cache. Thay đổi nội dung/permission/fresh state vẫn failclosed và partial thật, không ép success.
- Thanh thao tác bị ngắt có nút X bên phải để ẩn các cảnh báo hiện có trong phiên. Journal/reopen obligations/updater safety guards vẫn tồn tại; thao tác bị ngắt mới phải hiện lại. Không tự replay/xóa journal.

Chênh lệch baseline local: tổng Library/Caches2.016.948.267bytes;Google621.298.233,Adobe422.015.882,Anti363.255.137,AntiShipIt480.700.843. Anti update.zip và ShipItState/update.* mới~20phút, pending còn hiện hữu; không khẳng định chúng là cache frontend vô hại. Byte thay đổi khi app dùng/update; không lấy2GB snapshot làm mục tiêu xóa mù.

- Giữ Local Storage, History, Bookmarks, Web Data kể cả layout đặt nhầm trong Library/Caches; fixture Quick phải dọn hết cache nhưng giữ byte các state này.

## Điều chỉnh theo user: góc nhìn dọn rác

- Quick adapt roots MClean, không có ngưỡng24h chung cho log/temp. Không bảo vệ executable, library, target, source/config hoặc tên thư mục QA/build chỉ vì agent đang build. node_modules/venv trong temp là môi trường có thể dựng lại; không đồng nhất với runtime app đã cài.
- Giữ structural roots, ngoài roots, symlink/hardlink/special file, identity/content race, credential/project/profile, lock/socket/IPC và dữ liệu chưa xác định là có thể tái tạo. IPC không tự coi an toàn chỉ vì có tuổi.
- Đối với build/cache/test trong temp, hậu quả: có thể phải tải/build/tạo lại môi trường; lỗi tạm của tiến trình đang dùng không phải lý do giữ vĩnh viễn. File fixture không tự sinh từ app, nhưng không cần cho app đã đóng gói.
- Không đổi policy detailed theo yêu cầu Quick. Kiểm thử: temp tool executable + library + target + npm _cacache + Swift PCM + source/config cũ/mới được dọn; project/auth/lock/IPC giữ; total scan=clean, rescan0 trên fixture.
- Ngoài kết quả dọn nằm SAU toàn bộ category result, trước footer; mặc định thu gọn, không nằm trên SystemJunk.

## Đơn vị dung lượng

Toàn bộ VXClean dùng hệ thập phân: KB=1000B, MB=1000²B, GB=1000³B. Dashboard/RAM/disk/menu panel và scan/detail/uninstall/SpaceLens cùng formatter; raw bytes và các giới hạn kỹ thuật không đổi. Không đổi source MClean đối chiếu.

## Quyết định thay thế: System Junk clone MClean toàn bộ

Yêu cầu cuối của user thay thế các giới hạn System Junk ở trên: dùng chính ScanEngine.scanSystemJunk với sáu roots, ngưỡng >1024B và cách tính size của MClean. Không lọc tuổi, tên profile/project/updater, extension database/credential/lock, IPC hoặc hardlink trong các roots này. Profile gốc ngoài roots không được kéo vào. Xóa toàn item như CleaningEngine MClean; quyền ghi thiếu dùng popup xác thực admin hệ thống, hủy/lỗi phải báo partial. Không thay User Cache/detailed/uninstall. Giữ kiểm tra đường dẫn root, top-level symlink, manifest/identity đổi sau scan. Hardlink chỉ unlink đường dẫn được chọn, không sửa dữ liệu ở alias khác.

Hiệu năng: đo và sửa timeout Large Files; không chỉ tăng timeout hoặc báo hoàn tất khi thiếu dữ liệu.

Hiệu năng Large Files: mỗi root Downloads/Documents/Desktop có worker riêng chạy song song, budget 5 giây/root; wrapper 20 giây vẫn là backstop. Metadata POSIX không đọc nội dung file. Root kẹt bị kết thúc, kết quả root đã xong vẫn trả về; timeout/partial hiển thị thật. Đây là xử lý chờ filesystem, không khẳng định đã quét root timeout. Hidden/excluded folders và ngưỡng size/age được giữ; package thông dụng được prune.

## Rà toàn pipeline, không suy luận parity từ số GB

System Junk Quick không dùng full-tree manifest 20.000 entry/4 giây/3 MB để phân loại/khóa/split mục; proof chỉ gồm định danh và metadata của mục được MClean scanner phát hiện. Không kiểm tra tên/nội dung child; xóa toàn item như MClean. Thay đổi nội dung sâu bên trong không được đảm bảo phát hiện như rule cache chi tiết; không mô tả System Junk có full content-race protection. Guard Xcode đang mở chỉ áp dụng category khác, không áp dụng System Junk có đường dẫn tạm chứa Xcode. UI không có filter vendor/name riêng. Test cần directory >20.000 entry, profile/project/updater names, lock/IPC/DB/hardlink và đường dẫn Xcode bên trong tmp; phải chọn và dọn được tất cả.

Các khác biệt thực thi vẫn công khai: scan ticket hết hạn, protocol/scope, đúng item/phương thức đã chọn, identity/path đổi, user Cancel, quyền OS và lỗi I/O, timeout/cancel process. Đây là điều kiện thực thi, không là rule giữ cache theo tên/tuổi/extension. Không gọi tổng GB bằng nhau là bằng chứng rule giống nhau.


## Audit rule nguồn 2026-10-11

Ground truth System Junk Quick đối chiếu scanner MClean gốc `42cf1f8`, không dựa vào tổng GB. Phép tính dung lượng giữ `.skipsHiddenFiles` và giới hạn 10.000 entry mỗi thư mục của nguồn gốc; xóa vẫn toàn mục. Root-only proof ở Swift/Rust bỏ giới hạn nội dung con khỏi eligibility nhưng không chứng minh race nội dung con. Test độc lập nguyên scanner gốc xác nhận exact path/size/default selection, 26 nhóm native PASS. Xem [audit toàn pipeline](../system_junk_rule_audit.md) để biết mọi guard thực thi còn lại và giới hạn kiểm chứng.

## Làm rõ phạm vi Library/Caches — user chốt 2026-10-11

Chrome/Adobe/CapCut/Codex trong Library/Caches vẫn được Quick xét quét/dọn; các category riêng chỉ ở Detailed không có nghĩa cache vendor bị loại khỏi Quick. Detailed mở rộng vùng riêng, không cần thay thế toàn Quick coverage. Dedicated owner filter `adobe` chỉ áp User Cache Detailed; Quick vẫn có thể dọn Library/Caches/Adobe. Không coi hai nhánh khác coverage này là lỗi chuyển nhánh theo yêu cầu user mới. Các vấn đề pnpm/yarn/Ollama và filter thực thi chưa thay đổi; xem [audit User Cache](../user_cache_rule_audit.md).

## Detailed không trùng target Quick — user chốt 2026-10-11

- Quick sở hữu các target thực sự cleanable trong Library/Caches và các vùng Quick đã chốt. Category Media/Chrome/AI Detailed chỉ bổ sung target chưa được Quick bao phủ; ví dụ CapCut Library/Caches ở Quick, CEF cache trong Movies ở Media Detailed.
- Loại khỏi Detailed cả đường dẫn trùng và child nằm trong target Quick cleanable. Không cấp grant parent Detailed bao trùm target Quick; phải tách thành phần ngoài coverage hoặc giữ parent chỉ đọc, tránh xóa xuyên phạm vi.
- Không suy diễn coverage chỉ từ tên vendor hoặc root Library/Caches. Phần Quick blocked/không hỗ trợ không được coi là đã có khả năng dọn; nếu có adapter Detailed riêng hợp lệ thì vẫn có thể phục vụ phần đó.
- Không phụ thuộc user đã nhấn Dọn Quick hay chưa. Đây là phân quyền target giữa hai luồng, không phải lịch sử thao tác. Coverage phải được xác minh theo rule hiện tại, không dùng selection/tick tạm thời của user; cache scan cũ không được cấp quyền mutation mới.
- Không cần chạy lại Large Files/Node/Brew để tính coverage Quick User Cache. Tái sử dụng classifier/scanner chung; không tạo hai bộ rule độc lập để tránh drift.
- QA bắt buộc: Quick parent/Detail child, Quick child/Detail parent, sibling ngoài coverage vẫn giữ, Quick blocked nhưng Detail adapter hợp lệ, đổi dữ liệu/rule sau scan, selection và cleanup grant không vượt scope.
- **Trạng thái:** đã nối dedup theo eligibility Quick. Target/child Quick bị loại khỏi Detailed; parent bao phủ target Quick bị chặn và chỉ hiển thị phần ngoài Quick. Scanner Large Files thuộc Quick. Fixture và gói mới xem [spec22](22_manager_prune_installer_cleanup.md).
