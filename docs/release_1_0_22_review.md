# VXClean 1.0.22 — QA độc lập và phát hành

Ngày: 2026-10-14.

## Phạm vi và kết quả

Native Apple Silicon: dừng scan mặc định, quét marker.txt fixture read-only, picker thêm Recent1/5, keyboard/click recent mở lại đúng root và4.1KB. Không Trash dữ liệu user. Bổ sung chặn Recent/picker khi isTrashing; native mutation policy/broker không đổi.

Frontend/bundle bằng signer hiện có, recent/release regression đạt. CI sẽ chạy thêm engine/backend checks.

Đã review đổi tên repo/endpoint/settings và manifest/lock versions. Giữ bundle identifier và khóa updater cũ; Clean giữ certificate signer cũ. Không gom docs/log ngoài scope vào release.

## Giới hạn

GUI kiểm tra trên Apple Silicon. Pure mouse-hover chưa kiểm tra native; focus/keyboard/click Recent đã kiểm tra ở Photos/Clean, Media dựa trên shared component/source và regression. Windows/Intel GUI chưa chạy trong lượt này. Media/Photos chờ build CI Windows+haiMac; Clean chỉ haiMac, không phát hành Windows ở track này.

CI/package/signature/tamper/icon/public sẽ ghi sau khi xác minh.
