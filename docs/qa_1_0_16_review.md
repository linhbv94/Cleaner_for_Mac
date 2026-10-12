# VXClean 1.0.16 — QA độc lập và phát hành

Ngày: 2026-10-12. User xác nhận đóng QA trước, giao một lượt QA độc lập mới rồi publish. Lượt mới chưa được user đóng.

## QA mới

- Review source: Space Lens giữ snapshot Rust ở host, trả danh sách con từ bộ nhớ; query không đọc filesystem hoặc cấp quyền xóa. Host giữ tối đa hai cây trong năm phút; worker có progress, cancel, timeout 120 giây và giới hạn output gzip 32 MiB. Giới hạn output không phải trần RAM.
- Uninstall cấp quyền cho toàn root user chọn; native kiểm tra root identity/metadata, bundle ID/version, app đã thoát, association/SIP/self trước Trash. Root-only không được áp dụng sang Quick/Detail/Lens. Scope vẫn theo spec 04/15/24.
- Chạy lại độc lập: 43 Rust tests, 35 nhóm native fixtures, 9 nhóm manager, frontend, folder cache/history, retention 10, selection 5, geometry 18 và 7 release guards đều đạt. Rust có fixture 50.050 file, cây sâu 100 tầng, query sau khi xóa fixture, TTL/mutation và no-grant. Scanner cùng source type-check Windows MSVC đạt; full app/runtime Windows chưa thử.
- Native UI: scan fixture riêng, thêm file sau scan rồi đi lần đầu vào branch/deep/leaf vẫn dùng snapshot cũ và không scan lại; Quét lại thấy file mới. Guard từ chối vùng /private. Hủy scan Home trả lại UI, worker kết thúc; không coi đó là Home scan đầy đủ.
- **Lỗi tìm thấy và đã sửa:** Trash từ nhánh sâu quét parent mới nhưng confirmation lấy size cũ. Fixture tăng từ 4,1 KB lên 4 MiB mà preview vẫn 4,1 KB. Sửa lấy item mới vừa quét; gói rebuild hiển thị đúng 4,19 MB. Hủy giữ file, marker ngoài không bị tác động; đã dọn fixture của QA.
- Gói local 1.0.16 App/DMG/updater build đạt, codesign deep/strict, chữ ký thật và tamper rejection đạt. GUI preview đã thử trên source sửa trong gói local 1.0.15; bump metadata sang 1.0.16 không thay logic đó. Chọn 1.0.16 để app local 1.0.15 đang cài có thể nhận bản sửa qua updater.

## Phát hành và bằng chứng

- [VXClean 1.0.16](https://github.com/linhbv94/Cleaner_for_Mac/releases/tag/v1.0.16) đã publish stable/latest, release ID `410459951`, tag commit `374845e4fe6ac3757b60acd9a793bf2a20dcb900`.
- [PR #3](https://github.com/linhbv94/Cleaner_for_Mac/pull/3) merge sau [PR CI](https://github.com/linhbv94/Cleaner_for_Mac/actions/runs/38232036841) cả hai Mac đạt; main checks `38233409157` cũng đạt.
- [Release CI](https://github.com/linhbv94/Cleaner_for_Mac/actions/runs/38233420313) hai build và validate đạt; [publish](https://github.com/linhbv94/Cleaner_for_Mac/actions/runs/38236888275) success đúng tag.
- Tải thật năm assets: version/layout/URL/kích thước/GitHub SHA-256 digest đúng. Hai chữ ký updater đạt; sửa một byte bị từ chối. App hai kiến trúc có metadata/icon/codesign deep/strict đúng và không chứa hook test. Hai DMG checksum hợp lệ; đã mount readonly, đối chiếu host/engine/icon với updater app và detach.
- Manifest stable/latest 1.0.16 và năm assets public HTTP200 không dùng token; platform URLs khớp manifest đã xác minh.
- Mở lại app đang cài 1.0.15: startup tự thông báo có 1.0.16. Không download/install/restart, không thay app trong Applications.
- [Evidence](qa_1_0_16_evidence.json) ghi source hash, CI IDs, asset digests và từng mức kiểm chứng.

## Giới hạn

- Không gỡ app, dọn file user, cấp FDA/admin hoặc đổi quyền hệ thống trong lượt này. Mutation fixtures chỉ dùng dữ liệu tổng hợp.
- Intel GUI/macOS cũ, full Windows app/runtime, Cancel hộp xác thực OS mới và updater download/install/restart chưa thử. Detailed vẫn đang hoàn thiện; không tuyên bố an toàn mọi dữ liệu thật hoặc scan toàn máy đầy đủ. Gói Mac ký ad-hoc, chưa notarize.
