# Feature Flow Specification: VXClean (`_spec2_feature_flow`)

> **Đối soát hiện hành — 2026-10-10:** [Truth engine và gaps](13_engine_behavior_truth.md) thay thế các mô tả implementation cũ mâu thuẫn bên dưới. [Dictionary toàn Dọn chi tiết](12_cleanup_dictionary.md) và [Quit/reopen](11_detailed_app_cleanup.md) là target **chưa nối engine/UI**. Scan mặc định giữ nguyên. Cleanup khác Uninstall; Movies/CapCut có thể xóa cả root khi chọn trong Uninstall, broad candidate mặc định bỏ chọn. Không coi thiết kế cũ hoặc mock preview là tính năng native đã nghiệm thu.


> **Tên sản phẩm:** VXClean
> **Thư mục dự án:** `cleaner_for_mac`
> **Mã tài liệu:** `_spec2_feature_flow`
> **Phiên bản:** 1.0.0
> **Ngày cập nhật:** 2026-10-07
> **Phạm vi:** Đặc tả chi tiết User Flow, State Machine và Sequence Logic cho toàn bộ các phân hệ chức năng.

---

## 1. Sơ đồ Luồng Trạng thái Toàn cục (Global App State Machine)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        GLOBAL APPLICATION STATE MACHINE                                │
└────────────────────────────────────────────────────────────────────────────────────────┘

                       [ App Launch ]
                             │
                             ▼
                    ┌─────────────────┐
                    │     IDLE        │◄─────────────────────────────┐
                    │ (Dashboard Hot) │                              │
                    └────────┬────────┘                              │
                             │                                       │
            ┌────────────────┼────────────────┐                      │
            ▼                ▼                ▼                      │
     [ Start Scan ]   [ Start Lens ]   [ Start AppScan ]             │
            │                │                │                      │
            ▼                ▼                ▼                      │
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
     │   SCANNING   │ │ LENS_ANALYSIS│ │ UNINSTALL_   │              │
     │  (Progress)  │ │ (Traversing) │ │ SCANNING     │              │
     └──────┬───────┘ └──────┬───────┘ └──────┬───────┘              │
            │                │                │                      │
            ▼                ▼                ▼                      │
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
     │ REVIEW_JUNK  │ │ LENS_BROWSE  │ │ APPS_LIST    │              │
     │ (Selection)  │ │ (Drill-down) │ │ (Inspection) │              │
     └──────┬───────┘ └──────┬───────┘ └──────┬───────┘              │
            │                │                │                      │
            └────────────────┼────────────────┘                      │
                             ▼                                       │
                    [ User Click Action ]                            │
                             │                                       │
                             ▼                                       │
                    ┌─────────────────┐                              │
                    │ CONFIRM_MODAL   │                              │
                    │ (Safety Prompt) │                              │
                    └────────┬────────┘                              │
                             │ (User Approved)                       │
                             ▼                                       │
                    ┌─────────────────┐                              │
                    │    CLEANING     │                              │
                    │  (Progress IO)  │                              │
                    └────────┬────────┘                              │
                             │                                       │
                             ▼                                       │
                    ┌─────────────────┐                              │
                    │ CLEAN_SUMMARY   │                              │
                    │ (Space Freed)   │──────────────────────────────┘
                    └─────────────────┘ (Back to Dashboard / Re-scan)
