# VXClean1.0.12 — Release macOS

Ngày:2026-10-12. User giao release và publish sau QA local; đã đóng lượt QA trước, lượt release đang mở.

- Bao gồm sửa Quick từ local1.0.4–1.0.12: canonical path alias, một admin pass/per-target outcomes/root guard sau auth, skip target đổi proof không chặn sibling, live Chrome/Codex cache với root identity và bảo vệ profile/state, loại wifi.log đang ghi, UX notification/history độc lập và sắp dung lượng giảm dần.
- Journal nén giữ event stream/checksum, unknown và reopen obligations không tự hết hạn; acknowledgement chỉ ẩn notification. Không replay deletion. Giới hạn proof/request fail-closed, không phải cam kết RAM tương ứng.
- Local checks phiên release: frontend build,34Rust,34native,9manager,7release guards, history policy, retention10/uninstall5/circle18 đạt. Native fixtures dùng dữ liệu tổng hợp. Release guards lần đầu chạy từ cwd desktop bị thiếu path; chạy đúng root đạt, không sửa code để bỏ gate.
- Local1.0.12 đã có QA native trong worklog: item System/User sắp giảm dần, checkbox không đổi khi expand. Code engine/history1.0.11 có QA fixture và native GUI; không dọn thêm dữ liệu user trong lượt release này.
- Thêm history regression vào job tag build để checks không chỉ nằm trong main CI. Standard public Mac Silicon/Intel runners, không Actions cache/artifact hoặc paid signing.
- Giới hạn: Intel GUI/macOS cũ, OS Cancel mới và public updater install/restart chưa thử. Detailed vẫn backlog; System Junk giữ root-level policyMClean với xóa vĩnh viễn/temp data risk, không chứng nhận an toàn mọi dữ liệu thật. Mac ad-hoc, chưa notarize; không phát hành Windows.

## Kết quả phát hành

- [VXClean1.0.12](https://github.com/linhbv94/Cleaner_for_Mac/releases/tag/v1.0.12) đã publish stable/latest ngày2026-10-12, releaseID410152307; tag commit `2fa7137968fbc710fae6f9b9df5a44c6b801fa3b`.
- [PR#2](https://github.com/linhbv94/Cleaner_for_Mac/pull/2) đã merge sau [CI38202075354](https://github.com/linhbv94/Cleaner_for_Mac/actions/runs/38202075354) Silicon/Intel success. Main38202880905 cũng đạt.
- [Release38202890580](https://github.com/linhbv94/Cleaner_for_Mac/actions/runs/38202890580) đạt cả hai build/validate; [publish38205129281](https://github.com/linhbv94/Cleaner_for_Mac/actions/runs/38205129281) success đúng tag commit.
- Tải thật năm assets: kích thước/GitHub SHA-256 digest/architecture/version/identifier/icon/codesign deep/strict/DMG checksums đạt. Hai updater packages xác minh chữ ký thật và sửa một byte bị từ chối. Production Swift engines không chứa hooks VXCLEAN_TEST_.
- Public stable/latest manifest1.0.12 và năm assets HTTP200 không dùng token; platform URLs khớp manifest đã xác minh. [Evidence](release_1_0_12_evidence.json).
- Local app1.0.12 đang cài khớp byte host/engine/icon của gói local đã QA. Không thay app user hoặc dọn dữ liệu thật trong lượt release. Không nhận đã thử public updater download/install/restart; nếu đang dùng local1.0.12 thì version đã bằng latest.
- Lượt QA trước đã đóng theo xác nhận user; lượt release chưa đóng cho tới khi user xác nhận.
