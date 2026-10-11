# VXClean 1.0.1 — Release test macOS

Ngày cập nhật: 2026-10-11. Đầu ra draft để user QA, chưa publish. Scope và bằng chứng code/local ở [review1.0.0](release_1_0_0_review.md).

- Draft/tag1.0.0 giữ nguyên, không publish: native integration chạy cargo --offline trước khi Rust dependencies được tải, báo không tìm thấy serde. Không phải lỗi engine dọn hoặc key/signature.
- Sửa release workflow chạy cargo test --locked --lib trước native fixtures, giống thứ tự PR CI đã đạt hai Mac. Không bỏ offline integration hoặc safety tests.
- Bump đồng bộ1.0.1, giữ identifier/public key/endpoint; code app/core chỉ đổi version nhúng. Chưa cam kết GUI Intel/macOS13, OS admin Cancel, physical tray và updater install/restart. Không dọn user data.
- Rust21/native27/manager9/release6/retention10/uninstall5/circle18 đã đạt; PR#1 hai Mac success trên cùng core. actionlint và version/signing config được kiểm tra lại. Exact tag CI và chữ ký draft đang chờ.
