# VXClean — Định hướng Windows và phát hành đa nền tảng

> **Contract chuẩn bị release — 2026-10-10:** [Scope mới](14_quick_detailed_scope.md), [policy backend](15_cleanup_protection_policy.md), [menubar/Dock](16_menubar_release_ui.md) và [API/QA hiện hành](00_system_overview.md) ưu tiên cho target mới. Giữ nội dung dưới làm lịch sử/chi tiết không mâu thuẫn; không áp yêu cầu giữ nguyên Quick cũ hoặc coi policy/tray đã triển khai.


Version: 1.0.0 — Ngày cập nhật: 2026-10-09

Định hướng Codex đề xuất để bàn giao khi user đóng Turn 8; chưa triển khai Windows/pipeline, không phải xác nhận Windows đã hỗ trợ.

## Repo và engine

Giữ một repo, chung React UI, Tauri host và DTO/command contracts. macOS giữ Swift engine đang có. Windows triển khai adapter Rust/Win32 phù hợp OS, dùng chung phần orchestration/cancel/progress/validation có thể tái sử dụng. Không copy đường dẫn hoặc chính sách xóa Mac sang Win.

UI sử dụng capabilities và category descriptors; nhãn hệ thống/đệm theo mục tiêu chung, nội dung quét theo OS. Xcode/SIP/FDA chỉ Mac; nhóm riêng Windows theo scope đã nghiệm thu. Gỡ Windows gọi cơ chế uninstall đăng ký của app (MSI/executable), rồi review residual; không mặc định chuyển Program Files vào Trash như bundle Mac. Scope Registry, UAC, locked files/reparse points cần policy và fixture riêng. Ưu tiên metrics → Lens → scan read-only → cleanup có guard → uninstall; QA thực Windows/WebView2, không suy từ Mac build.

Hiện get_capabilities chỉ bật native engine trên macOS, Windows báo chưa hỗ trợ. Không phát hành Windows chức năng giả lập.

## Version và release

Mặc định một version/tag/commit, một GitHub Release chứa mọi platform đã hỗ trợ: Windows x64, macOS Silicon/Intel theo khả năng QA/build thực tế. Build từng OS/architecture bằng jobs riêng; tổng hợp artifacts, updater signatures và manifest platforms trước publish. Serialize ghi manifest để tránh overwrite entry target khác. Chữ ký updater riêng với chữ ký OS.

latest.json Tauri có platforms riêng như windows-x86_64, darwin-aarch64, darwin-x86_64; app tải đúng artifact tương ứng. Một release không phải một binary dùng chung. Mỗi version mặc định rebuild/test tất cả supported targets; bản chỉ sửa Windows thì Mac có thể giữ hành vi nhưng cùng version mới. Đây là quy trình đơn giản đề xuất, không giới hạn kỹ thuật bắt buộc. Nếu cần hotfix độc lập sau này, vẫn cùng repo nhưng tách platform update endpoints/version/channel rõ ràng; chưa thêm complexity này.

Trước Windows sẵn sàng có thể phát hành Mac-only; Windows bắt đầu tham gia từ release chung khi adapter/QA hoàn tất. VXClean hiện chưa tích hợp updater/release pipeline; không coi build debug/ad-hoc là bộ cài phát hành.

Nguồn: [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases), [Tauri 2 updater](https://v2.tauri.app/plugin/updater/). Bàn giao: [work log](../../../_summary/work_log.md).
