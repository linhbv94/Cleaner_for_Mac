# VXClean1.0.12 — Release macOS

Ngày:2026-10-12. User giao release và publish sau QA local; đã đóng lượt QA trước, lượt release đang mở.

- Bao gồm sửa Quick từ local1.0.4–1.0.12: canonical path alias, một admin pass/per-target outcomes/root guard sau auth, skip target đổi proof không chặn sibling, live Chrome/Codex cache với root identity và bảo vệ profile/state, loại wifi.log đang ghi, UX notification/history độc lập và sắp dung lượng giảm dần.
- Journal nén giữ event stream/checksum, unknown và reopen obligations không tự hết hạn; acknowledgement chỉ ẩn notification. Không replay deletion. Giới hạn proof/request fail-closed, không phải cam kết RAM tương ứng.
- Local checks phiên release: frontend build,34Rust,34native,9manager,7release guards, history policy, retention10/uninstall5/circle18 đạt. Native fixtures dùng dữ liệu tổng hợp. Release guards lần đầu chạy từ cwd desktop bị thiếu path; chạy đúng root đạt, không sửa code để bỏ gate.
- Local1.0.12 đã có QA native trong worklog: item System/User sắp giảm dần, checkbox không đổi khi expand. Code engine/history1.0.11 có QA fixture và native GUI; không dọn thêm dữ liệu user trong lượt release này.
- Thêm history regression vào job tag build để checks không chỉ nằm trong main CI. Standard public Mac Silicon/Intel runners, không Actions cache/artifact hoặc paid signing.
- Giới hạn: Intel GUI/macOS cũ, OS Cancel mới và public updater install/restart chưa thử. Detailed vẫn backlog; System Junk giữ root-level policyMClean với xóa vĩnh viễn/temp data risk, không chứng nhận an toàn mọi dữ liệu thật. Mac ad-hoc, chưa notarize; không phát hành Windows.

Remote CI/signature/public endpoint sẽ ghi sau khi hoàn tất.
