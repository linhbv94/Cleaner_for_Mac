# VXClean 1.0.0 — Review và release test macOS

Ngày cập nhật: 2026-10-11. User giao review và release test; đầu ra là draft, chưa publish/updater public. Scope ưu tiên Quick Scan theo rule MClean của System Junk; Detailed giữ backlog.

## Review và sửa

- Theo luồng Rust grant/identity/manifest → Swift fresh scan/policy → confirm → journal → mutation. Quick System dùng root-only proof và xóa toàn mục, giữ rule MClean đã được user chốt. Root-only không chứng minh từng nội dung con không đổi; temp có thể chứa dữ liệu duy nhất. Không tuyên bố mọi cache/temp tự sinh lại.
- Sửa lỗi báo skipped khi recursive System Junk removal đã bắt đầu nhưng thất bại: giữ outcome_unknown, không báo byte chưa xác minh là đã giải phóng, không tự replay. Fixture tạo lỗi sau khi thật sự xóa một child, giữ child còn lại, xác minh journal và response.
- Bổ sung native/manager/Rust/frontend regression vào release CI cả hai Mac, không chỉ PR checks. Giữ identifier/public key/updater endpoint; version đồng bộ 1.0.0.
- User đã cho phép lưu khóa local hiện có vào Actions Secrets của repo này; public key đối chiếu khớp. Không đưa private key vào source/docs/assets.

## Kiểm chứng local

- Rust21 pass; native27 nhóm pass gồm actual delete fixture/Trash/recovery/partial unknown, độc lập đối chiếu scanner MClean, và AppKit Quit/Cancel/reopen. Manager9 pass; release6 pass; retention10/uninstall5/circle18 pass. Không dọn dữ liệu thật ở lượt review này.
- Lượt native đầu trong sandbox không launch được app fixture; chạy lại với quyền được duyệt đạt đầy đủ. Lượt release test đầu chạy sai cwd; chạy lại từ repo root đạt6/6, lỗi đã giải quyết.
- Frontend build/type-check đạt; actionlint đạt. Gói local1.0.0 App/DMG/updater build, codesign deep/strict và signature/tamper rejection đạt. Native WKWebView dashboard metrics thật, Aboutversion1.0.0 đạt. Review UI bỏ claim sai “Không tiêu tốn RAM nền”; CI sẽ build lại wording cuối. Remote CI/draft assets còn chờ.

## Giới hạn bản test

OS authentication dialog Cancel, physical tray click, Intel GUI/macOS13, updater install/restart chưa xác minh. AI cold-start/plugin/MCP và Detailed full scope còn backlog. Ad-hoc, chưa notarized; Windows không nằm trong release này. Số byte dọn là ước tính logical, không phải block disk thực thu hồi. Không tự nâng quyền/FDA hoặc dọn data user để chứng minh release.
