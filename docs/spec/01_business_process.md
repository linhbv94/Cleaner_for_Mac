# Business Process Specification: VXClean (`_spec1_business_process`)

> **Tên sản phẩm:** VXClean  
> **Thư mục dự án:** `cleaner_for_mac`  
> **Mã tài liệu:** `_spec1_business_process`  
> **Phiên bản:** 1.0.0  
> **Ngày cập nhật:** 2026-10-07  
> **Phạm vi:** Quy trình nghiệp vụ vĩ mô, Swimlane tương tác đa tầng, và Ma trận quyết định an toàn xóa tệp.

---

## 1. Sơ đồ Luồng Nghiệp vụ Tổng thể (End-to-End Business Flow)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                    QUY TRÌNH NGHIỆP VỤ VĨ MÔ CỦA VXCLEAN (END-TO-END)                  │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [ Khởi động App ]
         │
         ▼
  [ 1. Giám sát & Chẩn đoán Telemetry ] ───(Định kỳ / On-demand)──► [ Cập nhật Menu Bar & Dashboard ]
         │
         ▼
  [ 2. Kích hoạt Quét (Smart Scan / Phân hệ) ]
         │
         ├──► Kiểm tra quyền Full Disk Access (FDA)
         │       ├── Đủ quyền   ──► Quét toàn bộ thư mục cho phép (Allow-list)
         │       └── Thiếu quyền ──► Quét phạm vi User an toàn + Cảnh báo thiếu quyền trên UI
         │
         ▼
  [ 3. Báo cáo Kết quả Quét & Khuyến nghị ]
         │
         ├── Phân tách: Dung lượng Hệ thống (System) vs Dung lượng Rác có thể dọn (Cleanable Junk)
         └── Cho phép người dùng duyệt chi tiết (Inspect) và Bật/Tắt lựa chọn từng mục
         │
         ▼
  [ 4. Phê duyệt & Quyết định Xóa (Execution & Privilege Escalation) ]
         │
         ├── Thao tác thông thường ──► [ Trash ] hoặc [ removeItem ]
         └── Cần quyền Admin      ──► [ Prompt Touch ID / Password ] ──► [ rm -rf an toàn ]
         │
         ▼
  [ 5. Hoàn tất & Ghi nhận Thu hồi Dung lượng ]
         │
         ▼
  [ Cập nhật lại Chỉ số Hệ thống & Đóng cửa sổ về Menu Bar ]
```

---

## 2. Sơ đồ Phối hợp Đa tầng (Swimlane Diagram)

Sơ đồ thể hiện sự phối hợp giữa 5 chủ thể: **Người dùng (User)**, **Giao diện (React WebView)**, **Cầu nối (Rust Core)**, **Engine Bản địa (Swift CLI)** và **Hệ điều hành (macOS TCC/Kernel)**.

```text
┌──────────────┬──────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Người dùng   │ React Frontend   │ Rust Host Core  │ Swift Engine    │ macOS TCC/Kernel│
├──────────────┼──────────────────┼─────────────────┼─────────────────┼─────────────────┤
│              │                  │                 │                 │                 │
│ 1. Mở App    │ ───────────────► │                 │                 │                 │
│              │ Invoke 'metrics' │ ──────────────► │                 │                 │
│              │                  │ Spawn child cli │ ──────────────► │ Đọc Mach VM,    │
│              │                  │                 │                 │ IOKit, statfs   │
│              │                  │                 │ ◄────────────── │ Trả telemetry   │
│              │ ◄─────────────── │ ◄────────────── │                 │                 │
│              │ Render Dashboard │ Parse JSON v1.0 │                 │                 │
│              │                  │                 │                 │                 │
│ 2. Bấm Quét  │ ───────────────► │                 │                 │                 │
│ (Smart Scan) │ Invoke 'scan'    │ ──────────────► │                 │                 │
│              │ Hiện progress    │                 │ Check FDA Path  │ ──────────────► │
│              │                  │                 │                 │ Kiểm tra TCC    │
│              │                  │                 │ Quét Allow-list │ Quét Disk IO    │
│              │ ◄─────────────── │ ◄────────────── │                 │                 │
│              │ Hiển thị kết quả │ Trả danh sách   │                 │                 │
│              │                  │                 │                 │                 │
│ 3. Chọn mục  │                  │                 │                 │                 │
│ & Bấm Dọn    │ ───────────────► │                 │                 │                 │
│              │ Invoke 'clean'   │ ──────────────► │                 │                 │
│              │                  │                 │ Phân loại xóa:  │                 │
│              │                  │                 │ - Trash         │ ──► Finder Trash│
│              │                  │                 │ - removeItem    │ ──► FS unlink   │
│              │                  │                 │ - Admin osascript                 │
│              │                  │                 │        │        │                 │
│ [Xác thực]   │ ◄────────────────┼─────────────────┼────────┘        │ Yêu cầu Touch ID│
│ Nhập Touch ID│ ─────────────────┼─────────────────┼────────────────►│ hoặc Mật khẩu   │
│              │                  │                 │                 │ Thực thi lệnh   │
│              │ ◄─────────────── │ ◄────────────── │ ◄────────────── │ Báo hoàn tất    │
│              │ Báo thành công   │                 │                 │                 │
│              │                  │                 │                 │                 │
│ 4. Bấm Đóng  │                  │                 │                 │                 │
│ Cửa sổ (X)   │ Window close     │ ──────────────► │                 │                 │
│              │                  │ Hide window     │                 │                 │
│              │                  │ ActivationPolicy│ ──────────────► │ Chuyển sang     │
│              │                  │ = .accessory    │                 │ Menu Bar Only   │
│              │                  │                 │                 │ (Ẩn khỏi Dock)  │
└──────────────┴──────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

