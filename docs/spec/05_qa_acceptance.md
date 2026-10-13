# Acceptance và release-preparation gates VXClean

> **Cập nhật implementation local 2026-10-10:** xem [truth sau triển khai](17_local_implementation_status.md) và [báo cáo build/QA](../local_completion_report.md). Nội dung target dưới đây không đồng nghĩa mọi gate đã pass; các nhánh thiếu evidence đang blocked.


Version: 2.0.0 — 2026-10-10. Checklist target, chưa đánh pass. [Policy](15_cleanup_protection_policy.md), [menubar](16_menubar_release_ui.md), [scope](14_quick_detailed_scope.md).

## Scenarios bắt buộc

```gherkin
Feature: Quick scope và backend protection
  Scenario: Quick không quét nhóm chuyên biệt
    Given fixtures có Node Brew Docker Chrome AI Media và ba nhóm Quick
    When user chạy Quick rồi revalidate các target Quick
    Then chỉ System Junk User Cache Large Files scanners được gọi
    And không CLI chuyên biệt nào chạy
    And dedicated roots không xuất hiện qua User Cache hoặc parent

  Scenario: Scanner sai không cấp quyền xóa protected
    Given scanner/UI trả target chứa updater runtime hoặc OS critical
    When host/native nhận yêu cầu xóa kể cả Select all
    Then policy từ chối trước mutation
    And hash/identity dữ liệu protected giữ nguyên

  Scenario: Child mới dưới parent cùng inode
    Given directory target đã được scan
    And một protected child mới được thêm với parent inode không đổi
    When cleanup bắt đầu
    Then target trả scope_changed hoặc protected_target
    And child mới không bị xóa

  Scenario: Không dùng chéo ticket
    Given ticket quick_cleanup còn hạn
    When caller đổi scope sang uninstall hoặc detailed_cleanup
    Then request bị từ chối trước mutation

  Scenario: Dữ liệu lớn cần lựa chọn
    # Cleanup cache và uninstall app là hai phạm vi riêng.
    Given file cá nhân vượt threshold trong Documents
    When Quick hoàn tất và user dọn lựa chọn mặc định
    Then file mặc định bỏ tick và còn nguyên
    And chỉ khi explicit chọn và confirm mới được Trash

  Scenario: CapCut cleanup và uninstall có phạm vi khác nhau
    Given Movies/CapCut chứa cache đã phân loại và project fixture
    When user scan dọn rác Quick hoặc Detail
    Then không có target xóa toàn Movies/CapCut
    And project không được cấp quyền xóa qua parent cache
    When user scan gỡ CapCut
    Then Movies/CapCut có thể xuất hiện như dữ liệu liên quan chứa project
    And target này mặc định bỏ chọn
    And chỉ ticket uninstall với lựa chọn và xác nhận mất dữ liệu mới được Trash cả folder

  Scenario: App Save Cancel được tôn trọng
    Given app có unsaved project và cache được chọn cần Quit
    When app hoặc user hủy Quit
    Then cache của app đó không mutation
    And không force quit

  Scenario: Partial operation sau crash
    Given một target đã mutation và target tiếp theo chỉ có intent
    When engine/host bị dừng rồi mở lại VXClean
    Then completed target không tự chạy lại
    And pending target được reconcile hoặc outcome_unknown
    And user thấy kết quả và nghĩa vụ reopen app

  Scenario: Retry uninstall residual sau bundle mất
    Given bundle đã Trash nhưng known residual permission_denied
    When user explicit cho phép retry admin residual
    Then ticket remaining association được revalidate
    And broad discovery không được admin fallback

  Scenario: Orphans đi qua host payload thật
    Given supported orphan fixture và UUID ticket
    When Rust tạo request gửi Swift
    Then identities/scope/version đầy đủ và target hợp lệ được xử lý
    And payload thiếu identity bị chặn

  Scenario: Main close và Quit khác nhau
    Given native tray đã initialized và main đang mở
    When user đóng main
    Then main ẩn và Dock biến mất nhưng tray còn
    When user mở main từ tray rồi Cmd+Q
    Then app thoát và owned timers/children kết thúc có journal
```

