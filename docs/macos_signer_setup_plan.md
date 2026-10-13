# Ký ổn định để giữ identity FDA
Ngày cập nhật: 2026-10-13

## Hiện trạng

Bản1.0.16 public và1.0.17 local đang ký ad_hoc: DR ràng buộc cdhash, đổi binary có thể mất mapping FDA. Updater Ed25519 là cơ chế khác, không giải quyết TCC identity. Máy chưa có code-signing identity hợp lệ.

## Phương án miễn phí đã chuẩn bị để user review

- Certificate tự ký `VXClean Code Signing`, chỉ extendedKeyUsage=codeSigning, CA=false. Public certificate + private key nằm `.release_keys/` bị Git ignore, private key0600; không upload. Không ghi secret vào docs/log.
- Chưa import/trust certificate. Muốn dùng trên máy build, cần thêm identity riêng và tin leaf certificate cho mục đích code signing. Không dùng certificate cho TLS/website, không đổi trust root SSL, không bỏ Gatekeeper/SIP, không sửa TCC database.
- Build dùng cùng certificate/key, giữ bundle ID, mặc định DR có cryptographic certificate binding; verify signature và DR trên hai bản binary khác nhau. Không dùng identifier-only requirement.
- Chuyển từ ad_hoc sang certificate cần user cấp lại FDA một lần cho identity mới. Sau đó phải test update thật để chứng minh retention quyền; OS/MDM vẫn có thể thu hồi.
- Không claim Developer ID/notarized/không cảnh báo Gatekeeper. Self-signed không thay thế Developer ID của Apple.

## Bước thực thi được user cho phép ngày 2026-10-13

1. Import riêng certificate/key và trust leaf cho code signing trên máy build; không dùng/sửa khóa hoặc certificate khác. Backup/export user trust settings trước khi chỉnh.
2. Ký gói local1.0.17, verify app+native helpers và DR certificate-bound; tạo lại updater archive/signature đúng gói.
3. User cấp FDA trong System Settings cho ứng dụng được ký này; probe app phải confirmed, pending scan resume đúng1lần.
4. Build/install bản QA kế tiếp cùng signer, xác nhận FDA tiếp tục hoạt động và không có per-container prompt; không dọn user data.
5. Bàn giao fingerprint/DR/evidence; không public release, không gửi key/secret lên GitHub trong task này.

## Nếu không cho phép thêm trust signing

Luồng FDA vẫn hoạt động cho bản hiện tại; không ghi nhận giữ quyền qua cập nhật. Đường bền vững khác là identity Apple Development/Developer ID hợp lệ do user cung cấp. Chưa tạo tài khoản/mua dịch vụ.

## Trạng thái triển khai local

- User xác nhận “Cho phép ký ổn định và cấp FDA”. Đã export user trust trước/sau; trước 0 entries, sau chỉ thêm 1 certificate với policy `CodeSigning`, không SSL.
- Keychain riêng thực tế tại `~/Library/Keychains/.release_keys/vxclean_codesign.keychain-db`, file0600; giữ login/default keychain, thêm riêng keychain này vào search list. Công cụ ký Apple được truy cập khóa trong keychain riêng; không mở quyền khóa login.
- SHA-1 certificate: `FE024021592C718A39AD70B76D2EDC5DA0CD6B70`. DR bản17: `identifier "com.vxclean.desktop" and certificate leaf = H"fe024021592c718a39ad70b76d2edc5da0cd6b70"`.
- Dùng `VXCLEAN_CODESIGN_IDENTITY` và `node scripts/build_signed_macos.mjs`; script fail nếu thiếu signer, build qua Tauri rồi verify strict và certificate-bound DR. Tránh ký lại sau archive vì signature updater sẽ không khớp app.
- Gói17 đã build lại cùng signer: app và updater tar/signature, strict verify đạt. Không có DMG/public release trong lượt này.
- FDA entry ad_hoc cũ không hoạt động sau đổi signer: gỡ riêng VXClean cũ, thêm đúng `/Applications/VXClean.app`, bật quyền và Quit & Reopen. User tự xác thực OS. Packaged Settings hiện “Đã kiểm chứng quyền đọc dữ liệu được bảo vệ”; Quick scan hoàn tất, không có per-container prompt quan sát được. System Junk vẫn có partial theo giới hạn/quyền riêng của scanner; FDA không đồng nghĩa mọi root đều đọc được.
- Đang kiểm chứng bản local18 cùng signer trước khi kết luận persistence. Probe gọi qua Terminal vẫn restricted và không được dùng thay evidence packaged UI.

## Gỡ thiết lập khi cần

Chỉ gỡ trust certificate VXClean bằng `security remove-trusted-cert` với certificate này; chỉ bỏ keychain VXClean khỏi search list, giữ mọi entry khác. Không import toàn bộ trust backup đè trạng thái mới của máy. Gỡ FDA của VXClean trong System Settings nếu muốn thu hồi. Bảo quản certificate/private key cho các bản sau: mất/đổi signer có thể phải cấp lại FDA. Không upload secret; CI hiện chưa có signer này, release ad_hoc sẽ không giữ identity của gói local.

## Cho phép phát hành ngày 2026-10-13

User cho phép đưa signer local hiện có vào Actions Secrets riêng repo Cleaner_for_Mac. Đã lưu VXCLEAN_MACOS_CERTIFICATE và VXCLEAN_MACOS_CERTIFICATE_PASSWORD; dùng temporary runner keychain, trust chỉ codeSign và cleanup cuối job. Không đổi signer hoặc private key; không ảnh hưởng pipeline các app khác. CI dùng config overlay để giữ certificate-bound identity của local17–18. Cần kiểm chứng hai kiến trúc/gói tải thật trước publish; chưa claim updater FDA E2E.
