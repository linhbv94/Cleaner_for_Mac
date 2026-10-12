# Quick production: host manifest và alias macOS

Ngày: 2026-10-11. User báo bản cài1.0.3 chọn Quick nhưng lỗi protected_target: partial/unsupported target, không tới password admin.

Host collect_manifests bỏ lỗi manifest âm thầm; canonical check từ chối /tmp dù native cho phép alias /private/tmp. bind_identities từ chối toàn lô trước native clean/admin. Không phải password sai hay cần Full Disk Access để sửa alias.

Sửa: chỉ chấp nhận alias OS cố định /tmp↔/private/tmp, /var/log↔/private/var/log, /var/tmp↔/private/var/tmp giống native. Giữ path gốc trong snapshot để host/native đồng nhất; arbitrary symlink/identity/content change vẫn bị chặn. Không đổi rule MClean, không bỏ proof, không tự nhập password hoặc nâng quyền trước khi cần.

Nghiệm thu: fixture raw /tmp qua remember→bind→production native clean, chỉ xóa fixture; custom symlink bị từ chối. Probe read-only mọi Quick target production phải có host manifest. Password vẫn chỉ xuất hiện khi native gặp lỗi permission và cần admin; không hiện vô điều kiện.

Patch local 1.0.4: 23 Rust tests đạt, gồm host → native production xóa fixture /tmp và từ chối symlink tùy ý. Probe 318 mục Quick của bản cài không còn lỗi host manifest (116 mục dùng alias). Chưa xác minh popup admin hoặc thao tác dọn qua GUI. Không commit/tag/publish. Báo cáo: [quick_host_alias_fix_report.md](../quick_host_alias_fix_report.md).
