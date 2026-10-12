# VXClean1.0.16 — QA độc lập trước publish

Ngày2026-10-12. User đóng QA trước, giao QA mới độc lập và publish. Không sử dụng kết luận QA cũ như bằng chứng mới.

- Review source: Lens query trả direct-child DTO từ snapshot Rust, không đọc filesystem/cấp grant. Host giữ2 cây/5phút; worker read-only, timeout120giây/output gzip32MiB, hủy bằng cơ chế process của host. Symlink/reparse không traversal; trạng thái partial không bị coi là scan đầy đủ.
- Uninstall grant là unit root user chọn; native revalidate root identity/metadata, bundleID/version, running app, association/SIP/self trước Trash; không áp dụng root-only cho Quick/Detail/Lens.
- Checks mới:43Rust tests,35native fixture groups,9manager,frontend,folder cache/history/retention/release guards/selection/geometry đạt. Rust có fixture50.050files/depth100, query sau khi xóa fixture và TTL/mutation/no grant. Mutation tests chỉ trên dữ liệu tổng hợp.
- Native UI gói1.0.15 cũ: tạo fixture riêng, scan lần đầu, thêm file sau scan, lần đầu vào branch/deep/leaf vẫn chỉ thấy file gốc và không hiện scan. Vùng/private bị guard từ chối đúng policy.
- **Bug QA mới tìm ra:** deep-trash re-scan có grant mới nhưng confirmation dùng size snapshot cũ. Fixture original.bin tăng4.1KB→4MB, confirmation vẫn4.1KB; đã Hủy, không Trash. Sửa preview lấy item mới vừa scan; Đã rebuild/ký gói15, QA fixture cùng kịch bản hiện đúng4.19MB; Hủy giữfile4MiB. Refresh thấyfile tạo sau scan; Cancel scanHome trả UI và worker không còn.
- Chưa thử Intel GUI/macOS cũ/Windows full app/updater public install-restart. Không cấp FDA/admin, gỡ app hay dọn dữ liệu user trong lượt QA này.

Remote CI và verification/publish sẽ ghi khi hoàn tất.

- Phát hành1.0.16 để local1.0.15 đang cài có thể nhận updater; tag15 chưa tạo. Metadata bump không đổi code vừa QA. Gói16 sẽ kiểm lại version/signature, remote CI hai Mac trước publish.
