# VXClean1.0.3 — Release test macOS

Ngày cập nhật:2026-10-11. Draft cho QA, không publish.

- Kế thừa [review1.0.2](release_1_0_2_review.md). Intel main CI1.0.1 và1.0.2 timeout30giây ở7000file/14000event fsync. Không gọi đó là đã đạt.
- Chỉ riêng fixture bulk cho phép180giây, in thời gian thực; subprocess khác vẫn30giây. Giữ7000file,14002events, thứ tự intent/outcome, profile bảo toàn, completed và mọi mutation safety assertions. Không đổi code app/native/Rust, không bỏ fsync hay replay guard. Giới hạn30giây trên mọi runner chưa được chứng minh.
- Version1.0.3, tag cũ bất biến. Remote CI/artifact verification còn chờ. OS admin Cancel, tray click, Intel GUI/macOS13, updater install/restart và Detailed vẫn cần QA.
