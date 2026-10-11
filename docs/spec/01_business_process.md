# Quy trình nghiệp vụ và ma trận quyết định VXClean

Version: 2.0.0 — 2026-10-10. Target chưa triển khai đầy đủ. [Scope](14_quick_detailed_scope.md), [policy](15_cleanup_protection_policy.md) ưu tiên; baseline ở [13](13_engine_behavior_truth.md).

## Phân công UI/host/native

| Bước | UI | Rust host | Swift native |
|---|---|---|---|
| Scan | Chọn Quick/Detail, progress/cancel | Validate scope, child ownership, parse typed response | Read-only đúng scanners/roots, rule classification, partial report |
| Selection | Default theo rule; Large Files false, unsupported disabled | Lưu UUID ticket/snapshot/identity | Không cấp quyền từ checkbox hoặc category name |
| Review | Số mục/bytes/method/hậu quả/app cần Quit | Verify ticket/selected target IDs, risk confirmation | Policy, operation boundary và preconditions |
| Chuẩn bị | Quit/skip/cancel, Save/Cancel của app | Track app-reopen obligations | Chờ helper/build/export; revalidate exact targets |
| Mutation | Hiển thị từng mục, cho cancel | Single mutation, durable progress/journal | Check policy/identity/descendants trước từng mutation |
| Kết quả | Removed/Trash/blocked/partial rõ | Retire grants, persist known outcomes | Không auto replay target completed/unknown |
| Recovery | Hiển thị interrupted và hướng mở lại app | Reconcile journal, không tự chạy lại xóa | Verify trạng thái còn lại trước retry |

## Quyết định

- Scan không yêu cầu đóng app; cleanup cần Quit chỉ cho adapter/lifecycle xác định. Không force quit hoặc discard unsaved work.
- Cache tái tạo được và đúng layout có thể tick; mutation vẫn phải thỏa conditions. Unknown/protected/informational không được Select all cấp quyền.
- System cache/temp/log child chỉ vì size/age không là safe. System-managed chưa có proof read-only; user-app rotated logs default 30 ngày + keep latest + closed proof, không dựa tuổi đơn thuần.
- Node/Brew và nhóm chuyên biệt không vào Quick hoặc broad User Cache. Parent chứa protected/unknown child không được wipe.
- Dọn từng nhóm chỉ nhận selection nhóm đó; dọn các lựa chọn xuyên nhóm phải review tổng hợp và xử lý dependency/shared app cache trước. Orphans operation riêng.
- Large Files/Mail/Archives/history là dữ liệu có hậu quả; target defaults không tự chọn như cache. Trash xóa vĩnh viễn khi user chọn/confirm trong Detail.
- Uninstall associated không tự nghĩa disposable; broad default false/Trash/no-admin. Retry known residual dùng ticket còn lại sau bundle mất, không bỏ app guard toàn cục.
- Permission denied không là lý do mở rộng scope/admin. FDA do user cấp; read failure có thể do nhiều nguyên nhân.
- Đóng main giữ tray, ẩn Dock; Quit dừng ở boundary có journal. Không tự bật autoClean/scheduled cleanup hoặc login autostart trong task này.
