# VXClean 1.0.2 — Release test macOS

Ngày cập nhật: 2026-10-11. Draft để user QA, chưa publish. Review code và local proof ở [review1.0.0](release_1_0_0_review.md); dependency-order fix ở [review1.0.1](release_1_0_1_review.md).

- 1.0.0/1.0.1 giữ tag/draft bất biến, không publish. 1.0.1 đã pass toàn bộ safety/manager/release tests, lỗi packaging vì tauriScript dư separator: Action tự chèn -- cho npm, làm --bundles chuyển nhầm sang Cargo.
- Sửa script thành npm run tauri theo [Tauri Action official](https://github.com/tauri-apps/tauri-action). Đọc source Runner v1 xác nhận separator được thêm tự động; actual npm wrapper/parser local nhận đúng --bundles. Bổ sung regression gọi CLI thật qua cấu hình workflow, không chỉ kiểm tra chuỗi.
- Đồng bộ version1.0.2; identifier/public key/endpoint và app/core giữ nguyên. Chỉ sửa wrapper/pipeline/test harness/version/note. Repo public + standard runners, không cache/artifacts/paid signing. Keys chỉ trong Secrets đã được user cho phép.
- Giới hạn vẫn là OS admin Cancel, physical tray click, Intel GUI/macOS13, updater install/restart và backlog Detailed. Không dọn user data. Remote build/validate/crypto draft còn chờ.
