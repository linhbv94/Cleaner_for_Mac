# Luồng Full Disk Access — VXClean
Ngày cập nhật: 2026-10-13

## Mục tiêu và ranh giới

- Một luồng quyền dùng chung trước Quick, Detailed, inventory gỡ app/orphan và scan Space Lens. Navigation từ snapshot không xin quyền lại; dashboard metrics không yêu cầu FDA.
- Không thay rule, mặc định tick, grant/snapshot, revalidation, admin pass, Trash, journal, lifecycle hoặc retention. FDA không cấp quyền xóa và không thay SIP/quyền ghi/admin.
- Không dùng private TCC API, đọc nội dung/chỉnh TCC database, sudo để tự cấp FDA, reset quyền hệ thống, hoặc chữ ký yêu cầu chỉ bundle identifier.

## Native status

- Adapter Rust, macOS: thử mở read-only một protected probe cố định `~/Library/Application Support/com.apple.TCC/TCC.db`, đóng ngay, không đọc byte/query DB. `access_confirmed` chỉ là kiểm chứng truy cập hiện tại; không khẳng định một boolean TCC chính thức hay mọi path đều đọc/ghi được.
- EPERM/EACCES → `restricted`; file không tồn tại/lỗi khác/timeout → `unverified`. Windows/browser → `not_required`. Lỗi kiểm tra không tự coi là đã cấp.
- Probe ở worker cùng app để nhận quyền của app, không dựa vào quyền Terminal/Codex. Timeout hữu hạn. Trả path bundle hiện tại và thông tin chữ ký ad_hoc/stable_certificate/unknown; không lưu password hoặc fake granted trong localStorage.

## Flow UI

1. Trước scan, check status. Confirmed/not_required → chạy đúng luồng cũ. Restricted/unverified → một dialog chung; nhiều yêu cầu đồng thời gom một dialog.
2. Giải thích vì sao cần quyền, nút mở đúng trang FDA; hướng dẫn nhấn +, chọn app đang chạy, bật toggle; có nút hiện app trong Finder. Không tự click cấp quyền.
3. Khi quay về app và khi bấm Kiểm tra lại, probe lại. Chỉ khi confirmed mới resume scan đang chờ đúng một lần. Để sau/ESC hủy scan chờ, không bắt đầu worker đọc app containers.
4. Settings/Hệ thống có panel trạng thái + hướng dẫn tương tự; không có toggle FDA giả. Lỗi đọc/timeout không đều gán cho FDA.
5. Scan nội bộ khi app đã đóng để dọn không mở dialog chờ vô hạn; thiếu quyền báo lỗi để finally/lifecycle cũ phục hồi app. Cancellation/stale-generation không khởi chạy scan sau khi user đã hủy.

## Chữ ký và update

- FDA ghi nhận identity/DR; ad_hoc cdhash đổi theo binary không chứng minh quyền giữ qua update. UI nêu nếu bản hiện tại có nguy cơ cần cấp lại sau cập nhật.
- Signer ổn định phải ràng buộc certificate/cryptographic identity. Không nới DR thành identifier-only để giữ quyền. Chuẩn bị cấu hình build dùng cùng certificate; không gửi private key lên GitHub hoặc phát hành trong task này.
- Nếu chưa có identity hợp lệ, kiểm chứng phương án self-signed bằng fixture biệt lập, không đổi trust root/login/default keychain của user. Không cam kết Gatekeeper/notarization hoặc FDA thực tế qua hai bản chỉ từ signature fixture.

## QA / DoD

- Broker: confirmed, restricted, unknown, lỗi/timeout, nhiều scan đồng thời, Để sau, canceled-before/after-probe, revoke/recheck; không gọi scan khi chưa confirmed; internal rescan không chờ modal.
- Native: readonly probe đóng handle/không sửa file, errno classification, bundle/signature parser, Windows not-required. Không dựa vào caller Terminal để chứng minh FDA của packaged app.
- Hồi quy toàn bộ Rust/native fixtures, manager, Quick selection/retention/history, Lens full-tree/cache, uninstaller, frontend build và chữ ký package/updater.
- Packaged native UI: modal trước scan; Cancel không tạo scan worker; Settings panel, mở FDA/Finder không tự cấp quyền; kiểm chứng focus/recheck. Grant thật và persistence qua update chỉ ghi pass nếu user cấp trong System Settings và thực sự test.
- Specs + evidence/report + root work log bàn giao; không commit/push/release/đóng turn tự động.

## Bằng chứng local ngày 2026-10-13

- 48 Rust,35 nhóm native,9 manager fixtures đạt; broker11 nhóm+typed deferral đạt; regression Lens cache/retention/history/selection/circle packing và frontend build đạt. Windows module cross-check đạt, chưa Windows app runtime.
- Gói17 certificate-bound và codesign strict/deep đạt; FDA identity ad_hoc cũ phải gỡ/thêm lại một lần. User đã xác thực; Settings từ worker packaged app confirmed; Quick scan2.41GB kết quả, không quan sát prompt từng app. System Junk partial vẫn báo thật, không coi FDA là bảo đảm mọi root/quyền admin.
- Build ký ổn định bằng script riêng `scripts/build_signed_macos.mjs`; config CI mặc định còn ad_hoc, chưa được claim giữ FDA cho public update. Bản local18 đang kiểm chứng retention qua binary/version mới; không dọn data user.

## Nghiệm thu public update — 2026-10-13

Public1.0.21 dùng cùng certificate-bound signer với local18. Hai native Mac build/package strict checks đạt; trên Apple Silicon updater18→21 download/install/restart đạt, About21 và Settings access_confirmed; không cấp lại FDA. Quick read-only scan sau update hoàn tất, partial báo thật. Intel GUI/FDA updateE2E chưa test. [Review và giới hạn](../qa_1_0_18_review.md).
