# VXClean — task 02: triển khai lifecycle và menu bar

[Sub-process Task: DO NOT invoke other agent CLIs]

Codex đã chốt kiến trúc, user đã ủy quyền sửa. Thực thi trực tiếp, không khảo sát lại toolchain/upstream và không cần đọc lại toàn bộ source. Đợt này chỉ làm các task sau rồi báo cáo. Không gọi subagent/CLI khác, không sửa ngoài cleaner_for_mac, không launch app/FDA/dọn thật/commit/push/install. Toolchain baseline đã có docs/baseline_build_test.md: Xcode/XCTest/full SwiftUI build hiện unavailable, không thử khắc phục môi trường hoặc lặp lại khảo sát nữa.

## 1. Lifecycle — MClean/MCleanApp.swift và MClean/Services/MenuBarController.swift

- Đóng cửa sổ main/settings cuối cùng khi menuBarMonitor enabled: vẫn chạy nền, set activationPolicy(.accessory), Dock biến mất. Khi còn cửa sổ main/settings mở (kể cả minimize), vẫn regular. Popover/NSPanel không tính là cửa sổ app. Không hạ policy trong modal sheet; defer nhận notification windowWillClose trên main queue sau close.
- Mở main từ menu bar/Smart Scan/Finder service hoặc Finder reopen: set regular trước, show main chính xác, activate. Main window được gán NSUserInterfaceItemIdentifier("vxclean.main") bằng NSViewRepresentable capture (có thể thêm struct vào file MenuBarController.swift); dùng identifier thay vì first titled window. Settings có identifier riêng vxclean.settings nếu cần. Đổi .background(WindowOpenerCapture()) thành helper capture action + window main identifier. Settings capture SwiftUI openSettings nếu macOS14+, fallback selectors macOS13.
- Đóng cửa sổ khi menuBarMonitor false: thoát như cũ. Tắt menu bar ở trạng thái nền mà không còn cửa sổ: mở lại main và regular để không mất đường vào. Quit/Cmd+Q vẫn terminate. XCTest bypass toàn bộ status item và notification machinery mới.
- Rename notification values/namespace từ MClean sang VXClean trong các file liên quan nhưng tên Swift enum/class/struct MClean có thể giữ để giảm churn. UserDefaults bundle namespace sẽ cách ly nhờ bundle ID riêng; đổi key MClean.OnboardingComplete và MClean.ScheduleConfig ở mọi nơi cùng lúc. Task02 không cần bulk localization tất cả source.

## 2. SystemMonitor và MenuBarMonitorView

- Menu popover width 380pt, scroll nếu nội dung vượt màn hình, native colors/type, light/dark. Giữ quick actions Smart Scan/Open VXClean/Settings/Quit.
- CPU current + history tối đa30 samples (2s => khoảng1phút); SwiftUI Path sparkline hoặc Charts. Có text/accessibility, không chỉ màu. CPU history chỉ cần khi popover hiện để không gây idle SwiftUI churn.
- Memory current used/total, wired/compressed/app data chỉ nếu định nghĩa chính xác; nhãn trung tính Active/Wired/Compressed phù hợp vm_statistics64, không fake pressure. Công thức không đếm trùng; cached/freed breakdown optional nếu có cơ sở.
- Storage used/total + Available (availableForImportantUsage có thể gồm purgeable, không nói physical free). CPU/memory/disk real public APIs.
- Battery charge/power source/charging dựa IOKit.ps; omit section nếu máy không có battery. Không fake readings hoặc temperature/process stats. Sample detail memory/disk/battery chỉ khi popover present; balanced startDetail/stopDetail ở NSPopover delegate nếu SwiftUI onAppear không đáng tin. Thêm import Combine/IOKit.ps cần thiết.
- Ghi source code labels English keys; localization đầy đủ thực hiện task03. Chỉ source rebrand trong4files và key references cần cùng lúc. Không thêm dependency framework bên ngoài.

## 3. Kiểm chứng

- Typecheck standalone SystemMonitor.swift và menu view/controller subset bằng script trong scripts (timeout120s, trả exit code thực). Nếu thiếu helper types có thể dùng files thực liên quan, tránh stub để giả pass. Full SwiftUI State macro hạn chế đã biết: không sửa source để né lỗi toolchain. Ít nhất swiftc -frontend -parse cho source đổi và plutil .strings/plist.
- Cập nhật docs/verification.md trung thực mức kiểm chứng, ghi rõ chưa GUI runtime test. Kết thúc bằng summary những file sửa và checks thực chạy. Không mất thời gian khảo sát/format docs không thuộc task02.

Lưu ý: Bắt buộc tuân thủ AGENTS.md — không LaTeX, Tiếng Việt chuyên nghiệp, snake_case.
