# Demo và bàn giao bản chuẩn bị release VXClean

Version: 2.0.0 — 2026-10-10. Chỉ demo feature đã có evidence ở [QA](05_qa_acceptance.md); không dùng script demo để xác nhận implementation.

1. Mở đúng packaged VXClean artifact, head bar không Bản thử; chỉ native engine, không browser mock. Dashboard CPU/RAM/Disk/Battery có timestamp và no-battery state.
2. Quick fixture: đúng System Junk/User Cache/Large Files; không Node/Brew/Docker CLI. Mở row hậu quả; Large Files bỏ tick. Dọn fixture safe, xem removed estimate/Trash/blocked riêng; OS/runtime/updater fixture giữ nguyên.
3. Detail fixture: Chrome/AI/Media/Node và các nhóm khác; dictionary/risk badge, chọn nhóm/dọn nhóm rồi tổng quan/dọn selections xuyên nhóm. Select all không mở protected/unsupported. Không demo whole profile/project như cache.
4. App Quit flow: Save/Cancel được tôn trọng; shared helper skip/wait. Sau cleanup mở lại app vốn chạy, kiểm chứng Chrome regular profiles/tabs; không claim project restore khi chỉ launch.
5. Uninstall fixture: discovered Movies/CapCut default false và cảnh báo dữ liệu project; select/Trash explicit. Apple apps bị loại hoặc blocked đúng source, self protected. Mixed success/retry known residual còn lại.
6. Lens fixture: bubble/list/drill-down/breadcrumb, outside-home read-only, selected Home target Trash với identity; Orphans heuristic copy/blocked và host identity parity.
7. Menubar SVG/template trên sáng/tối; panel real metrics/status/quick read/settings. Close main ẩn Dock/tray còn; reopen một window; Quit không owned child/timer còn sống. Sleep/wake/error/stale không false zero/scan ngầm.
8. Crash/timeout fixture: report completed/unknown và reopen obligations, không tự replay cleanup. Cho thấy giới hạn/support matrix và các rule còn disabled.

Không cần xin FDA/admin toàn máy chỉ để demo; quyền phải đúng fixture/operation. Không dùng dữ liệu cá nhân thật cho demo mutation. Không dùng số GB nghiên cứu như cam kết thu hồi, không nói an toàn tuyệt đối/CPU bằng 0/gỡ sạch mọi dữ liệu/Undo direct delete. Release preparation report phải tách code pass, packaged runtime pass và chưa publish.