## Edge case matrix

| Gate | Kiểm tra | Mong đợi |
|---|---|---|
| Paths | symlink/ancestor swap, traversal, alias, hardlink, dot/root/self, protected injection | Refuse ngoài authority, không follow/overwrite/xóa protected |
| Tickets | expired/wrong scope/method/version, duplicate/replay, stale after mutation | Reject/renew read+review, không tự grant mới |
| Directory | protected/new child, partial/truncated enumeration, same inode/type change | Không whole-parent wipe |
| Cache semantics | npm _cacache vs _npx, updater pending, DB/WAL, projects/model/site offline | Exact cache removed; protected hashes unchanged |
| Logs/temp | fresh/open temp, active/recent/latest log, 29/30/31 ngày | No active deletion; age alone không đủ proof |
| Lifecycle | shared Adobe helpers/export, cache build busy, app restart, Save/Cancel/timeout | Wait/skip; no vendor-wide kill/false restore |
| Chrome | 2 profiles, pinned/grouped/tab/windows, startup không Continue where left off | Regular sessions restored; incognito/forms excluded |
| Operations | cancel/host Quit/child timeout/crash at intent/outcome boundary | Durable partial/interrupted, no auto replay |
| Detail | category/global Select all, risky supported vs disabled, overlapping paths | Đúng lựa chọn, hậu quả đầy đủ, dedup bytes/mutation |
| Menubar | 1x/2x light/dark, monitor edge, keyboard, stale/error/no battery, sleep/wake | SVG thật/template, panel clamp, no duplicate sample/listeners |
| Artifact | packaged engine vs source hashes, native UI no mock, version/platform matrix | Evidence đúng gói, không chỉ debug binary local |

## Checks và bằng chứng bàn giao

Rerun meaningful tests hiện có: native maintenance (11 nhóm baseline), Rust lib (6 baseline), retention, uninstall selection, circle packing và TypeScript/build. Bổ sung tests policy/host-native producer, scopes, journal và lifecycle mới; pass baseline không thay coverage mới. Không khóa assertion vào behavior nguy hiểm chỉ để regression xanh.

Dùng fixture user data tự tạo/temporary home, không dọn máy thật. Native Trash cần test với fixture có quyền hợp lệ; sandbox permission-denied chỉ chứng minh failure handling. Real GUI/package: Quick/Detail selections, dictionary/default, uninstall retry, Lens, head bar bỏ Bản thử, tray/Dock/Quit, stale/sleep và app Quit/restore. Không dùng build thành visual/runtime pass.

Báo cáo lưu artifact/version/hash/OS/architecture, pass/fail/untested từng gate và remaining disabled branches. OS/application/layout chưa test → support hạn chế, không copy mutation rule sang Windows. Nếu Chrome restore hoặc adapter chưa đạt, ghi rõ blocker và giữ mutation blocked; không âm thầm hạ yêu cầu thành launch-only.

Chuẩn bị release không đồng nghĩa được publish. Không ghi all-ready khi P1 policy/data loss hoặc partial reporting còn fail; không công bố auto-update/signing/Win QA khi chưa làm task đó.

## FDA preflight regression

- Restricted/unknown/probe failed: không bắt đầu scanner; nhiều yêu cầu dùng1dialog. Cancel/ESC đóng sạch, không hiện banner lỗi quét.
- Confirmed/not-required: gọi luồng cũ đúng1lần; recheck/focus không replay. Cancel/stale generation sau grant không scan.
- Revoked trong rescan app-quit flow: lỗi noninteractive, finally restore không treo chờ quyền. Permission thật không bị lọc như cancellation.
- Metadata Lens navigation không chạy access probe/scanner; OS-denied/partial không đồng nhất với FDA.
- Grant FDA thật trong Settings và persistence qua2bản signed cùng identity cần evidence riêng; tests/bool/localStorage không thay.