```

---

## 2. Chi tiết Luồng Phân hệ Smart Scan (Smart Scan Flow)

### 2.1. Bảng Chuyển dịch Trạng thái (Smart Scan State Transition Table)

| Trạng thái Hiện tại | Sự kiện / Trigger | Điều kiện / Ràng buộc | Trạng thái Kế tiếp | Hành vi Hệ thống (Actions) |
| :--- | :--- | :--- | :--- | :--- |
| `IDLE` | `START_SMART_SCAN` | Không có tác vụ quét nào đang chạy | `PRE_CHECK` | Khóa nút Quét, kiểm tra trạng thái FDA và dung lượng đĩa trống. |
| `PRE_CHECK` | `CHECK_COMPLETE` | Đã xác định danh sách module quét | `SCANNING` | Gửi lệnh IPC gọi `vxclean_engine scan --all`. Bắt đầu lắng nghe sự kiện `scan_progress`. |
| `SCANNING` | `SCAN_PROGRESS` | Nhận event tiến trình từ Rust/Engine | `SCANNING` | Cập nhật thanh % tổng thể, hiển thị tên danh mục đang duyệt (vd: `Caches...`). |
| `SCANNING` | `CANCEL_SCAN` | Người dùng nhấn nút "Dừng quét" | `IDLE` | Gửi tín hiệu hủy (`cancel_scan`), thu hồi subprocess an toàn, khôi phục trạng thái ban đầu. |
| `SCANNING` | `SCAN_FINISHED` | Engine trả về JSON danh sách rác | `REVIEW_RESULTS` | Phân loại rác theo nhóm (Caches, Logs, Xcode DerivedData, Trash), tính tổng dung lượng có thể dọn. *(Lưu ý: Xcode Archives mặc định không tick).* |
| `REVIEW_RESULTS`| `TOGGLE_CATEGORY` | Người dùng tick/untick nhóm | `REVIEW_RESULTS` | Cập nhật lại `total_selected_bytes` và danh sách path cần dọn. |
| `REVIEW_RESULTS`| `CONFIRM_CLEAN` | `total_selected_bytes > 0` | `PROMPT_CONFIRM` | Bật Modal xác nhận: liệt kê số lượng tệp và cảnh báo cơ chế xóa (trực tiếp vs Trash). |
| `PROMPT_CONFIRM`| `CANCEL` | Người dùng bấm "Hủy" hoặc nhấn ESC | `REVIEW_RESULTS` | Đóng modal, giữ nguyên danh sách lựa chọn. |
| `PROMPT_CONFIRM`| `PROCEED` | Người dùng bấm "Xác nhận dọn dẹp" | `CLEANING` | Gửi lệnh IPC `vxclean_engine clean` truyền danh sách path qua stdin pipe. Lắng nghe `clean_progress`. |
| `CLEANING` | `NEED_ADMIN` | Có tệp yêu cầu quyền quản trị | `ADMIN_CHALLENGE` | Kích hoạt cửa sổ xác thực hệ thống macOS (Touch ID / Mật khẩu). |
| `CLEANING` | `CLEAN_COMPLETED`| Engine hoàn tất toàn bộ | `SUMMARY_SUCCESS` | Hiển thị màn hình chúc mừng, hiển thị tách bạch `freed_bytes` (xóa vĩnh viễn) và `trashed_bytes` (chuyển vào Thùng rác). |
| `CLEANING` | `PARTIAL_ERROR` | Một số tệp bị khóa (in-use / denied) | `SUMMARY_WARNING` | Hiển thị dung lượng đã thu hồi kèm danh sách lỗi bỏ qua (file đang được ứng dụng khác mở). |

---

## 3. Luồng Gỡ cài đặt Ứng dụng (App Uninstaller Flow)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        APP UNINSTALLER SEQUENCE FLOW                                   │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [ Khởi động Tab Uninstaller ]
         │
         ▼
  [ Quét /Applications & ~/Applications ]
         │
         ├── Đọc Info.plist: App Name, Bundle ID, Version, App Icon, Architectures
         └── Đọc Dung lượng thư mục bundle (.app)
         │
         ▼
  [ Quét tệp phụ thuộc liên quan (Associated Residuals) ]
         │
         ├── ~/Library/Application Support/<BundleID hoặc AppName>
         ├── ~/Library/Caches/<BundleID>
         ├── ~/Library/Preferences/<BundleID>.plist
         ├── ~/Library/Saved Application State/<BundleID>.savedState
         └── ~/Library/Logs/DiagnosticReports/<AppName>*
         │
         ▼
  [ Bộ lọc An toàn Ứng dụng Hệ thống (System Protection Safeguard) ]
         │
         ├── Nếu App thuộc SIP / Apple Core (Safari, Finder, System Settings, Mail):
         │       └── Đánh dấu "Bảo vệ hệ thống" ──► KHÓA KHÔNG CHO PHÉP CHỌN GỠ
         │
         └── Nếu App là VXClean chính nó:
                 └── Đánh dấu "Ứng dụng tự thân" ──► KHÓA KHÔNG ĐƯỢC PHÉP TỰ GỠ
         │
         ▼
  [ Người dùng Chọn Ứng dụng & Xem Phân rã Tệp (Tree Breakdown) ]
         │
         ├── Mặc định: Chọn toàn bộ file .app và các file cấu hình liên quan
         └── Cho phép: Bỏ chọn file cấu hình (nếu muốn giữ lại cài đặt cũ)
         │
         ▼
  [ Xác nhận Gỡ & Thực thi ]
         │
         ├── Thao tác thông thường: Di chuyển vào Thùng rác (trashItem)
         └── Nếu gặp lỗi phân quyền (Permission Denied):
                 ├── Bật Hộp thoại Xác nhận Đặc quyền: Cảnh báo chuyển sang XÓA VĨ VIỄN (rm -rf)
                 ├── Người dùng từ chối ──► Bỏ qua tệp đó, hoàn tất các tệp đã vào Trash
                 └── Người dùng đồng ý ──► Xác thực Touch ID / Mật khẩu ──► Xóa vĩnh viễn
         │
         ▼
  [ Cập nhật danh sách & Thông báo dung lượng: Tách rõ Đã vào Thùng rác vs Đã xóa vĩnh viễn ]
```

---