## 3. Ma trận Quyết định Chiến lược Xóa Tệp (Deletion Strategy Decision Matrix)

Tuân thủ nghiêm ngặt các kết quả đối soát tại [safety_audit.md](../../docs/safety_audit.md), bảng dưới đây quy định phương thức xử lý bắt buộc cho từng loại dữ liệu:

| Phân hệ / Loại tệp | Đường dẫn / Tiêu chí nhận diện | Phương thức thực thi | Cơ chế an toàn | Khả năng khôi phục (Recovery) |
| :--- | :--- | :--- | :--- | :--- |
| **User Caches & Logs** | `~/Library/Caches/*`, `~/Library/Logs/*` | `fileManager.removeItem` | Allow-list, kiểm tra symlink, chặn xóa folder cha | **Không** (Xóa trực tiếp, tái tạo tự động bởi app) |
| **Xcode DerivedData** | `~/Library/Developer/Xcode/DerivedData/*` | `fileManager.removeItem` | Allow-list, chỉ xóa thư mục con bên trong | **Không** (Xóa trực tiếp, tự sinh lại khi build) |
| **App Uninstaller (Thường)** | File app `.app` và thư mục `~/Library/Application Support/<app>` | `fileManager.trashItem` | Bundle ID matching, chặn app hệ điều hành (`/System`, `/Applications/Safari.app`) | **Có** (Nằm trong Thùng rác, khôi phục bằng Put Back) |
| **App Uninstaller (Đặc quyền)**| File app hoặc tệp liên quan thuộc `/Library` sở hữu bởi root | AppleScript `rm -rf` với quyền admin | Xác thực người dùng qua Touch ID/Mật khẩu | **Không** (Xóa trực tiếp bằng quyền quản trị) |
| **Orphan Files (Tệp mồ côi)** | Thư mục rác của app đã gỡ khỏi hệ thống | `removeItem` hoặc admin `rm -rf` | Bộ lọc an toàn `OrphanSafetyPolicy.isSafeCandidate` | **Không** (Xóa vĩnh viễn tệp rác còn sót lại) |
| **Space Lens (Dọn dung lượng)**| Tệp/thư mục dung lượng lớn do người dùng trực tiếp chọn | `fileManager.trashItem` | Người dùng chọn thủ công, cảnh báo dung lượng lớn | **Có** (Di chuyển an toàn vào Thùng rác) |
| **Thùng rác hệ thống (Trash)** | `~/.Trash/*` | `fileManager.removeItem` | Chỉ xóa tệp bên trong thư mục Trash | **Không** (Làm rỗng thùng rác) |

---

## 4. Ma trận Xử lý Trạng thái Quyền Full Disk Access (FDA Decision Matrix)

| Trạng thái FDA | Khả năng phát hiện | Hành vi của Hệ thống | Trải nghiệm Người dùng trên UI |
| :--- | :--- | :--- | :--- |
| **Đã cấp quyền (Granted)** | Đọc thành công `~/Library/Safari/Bookmarks.plist` | Mở khóa toàn bộ khả năng quét sâu: Mail downloads, Safari cache, Messages cache, System logs | Huy hiệu trạng thái "Quyền tối đa: Hoạt động" (Màu xanh Emerald), cho phép quét sâu toàn diện. |
| **Chưa cấp quyền (Denied / Missing)** | Bị lỗi phân quyền (EACCES / Operation not permitted) | Vẫn cho phép dọn dẹp các thư mục người dùng mở: Xcode DerivedData, Developer caches, Trash, App Uninstaller thông thường | Hiển thị Banner cảnh báo màu Amber: "Chưa cấp quyền Full Disk Access. Một số mục quét sâu bị bỏ qua". Cung cấp nút mở cài đặt hệ thống 1-click. |
| **Lỗi xác thực / Bị khóa** | Lỗi trả về mã phân quyền không xác định | Giới hạn chỉ quét các thư mục thuộc sandbox cơ bản | Hiển thị hướng dẫn reset quyền hoặc cấp lại quyền qua hướng dẫn trực quan. |
