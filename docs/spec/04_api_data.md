# IPC và native data contract VXClean

> **Cập nhật implementation local 2026-10-10:** xem [truth sau triển khai](17_local_implementation_status.md) và [báo cáo build/QA](../local_completion_report.md). Nội dung target dưới đây không đồng nghĩa mọi gate đã pass; các nhánh thiếu evidence đang blocked.


Version: 2.0.0 — 2026-10-10. Baseline theo source [13](13_engine_behavior_truth.md); target bảo vệ theo [15](15_cleanup_protection_policy.md). DTO target chưa triển khai, không ghi đồng bộ 100% với source. Metrics giữ 1.0; maintenance target 2.0.

## Baseline đang callable

JS invoke argument keys theo Tauri camelCase; JSON payload bên trong snake_case. Source chuẩn hiện có: [TypeScript](../../desktop/src/types.ts), [frontend bridge](../../desktop/src/services/tauri_bridge.ts), [Rust](../../desktop/src_tauri/src/maintenance_bridge.rs), [Swift](../../desktop/native/maintenance_cli.swift).

| Command | Baseline arguments/return |
|---|---|
| get_capabilities | Không args; platform/native/feature flags, menu_bar_monitor hiện false |
| get_system_snapshot | Không args; protocol_version 1.0, platform, timestamp, CPU/RAM/Disk/Battery metrics |
| start_scan | operationId, includeEmpty; hiện scan all 10 nhóm, chưa scope filter |
| cancel_scan | operationId; đọc scan/lens registered, chưa mutation cancellation |
| clean_items | payload scan_id/targets path+method/confirm_direct_delete, operationId |
| get_installed_apps | Không args; app metadata/known/discovered associated paths |
| uninstall_app | payload app_id/selected_paths/allow_admin_fallback; baseline chưa có operationId ở IPC |
| get_orphans | Không args; heuristic groups/safe flags |
| clean_orphans | selectedPaths, confirmDirectDelete; host hiện thiếu identity binding |
| analyze_space_lens | path, operationId; native depth 1/direct children, lens_id/is_partial/can_trash |
| trash_lens_item | lensId, path; grant riêng, Trash |
| choose_scan_folder | Không args; path hoặc null |
| reveal_in_file_manager, open_in_terminal | path |
| open_full_disk_access_settings | Không args; mở System Settings, không tự cấp quyền |

Clipboard qua JS API, không command copy_to_clipboard. Không gọi execute_clean/trash_space_lens_items từ spec cũ.

## Target scan và rule DTO

start_scan bổ sung `scanMode: quick|detailed`, giữ operationId; Quick backend fixed categories system_junk/user_caches/large_files, không nhận arbitrary category để mở scope. Detail có category filter được backend validation trong allowed group list và includeEmpty phù hợp. Revalidation phải theo scope ticket, không scan all làm phát sinh CLI chuyên biệt.

Response maintenance typed envelope: protocol_version 2.0, platform, policy_version, dictionary_version, operation_scope, operation_id và data. Scan data có ticket_id/scan_id, expires_at, categories, is_partial/limited_paths/unsupported_cache_paths, size_kind/estimates. Các key của DTO native snake_case; missing/invalid version/type/platform không cấp grant.

JunkItem baseline được mở rộng theo spec 15: target_id/rule_id/operation_scope/effective_safety/can_delete/blocked_reason/requires_app_quit/default_selection_reason/conditions/size_kind/is_partial. Category thêm chrome/media_apps. Các hard block không cleanable; app Quit precondition không bị nhầm hard block.

Ticket và identities do host tạo từ typed validated scan; native independently classifies policy. frontend không gửi safety/protected proof được tin cậy. Dictionary design_only không grant quyền; executable registry version/layout/evidence quyết định effective fields.

## Target mutation và recovery

clean_items target payload: ticket_id, operation_scope, target_ids, operation_id, confirm_direct_delete, confirmed_risk_target_ids. Rust và native verify scope/version/method, unique target IDs, limits và owned window before mutation. Admin_shell không là method frontend có thể chọn. Nếu giữ compatibility path payload, bắt buộc map exact granted target, không auto-grant.

Orphan/Uninstall/Lens UUID ticket riêng, cùng identity/invariant framework. Uninstall ticket lưu association/remaining targets để retry sau bundle mất; broad discovery vẫn no-admin. Orphans sửa host-native missing stamps và tests producer thật. Lens read grant không mutation root.

Progress theo operation_id và target_id, stage/outcome; cancellation mutation hợp tác ở boundary. Durable journal giữ intent/outcome/reopen obligations, query operation status sau timeout/restart; không auto replay deletion. Method/result per target, error enum theo [contract JSON](../cleanup_protection_contract.json); interrupted/outcome_unknown không success giả.

Byte counters phân biệt estimated_removed_bytes, trashed_bytes, size_kind/partial. Legacy permanently_freed_bytes nếu giữ là removed estimate; không physical free-space proof. Không đếm informational Docker reclaimable vào removable totals.

## CLI và timeout

| Luồng | Baseline | Target |
|---|---|---|
| Metrics | metrics, typed 1.0, timeout 6 giây | Shared service/single-flight, semantics giữ |
| Maintenance read/mutation | argv cố định, stdin JSON, timeout 120 giây | Typed 2.0, scope explicit, cancellation/journal/recovery, timeout có thể partial |
| Scan | scan --all, optional --include-empty | Thêm scope/mode parser (ví dụ --scope quick_cleanup); Quick không --all |
| Cleanup | clean --stdin | Same entry point, policy mandatory/ticket scope/target IDs verified |
| Apps/Orphans/Lens | Separate commands hiện có | Separate ticket/operation, no policy bypass |

Giới hạn hiện có stdout 32 MiB, stdin Swift 4 MiB, target 10.000 cần giữ/validate typed và báo error; không hang pipe, kill/reap own subprocess hữu hạn. Nếu cần đổi timeout vì workload, ghi hằng số mới và test thay vì âm thầm dùng số cũ. Host shutdown không để owned engine tiếp tục mutation.

## Menubar

Metrics service host-owned, shared main/panel. Panel chỉ metrics + request open main/navigation/settings/quick scan read; mutation main-only. Capability menu_bar_monitor true chỉ khi native tray setup đạt; secondary window không được grant maintenance mutations. Native menu Quit/reopen phải dùng common lifecycle handler, không frontend-only hide.
