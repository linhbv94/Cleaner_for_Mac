# Feature Flow Specification: VXClean (`_spec2_feature_flow`)

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
| `PRE_CHECK` | `CHECK_COMPLETE` | Đã xác định danh sách module quét | `SCANNING` | Gửi lệnh IPC gọi `vxclean_engine scan --all`. Bắt đầu lắng nghe tiến trình. |
| `SCANNING` | `SCAN_PROGRESS` | Nhận gói tin tiến trình từ Engine | `SCANNING` | Cập nhật thanh % tổng thể, hiển thị tên danh mục đang duyệt (vd: `Caches...`). |
| `SCANNING` | `SCAN_FINISHED` | Engine trả về JSON danh sách rác | `REVIEW_RESULTS` | Phân loại rác theo nhóm (Caches, Logs, Xcode, Trash), tính tổng dung lượng có thể dọn. |
| `REVIEW_RESULTS`| `TOGGLE_CATEGORY` | Người dùng tick/untick nhóm | `REVIEW_RESULTS` | Cập nhật lại `total_selected_bytes` và mảng ID cần dọn. |
| `REVIEW_RESULTS`| `CONFIRM_CLEAN` | `total_selected_bytes > 0` | `PROMPT_CONFIRM` | Bật Modal xác nhận: liệt kê số lượng tệp và cảnh báo cơ chế xóa (trực tiếp vs Trash). |
| `PROMPT_CONFIRM`| `CANCEL` | Người dùng bấm "Hủy" hoặc nhấn ESC | `REVIEW_RESULTS` | Đóng modal, giữ nguyên danh sách lựa chọn. |
| `PROMPT_CONFIRM`| `PROCEED` | Người dùng bấm "Xác nhận dọn dẹp" | `CLEANING` | Gửi lệnh IPC `vxclean_engine clean --items <json_payload>`. |
| `CLEANING` | `NEED_ADMIN` | Có tệp yêu cầu quyền quản trị | `ADMIN_CHALLENGE` | Kích hoạt cửa sổ xác thực hệ thống macOS (Touch ID / Mật khẩu). |
| `CLEANING` | `CLEAN_COMPLETED`| Engine hoàn tất toàn bộ | `SUMMARY_SUCCESS` | Hiển thị màn hình chúc mừng, hiển thị số GB đã thu hồi thành công. |
| `CLEANING` | `PARTIAL_ERROR` | Một số tệp bị khóa (in-use / denied) | `SUMMARY_WARNING` | Hiển thị số GB đã thu hồi kèm danh sách lỗi bỏ qua (file đang được ứng dụng khác mở). |

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
         └── Nếu gặp lỗi phân quyền: Kích hoạt fallback quyền Admin (rm -rf tệp đã chọn)
         │
         ▼
  [ Cập nhật danh sách & Thông báo dung lượng thu hồi ]
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
  [ Tần suất Lấy mẫu Telemetry (Dynamic Sampling Regulator) ]
         │
         ├── Khi Menu Bar Popover ĐANG ĐÓNG:
         │       └── Tần suất lấy mẫu chậm: 15s - 30s/lần (Không tiêu tốn pin/CPU)
         │
         └── Khi Người dùng CLICK MỞ Menu Bar Popover:
                 ├── Lấy mẫu tức thời (Immediate Refresh)
                 └── Chuyển sang tần suất nhanh: 2s/lần trong lúc popover đang mở
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
         ├── Qua phím tắt: Cmd+Q
         └── Hoặc qua nút: "Thoát hoàn toàn" (Quit) trong Menu Bar Popover
                 └── Chấm dứt tiến trình, hủy StatusItem, dọn sạch bộ nhớ cache
```
