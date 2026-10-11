# User flow và state machine VXClean

Version: 2.0.0 — 2026-10-10. Target; chưa nhận định source đã đạt. [Policy](15_cleanup_protection_policy.md), [menubar](16_menubar_release_ui.md).

## Read/selection flow

`idle → scanning → ready|partial|failed|cancelled`. Mọi event theo operation_id; cancel không hủy nhầm lượt khác. Kết quả ready cấp UUID ticket đúng operation và versions. Đổi tab không scan lại nếu state còn fresh trong retention 5 phút; mutation invalidates trước/sau, restart không reuse authority cũ.

Quick chỉ ba nhóm; Large Files default false/Trash. Detail có categories rỗng/blocked với giải thích, chọn từng nhóm hoặc selections tổng quan. Scan incomplete không grant parent subtree. Rule/layout chưa support hiển thị unknown/disabled.

## Cleanup flow

`planned → awaiting_confirmation → quitting_apps → revalidating → mutating → completed|partial|cancelled|failed|interrupted`.

1. Selection snapshot theo target IDs/rule/scope/version; review hậu quả từng risk row và direct delete/Trash.
2. Nếu app/helper/build đang dùng target, Quit bình thường hoặc skip/chờ; Save/Cancel/timeout không mutation target đó. Không tự chạy app vốn đang đóng.
3. Re-scan chỉ scope được chọn, revalidate rule/path/device/inode/descendants, reject scope_changed. Không thêm selection từ dữ liệu mới.
4. Persist intent rồi mutation target exact; update outcome. Không coalesce parent bao protected child; dedup path/identity và bytes.
5. Cancel ở boundary; timeout/crash có thể partial/outcome_unknown. Không re-run xóa tự động sau restart.
6. Mở lại app VXClean đã thực sự Quit theo recovery record; báo launch và restore riêng. Chrome profile/tab thường phải fixture nghiệm thu; incognito/forms ngoài cam kết.

## Uninstall/Orphans/Lens

Uninstall: inventory → app ticket + known/discovered association → explicit selection → review data loss → Trash. Apple/self/running app protected; broad candidate default false. Mixed success giữ ticket residual để retry permission-denied known paths; admin confirmation không áp discovery.

Orphans: heuristic candidates → riêng orphan ticket → supported volatile targets + identity → confirm → policy → mutation/report. Absence không proof đã uninstall; unknown/app support/preferences bị chặn nếu không có rule.

Lens: folder read grant → depth 1/direct children → drill-down/breadcrumb → selected can_trash target → riêng lens ticket + identity → Trash. Outside Home chỉ read, Home Library/dot/Applications/root/self/running app protected. Không whole-root delete.

## Main/panel lifecycle

`main_visible → background → main_visible`; `main_visible|background → quitting → exited`.

Main close/Cmd+W hide window/panel, accessory activation, Dock biến mất, tray giữ. Tray left click chỉ toggle panel; open-main/launch/reopen show/unminimize/focus main + regular activation, không duplicate instance/window. Tray failure giữ main mở. Cmd+Q/Quit không bị close handler đổi thành hide; shared shutdown stop reads/new mutations, journal/reap children, giữ app-reopen obligations. Sleep/wake không tạo timer backlog.
