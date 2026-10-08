# VXClean — final review của Codex

[Sub-process Task: DO NOT invoke other agent CLIs]

Thực hiện trực tiếp các sửa lỗi cụ thể sau. User đã ủy quyền sửa trong cleaner_for_mac. Không khảo sát lại toolchain, không gọi CLI/subagent khác, không launch app/FDA/dọn thật, không commit/push/install. Chỉ đọc file liên quan và sửa; dùng batch script khi cần.

## 1. Safety audit hiện sai ground truth, phải viết lại

docs/safety_audit.md đang bịa đường dẫn/hàm/quote: MClean/Logic/Cleaning/CleaningEngine.swift, removeWithAdmin, OrphanFinder.swift, cleanOrphanedFiles, ScheduleManager.swift, AppUninstaller.uninstall đều không tồn tại. README quote cũng không phải nguyên văn. Không gọi kiểm tra 'từng dòng toàn bộ' hay 'thùng rác duy nhất' vì app uninstaller thông thường có trashDirectly. Viết lại ngắn, dựa trên bằng chứng thật sau, links relative từ docs tới code:

- ../MClean/Services/CleaningEngine.swift: cleanItems, dòng77: `try fileManager.removeItem(at: resolvedURL)` — xóa trực tiếp, không Trash; có allow-list và symlink recheck, nhưng không chứng minh hết race condition.
- Cùng file: cleanWithAdminPrivileges, dòng118,159: dùng NSAppleScript `do shell script` chạy `/usr/bin/xargs -0 /bin/rm -rf -- < ...` với administrator privileges. Có revalidate allow-list; KHÔNG nói 'không lớp bảo vệ nào'.
- ../MClean/Views/Orphans/OrphanListView.swift: removeSelectedOrphans line148 guard OrphanSafetyPolicy.isSafeCandidate; removeOrphan line211,213 dùng `try FileManager.default.removeItem(at: url)`; removeWithAdminPrivileges line258,266 dùng `rm -rf --` thông qua osascript. Xóa trực tiếp.
- ../MClean/ViewModels/AppState.swift: removeSelectedFiles line278 gọi trashDirectly. trashDirectly line365-382 dùng `try FileManager.default.trashItem(at: url, resultingItemURL: &resulting)`; khi cần admin fallback cleanWithAdminPrivileges. Vì vậy uninstaller có luồng thường Trash + fallback admin xóa trực tiếp, không được gộp mọi uninstaller thành removeItem.
- ../MClean/Services/CleaningEngine.swift: trashItems line379,402 dùng `try fileManager.trashItem(at: item.url, resultingItemURL: nil)`; ../MClean/ViewModels/SpaceLensViewModel.swift line141 gọi hàm đó. Space Lens Trash.
- ../MClean/Services/CleaningEngine.swift: emptyTrash line230,242 removeItem(atPath:); chỉ xóa contents Trash. purgePurgeableSpace line204 gọi diskutil, không cùng cơ chế file delete; scannable và scheduled không tự purge category này.
- ../MClean/Services/SchedulerService.swift, ../MClean/ViewModels/AppState.swift: runScheduledScan gần1160 scan categories; nếu config.autoClean && totalFound >= minimumCleanSize thì cleanAll() (guard active/selected items). Không kết luận user được xác nhận theo từng file khi scheduled; ghi needs runtime validation. Models.ScheduleConfig.autoClean mặc định false. Core cleanup behavior giữ baseline, chưa chạy dọn dữ liệu thật.
- README gốc cam kết 'Trash, never rm' (đọc docs_upstream/readme_original.md để paraphrase chính xác, không đặt fabricated English quote). Báo cáo là review tĩnh các entry points trên, không full security audit/certification. Chưa có regression tests xóa thực tế.

## 2. Hai sửa ngắn trong menu bar

- MenuBarController delegate đang startDetail/stopDetail nhưng teardown có thể hủy controller trước didClose. Thêm private detailSamplingActive bool + setter idempotent; willShow true/didClose false; teardown gọi false trước performClose/remove status/stop. View không quản lý sampling. Chỉ một controller owner start/stop timer.
- SystemMonitor sampleBattery: pState thiếu/lạ không được tự suy thành battery. Guard pState là kIOPSACPowerValue hoặc kIOPSBatteryPowerValue (không có key thì bỏ reading). MenuBarMonitorView power-source Text dùng explicit LocalizedStringKey hoặc if branch để localization chắc chắn. Nếu plugged, !charging && !charged thì nhãn Not Charging thay vì Discharging; thêm Not Charging dịch en/vi/ja/zh-Hans/zh-Hant, còn battery power thật thì Discharging. Giữ key parity.

## 3. Kiểm chứng và hoàn thiện

- scripts/verify_source.py không được bỏ sót JSX/SWIFT errors và phải kiểm tra source thật: AppLifecyclePolicy từ Core/AppConstants.swift thực sự dùng trong AppDelegate; runner compile chính file source, không tự định nghĩa mô hình giả. Báo unit policy pass khác GUI runtime chưatest.
- Localization source keys mới: rebrand tất cả Welcome/Onboarding/FDA strings bằng cách map keys/values MClean→VXClean từ dữ liệu gốc; chỉ các chuỗi attribution About/upstream/license vẫn MClean. English keys có mặt trong cả5lang, bỏ test chỉ text assertion là thay thế runtime. Không cần xóa keys cũ unused; tránh rewrite format/comments không cần thiết.
- docs/readme.md + root README phải ghi chưa có build mới và dist/MClean.app là binary baseline. Full Xcodebuild/XCTest/GUI chưatest cần rõ. Giữ LICENSE byte identical.
- Kiểm tra archives release_support byte identical với git show 42cf1f86ae91bc191858d2ae9df197e026da8f2b:path tương ứng. Giữ nguyên core scanning/cleaning algorithms.
- Đưa file final review này và các coordinator task md khác vào docs nếu task03 đã chuyển trước; naming snake_case. Chạy kiểm chứng appropriate sau sửa, ghi docs/verification.md, summary ngắn. Không làm lại khảo sát và không phát sinh tính năng ngoài scope.

Lưu ý: Bắt buộc tuân thủ AGENTS.md — không LaTeX, Tiếng Việt chuyên nghiệp, snake_case.

## 4. Script hiện đang lỗi, cần sửa thực sự trước báo PASS

- scripts/verify_source.py hiện tham chiếu file không tồn tại Core/AppWindowManager.swift. Đúng: Services/MenuBarController.swift. Runner cũng gọi AppLifecyclePolicy.evaluate không tồn tại. API thật: decidePolicy(isMenuBarEnabled:hasNormalWindows:hasActiveModalOrSheet:currentPolicy:) trả desiredPolicy,shouldTerminate. Đọc Core/AppConstants.swift để dùng đúng API. main.swift trong TemporaryDirectory cho top-level runner, compile cùng file production thật.
- Parse mọi file Swift đã sửa dựa git diff --name-only + file Swift untracked, hoặc tất cả Swift nguồn dự án. Không bỏ Services/MenuBarController và SchedulerService.
- Thiết lập module cache tạm để compiler chạy trong sandbox, SDK từ xcrun --show-sdk-path, target arm64 macos13. Chỉ typecheck subset hỗ trợ ở CLT.
- Không dùng grep/find nếu rg có thể thay thế; không thêm quyền CLI.
- docs/verification.md hiện vẫn nói model độc lập verify_task_02.py PASS trong khi file đó không còn dùng và không gọi production. Xóa báo cáo sai, chỉ ghi kết quả runner sửa xong đã chạy thật. Đừng kết luận all checks passed khi bất kỳ lệnh fail.
