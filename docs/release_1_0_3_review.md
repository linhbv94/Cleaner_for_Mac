# VXClean1.0.3 — Release test macOS

Ngày cập nhật:2026-10-11. Draft cho QA, không publish.

- Kế thừa [review1.0.2](release_1_0_2_review.md). Intel main CI1.0.1 và1.0.2 timeout30giây ở7000file/14000event fsync. Không gọi đó là đã đạt.
- Chỉ riêng fixture bulk cho phép180giây, in thời gian thực; subprocess khác vẫn30giây. Giữ7000file,14002events, thứ tự intent/outcome, profile bảo toàn, completed và mọi mutation safety assertions. Không đổi code app/native/Rust, không bỏ fsync hay replay guard. Giới hạn30giây trên mọi runner chưa được chứng minh.
- Version1.0.3, tag cũ bất biến. Remote CI và kiểm tra assets cuối đã đạt như bằng chứng dưới đây. OS admin Cancel, tray click, Intel GUI/macOS13, updater install/restart và Detailed vẫn cần QA.

## Bằng chứng phiên bản cuối

- Tag `v1.0.3` → `bcba9d04087b4f3145e675abe06b7d0397ae1a56`. [Main checks38131736518](https://github.com/linhbv94/Cleaner_for_Mac/actions/runs/38131736518) đạt cảSilicon/Intel. Mỗi kiến trúc: Rust21, native27, manager9, release7, retention10, uninstall5, circle18 và frontend build. Bulk7000file: Silicon9.826giây, Intel33.798giây; local8.038giây.
- [Release CI](https://github.com/linhbv94/Cleaner_for_Mac/actions/runs/38131737977) đạt prepare, build Silicon, build Intel và validate. [Draft VXClean1.0.3](https://github.com/linhbv94/Cleaner_for_Mac/releases/tag/v1.0.3), ID409593328; không publish.
- AppSilicon tải từ draft: About/Info1.0.3, identifier đúng, main/Swiftengine arm64, icon khớp, codesign deep/strict đạt; không có hooks ENGINE_TESTING trong production. Dashboard trảCPU/RAM/disk/battery thật; Cập nhật tách riêng khỏi About; Cmd+Q thoát hết đăng ký VXClean. Không dọn dữ liệu user.
- Review ban đầu sửa kết quả xóa System Junk một phần từ skipped thành outcome_unknown; fixture xóa thật một phần, giữjournal và khôngautoreplay đạt. Chi tiết ở [review1.0.0](release_1_0_0_review.md).

## Phạm vi nghiệm thu còn lại

- Bản test ưu tiênQuick; System Junk giữ quy tắc gốcMClean, có xóa vĩnh viễn và thư mục tạm có thể chứa dữ liệu duy nhất. Root identity không phải semantic/content proof; số byte là estimate, không chứng nhận an toàn mọi dữ liệu thật.
- User test OS admin Cancel, physical tray click/hide/reopen, Intel GUI/macOS13, updater install/restart. AppKit fixture không thay hộp thoại OS thật. Detailed vàcoldstart/plugin/MCP vẫnbacklog.
- Gói Mac ký ad-hoc, chưa notarize. Không có Windows release. Draft không hiện trên endpoint latest public; tảiDMG thủ công đểtest.

## Assets và bàn giao

- Năm assets: latest.json, hai DMG macos_silicon/macos_intel, hai app.tar.gz tương ứng. Không có file ký rời; chữ ký nhúng trong manifest.
- Đã tải thật cả năm files, đối chiếu kích thước, layout, version, URL/architecture; xác minh chữ ký hai gói bằng public key cấu hình. Thay một byte trong mỗi gói bị từ chối. Hai DMG checksum hợp lệ; app Intel Info1.0.3/identifier/icon đúng, executable và Swift engine x86_64, codesign deep/strict đạt, hooks test không có. Intel GUI chưa chạy.
- [Bằng chứng máy đọc được](release_1_0_3_evidence.json) ghi commit, run IDs, SHA-256 assets, giới hạn QA.
- User tải DMG đúng máy từ draft để test, kéo VXClean vào Applications. Chưa publish nên updater latest public chưa cung cấp bản này. Lượt Clean vẫn mở, chỉ đóng khi user xác nhận.