## 4. Luồng Phân tích Dung lượng Space Lens (Space Lens Flow)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          SPACE LENS INTERACTION FLOW                                   │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [ 1. Chọn Phạm vi Quét (Target Selector) ]
         │
         ├── Tùy chọn 1: Thư mục cá nhân (Home: ~/)
         ├── Tùy chọn 2: Thư mục Tải về (Downloads: ~/Downloads)
         ├── Tùy chọn 3: Toàn bộ ổ đĩa chính (/System/Volumes/Data)
         └── Tùy chọn 4: Tự chọn thư mục bất kỳ (Custom Directory Picker)
         │
         ▼
  [ 2. Quét Đệ quy & Tính toán Phân cấp ]
         │
         ├── Phân bổ dung lượng theo luồng nền (Background Concurrent Queue)
         ├── Bỏ qua các file < 1MB để tối ưu bộ nhớ heap
         └── Xây dựng cấu trúc cây SpaceLensNode (name, path, size, children, is_dir)
         │
         ▼
  [ 3. Trực quan hóa Đa chế độ (Dual-View Representation) ]
         │
         ├── Khung nhìn Trực quan (Bubble Map / Treemap): Các khối kích thước tỉ lệ thuận với dung lượng
         └── Khung nhìn Bảng (Table Tree): Phân cấp thư mục, sắp xếp từ lớn nhất đến nhỏ nhất
         │
         ▼
  [ 4. Đi sâu vào Thư mục Con (Drill-Down Navigation) ]
         │
         ├── Click đúp vào một thư mục lớn ──► Cây thu phóng vào thư mục đó, cập nhật Breadcrumb
         └── Click vào Breadcrumb phía trên ──► Quay lại thư mục cấp cha tức thì
         │
         ▼
  [ 5. Thao tác với Tệp nặng (Triage & Purge) ]
         │
         ├── Xem trước tệp (Quick Look / Spacebar)
         ├── Mở trong Finder (Reveal in Finder)
         └── Xóa an toàn: Di chuyển tệp đã chọn vào Thùng rác (trashItem)
```

---

## 5. Luồng Vòng đời Cửa sổ & Menu Bar (Window & Menu Bar Lifecycle)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                  WINDOW LIFECYCLE & MENU BAR SAMPLING FLOW                             │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [ Khởi chạy App ]
         │
         ├── macOS ActivationPolicy = .regular (Hiển thị Icon trên Dock)
         ├── Khởi tạo Icon khay hệ thống (StatusItem trên Menu Bar)
         └── Mở Cửa sổ chính (Main Dashboard Window)
         │
         ▼
  [ Người dùng bấm Đóng Cửa sổ (Nút X đỏ hoặc Cmd+W) ]
         │
         ├── Rust chặn sự kiện hủy tiến trình (Prevent Default Window Destroy)
         ├── Ẩn Cửa sổ chính: window.hide()
         ├── Điều chỉnh macOS ActivationPolicy: .regular ──► .accessory
         │       └── Icon VXClean biến mất khỏi Dock và thanh Cmd+Tab
         └── App tiếp tục chạy nền nhẹ: Duy trì StatusItem trên Menu Bar
         │
         ▼
  [ Tần suất Lấy mẫu Telemetry (Dynamic Sampling Regulator & Throttle Lock) ]
         │
         ├── Khóa chống gọi chồng chéo (Throttle Lock):
         │       └── Swift CLI 'metrics' cần 2.1s đo delta CPU Mach. Rust/UI áp dụng khóa tối thiểu 2.5s giữa các lần gọi.
         │
         ├── Khi Menu Bar Popover ĐANG ĐÓNG:
         │       └── Tần suất lấy mẫu chậm: 15s - 30s/lần (Không tiêu tốn pin/CPU)
         │
         └── Khi Người dùng CLICK MỞ Menu Bar Popover:
                 ├── Lấy mẫu tức thời (Immediate Refresh)
                 └── Chuyển sang tần suất nhanh: 3s/lần trong lúc popover đang mở
         │
         ▼
  [ Người dùng muốn Mở lại Cửa sổ Chính ]
         │
         ├── Từ Menu Bar Popover: Bấm "Mở VXClean Dashboard"
         ├── Hoặc từ Spotlight / Launchpad: Mở lại VXClean.app
         │
         ├── Điều chỉnh macOS ActivationPolicy: .accessory ──► .regular (Hiện lại trên Dock)
         └── Hiển thị và Focus Cửa sổ chính: window.show(), window.set_focus()
         │
         ▼
  [ Người dùng Thoát Hoàn toàn Ứng dụng (Explicit Quit) ]
         │
         ├── Nếu ĐANG DỌN DẸP (CLEANING State):
         │       └── Bật Modal xác nhận hủy tiến trình dọn dẹp an toàn trước khi đóng.
         │
         └── Thoát thông thường: Qua Cmd+Q hoặc "Thoát hoàn toàn" trong Menu Bar
                 └── Chấm dứt tiến trình, hủy StatusItem, dọn sạch bộ nhớ cache
```
