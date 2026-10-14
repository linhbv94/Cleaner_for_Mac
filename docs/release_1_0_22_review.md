# VXClean 1.0.22 — QA độc lập và phát hành

Ngày: 2026-10-14.

## Phạm vi và kết quả

Native Apple Silicon: dừng scan mặc định, quét marker.txt fixture read-only, picker thêm Recent1/5, keyboard/click recent mở lại đúng root và4.1KB. Không Trash dữ liệu user. Bổ sung chặn Recent/picker khi isTrashing; native mutation policy/broker không đổi.

Frontend/bundle bằng signer hiện có, recent/release regression đạt. CI sẽ chạy thêm engine/backend checks.

Đã review đổi tên repo/endpoint/settings và manifest/lock versions. Giữ bundle identifier và khóa updater cũ; Clean giữ certificate signer cũ. Không gom docs/log ngoài scope vào release.

## Giới hạn

GUI kiểm tra trên Apple Silicon. Pure mouse-hover chưa kiểm tra native; focus/keyboard/click Recent đã kiểm tra ở Photos/Clean, Media dựa trên shared component/source và regression. Windows/Intel GUI chưa chạy trong lượt này. Media/Photos chờ build CI Windows+haiMac; Clean chỉ haiMac, không phát hành Windows ở track này.

CI/package/signature/tamper/icon/public sẽ ghi sau khi xác minh.

## Kết quả public và updaterE2E

[Release1.0.22](https://github.com/linhbv94/VXClean/releases/tag/v1.0.22) stable/latest, SHA35e43c543799767b1972f5892cfc3b32e91fdad8. Build38589205520 và publish38594755641 success. Năm assets, hai package signatures/tamper đạt; haiMac metadata/architecture/codesign/icon/DMG khớp updater đạt. App cha giữ certificate FE024021592C718A39AD70B76D2EDC5DA0CD6B70.

Kiểm tra phụ ban đầu giả định helper có cùng certificate app cha; baseline21 và bản22 cho thấy Silicon helper ad-hoc, Intel helper unsigned. Policy không đổi, helper nằm trong sealed resources của app cha. Sửa helper trong bản sao làm codesign của app bị từ chối trên cả hai kiến trúc. Không coi helper là identityFDA độc lập.

Native updater Apple Silicon: /Applications bản21 và quyền đọc bảo vệ confirmed → nhận22 qua endpoint Cleaner_for_Mac cũ → tải/cài → bấm restart, PID23716→25379 (xác nhận trước khi getApp, không tự mở để che restart lỗi) → About22. Bấm kiểm tra lại quyền sau restart vẫn “Đã kiểm chứng quyền đọc dữ liệu được bảo vệ”; không mở/cấp FDA lại, không dọn dữ liệu user. Installed app/engine/icon/Info.plist byte-match với gói CI Silicon, strict codesign/certificate đạt.

Endpoint mới/cũ trả22, năm assets public200 không token. Intel chưa GUI/FDA updaterE2E. [Evidence](release_1_0_22_evidence.json).
