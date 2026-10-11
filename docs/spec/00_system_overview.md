# VXClean — Tổng quan contract chuẩn bị release

> **Cập nhật implementation local 2026-10-10:** xem [truth sau triển khai](17_local_implementation_status.md) và [báo cáo build/QA](../local_completion_report.md). Nội dung target dưới đây không đồng nghĩa mọi gate đã pass; các nhánh thiếu evidence đang blocked.


Version: 2.0.0 — Ngày cập nhật: 2026-10-10. Target implementation macOS, chưa nghiệm thu release. Bản spec trước được lưu nguyên trạng tại `../spec_history/pre_release_2026_10_10/` để đối chiếu lịch sử; không dùng làm contract hiện hành.

## Thứ tự đọc

1. [Scope Quick/Detail](14_quick_detailed_scope.md).
2. [Policy mutation](15_cleanup_protection_policy.md) và [contract JSON](../cleanup_protection_contract.json).
3. [Menubar/Dock/head bar](16_menubar_release_ui.md).
4. [Flow app Quit/reopen](11_detailed_app_cleanup.md), [dictionary](12_cleanup_dictionary.md), [uninstall/discovery](10_uninstall_discovery_cache_safety.md).
5. [API](04_api_data.md), [QA](05_qa_acceptance.md), [handoff thực thi](../release_preparation_handoff.md).
6. [Baseline source/gaps](13_engine_behavior_truth.md) và [audit/evidence](../engine_scope_audit_2026_10_10.md). Source baseline không tự là yêu cầu giữ nguyên lỗi.

## Kiến trúc và scope

React + TypeScript + Tailwind → Tauri Rust host → Swift native engine trên macOS. Scanner kế thừa MClean có sửa; mutation desktop dùng MaintenanceCLI, không CleaningEngine gốc. Browser preview dùng mock rõ nhãn; native lỗi không fallback mock. Metrics dùng protocol 1.0; maintenance target typed/versioned 2.0.

Quick chỉ scan System Junk/User Cache/Large & Old; không chạy scanner/CLI chuyên biệt, kể cả revalidation. Chỉ rule đã validation được cấp quyền dọn; Large Files default false/Trash. User chấp nhận cache build tái tạo với hậu quả build/tải lại; giữ runtime/project/updater/state.

Detail có nhóm chuyên biệt, dictionary hậu quả mọi dòng, dọn từng nhóm hoặc các lựa chọn xuyên nhóm. Chọn tất cả không xóa protected/unsupported hoặc vượt scope. App lifecycle và restore phải nghiệm thu, không suy launch thành công thành phục hồi project/tab.

Uninstall, Orphans và Lens có ticket/operation riêng. Movies/CapCut chỉ có thể chọn cả root trong Uninstall với cảnh báo mất project. OS critical/self/runtime và dữ liệu protected bị chặn tại backend ở mọi entry point liên quan. Admin fallback chỉ known uninstall residual có explicit confirmation.

## Trải nghiệm và mức chứng minh

Theme chung bộ VX; giữ dashboard/scan/uninstall/Lens hiện có và retention 5 phút, phân biệt grant max 15 phút. Head bar production bỏ Bản thử; preview vẫn ghi mock/browser. Menubar dùng SVG của user, panel metrics và main close → background/ẩn Dock; Quit → dừng hoạt động và owned children có recovery state.

macOS ưu tiên, CLT build Swift đủ cho đường Tauri hiện tại; minimum 13 là cấu hình target, không là matrix đã QA đầy đủ. Windows chưa có maintenance adapter; UI reuse không chứng minh engine Win. Không bật capability cho feature chưa native-supported/initialized.

Lượt này chuẩn bị code/spec/build/QA cho release, không tự commit/push/tag/publish, sửa signing key/billing hay dọn user data thật. Không gọi debug build hoặc bỏ badge là release-ready. Gate bắt buộc: policy negative tests, host/native parity, current packaged artifact, native lifecycle/data fixtures và báo giới hạn theo platform.
