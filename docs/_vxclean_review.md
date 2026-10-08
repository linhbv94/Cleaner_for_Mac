# VXClean — yêu cầu review của Codex

[Sub-process Task: DO NOT invoke other agent CLIs]

Tiếp tục triển khai phần chưa xong trong _vxclean_handoff.md; đọc file này sau đợt đầu và sửa những điểm dưới đây. User đã ủy quyền sửa source trong cleaner_for_mac. Không gọi subagent/CLI khác.

## Những điểm phải kiểm tra/sửa

1. Đổi PRODUCT_NAME sang VXClean có thể đổi Swift module ngầm theo tên product: đặt PRODUCT_MODULE_NAME = MClean ở target app trong cả project.yml và pbxproj để tests @testable import MClean còn hợp lệ. TEST_HOST phải trỏ VXClean.app/Contents/MacOS/VXClean, product file reference path và BuildableName trong xcscheme cũng đồng bộ. Xcodeproj phải include các file Swift và tests mới nếu có; không chỉ dựa trên việc user chạy xcodegen sau này. Ad-hoc signing khác Apple Development: sửa comment cũ mô tả stable FDA sai với config mới. App icon vẫn tạm dùng upstream.
2. docs/baseline_build_test.md: typecheck pass không chứng minh runtime 'tương thích hoàn toàn'; dùng mô tả chính xác. Lỗi StateMacro là quan sát trên SDK/toolchain hiện tại, không được nói @State chỉ xuất hiện từ Swift5.9 hoặc mọi phiên bản CLT đều như vậy. Các lệnh báo cáo phải đúng lệnh thực chạy (hoặc dẫn script), không viết glob thay argv rồi coi là exact command.
3. Quyền CLI chỉ có prefix đọc, build, python3 scripts/ten_script.py và write_file workspace. Dùng file tools để edits; batch Python tạo trong scripts khi cần. Không dùng command substitution. Không gọi command bị từ chối qua đường vòng. Nếu thiếu prefix, ghi rõ rồi xử lý các việc độc lập.
4. About: upstream link phải ghi rõ MClean gốc. Không để DonateQR/tài khoản tài trợ tác giả trông như tài khoản VXClean; bỏ card quyên góp khỏi About phiên bản VXClean (asset gốc có thể giữ). LICENSE nguyên vẹn. Dist/MClean.app là binary baseline: giữ nguyên, tài liệu rõ không phải VXClean build mới.
5. Lifecycle cần nhận diện main/settings chính xác; main window đã minimize cũng vẫn tính là mở. Popover/NSPanel không được gây hiện Dock khi chạy nền. Settings mở được trên macOS14+ (ưu tiên capture SwiftUI openSettings nếu responder selectors không đáng tin), macOS13 giữ fallback. Finder service phải mở lại MAIN window kể cả đang background; launch/reopen/app external scan không bị rơi notification trước MainWindow dựng xong. XCTest không thiết lập observers/status machinery.
6. Menu RAM: phân biệt app memory/wired/compressed/cached, không dùng active_count rồi gọi đó là toàn bộ App Memory/memory pressure. Tổng/used phản ánh công thức đang chọn và nhãn trung tính, không tạo dữ liệu giả. Disk availableForImportantUsage là khả dụng cho sử dụng quan trọng (có thể bao gồm purgeable), không gọi là physical free nếu nguồn không đúng. CPU graph 30 samples/2s là khoảng 1 phút (không ghi 30 giây); giới hạn mảng, accessibility mô tả/không chỉ màu. Battery dùng IOKit, thiếu pin thì không hiển thị; không crash nếu mô tả thiếu key.
7. Tách số liệu menu bar detail lúc popover visible với lúc idle; tránh polling disk/pin liên tục vô ích, tránh start/stop refcount leak.
8. scripts kiểm chứng phải timeout và exit khác 0 khi check fail. Không báo script 'test' exit0 là test pass nếu compiler output return1. Gom các script khảo sát dùng một lần ra _work/ (đã gitignored) bằng một script cleanup phạm vi xác định; giữ scripts có thể tái sử dụng và các runner meaningful. Không xóa file tác giả. Không thêm tests chỉ bắt chước implementation.
9. Tài liệu mới có index docs/readme.md và scope/verification/safety; ghi rõ trạng thái build đầy đủ và manual runtime chưa nghiệm thu nếu thiếu Xcode. Đưa hai file _vxclean_handoff.md và _vxclean_review.md vào docs sau khi hoàn thành (links relative, tên snake_case). Tránh ước đoán upstream commit.

Lưu ý: Bắt buộc tuân thủ AGENTS.md — không LaTeX, Tiếng Việt chuyên nghiệp, snake_case.
