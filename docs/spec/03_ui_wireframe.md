# UI & Wireframe Specification: VXClean (`_spec3_ui_wireframe`)

> **Tên sản phẩm:** VXClean  
> **Thư mục dự án:** `cleaner_for_mac`  
> **Mã tài liệu:** `_spec3_ui_wireframe`  
> **Phiên bản:** 1.0.0  
> **Ngày cập nhật:** 2026-10-07  
> **Hệ quy chiếu Thiết kế:** Tuân thủ 100% [master_theme.md](../../master_theme.md) của hệ sinh thái zTools (Dark Navy/Slate, Electric Cyan Accent, Glassmorphism, Desktop Compact Density).

---

## 1. Khung Cấu trúc Tổng thể Cửa sổ (Main Window Shell)

Kích thước mặc định: `960px × 640px` (Tối thiểu: `860px × 540px`). Cửa sổ hỗ trợ kéo thả tự do qua thanh tiêu đề không viền (Frameless Window Drag Region).

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [●][●][●]  VXClean — Tiện ích Giám sát & Dọn dẹp macOS         [FDA: Active] [⚙] [✕] │ ◄── Window Titlebar (h-10)
├───────────────┬────────────────────────────────────────────────────────────────────────┤
│ ❖ TỔNG QUAN   │                                                                        │
│  [■] Dashboard│                                                                        │
│               │                                                                        │
│ ⚡ DỌN DẸP     │                                                                        │
│  [◐] SmartScan│                                                                        │
│  [🧹] Dọn Rác  │                       MAIN CONTENT WORKSPACE                           │
│  [✕] Gỡ App   │                       (Vùng hiển thị nội dung chính)                   │
│  [☣] Tệp MồCôi│                                                                        │
│               │                                                                        │
│ 🌐 BỘ NHỚ     │                                                                        │
│  [◉] SpaceLens│                                                                        │
│               │                                                                        │
│ ⚙ HỆ THỐNG    │                                                                        │
│  [🛠] Cài đặt  │                                                                        │
├───────────────┴────────────────────────────────────────────────────────────────────────┤
│ v1.0.4 • Apple Silicon (M2 Max) • macOS 15.1 Sequoia               Thu hồi: 0 B        │ ◄── Status Bar (h-7)
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Thông số Thiết kế Shell (Tokens):
- **Window Base Background:** `bg-[#0f1117]` (Slate/Navy sâu).
- **Sidebar Background:** `bg-[#141821]/85 backdrop-blur-md border-r border-white/5` (Độ rộng cố định: `w-56`).
- **Sidebar Item (Default):** `text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg text-xs py-2 px-3`.
- **Sidebar Item (Active):** `text-cyan-400 bg-cyan-500/15 border-l-2 border-cyan-400 font-medium`.
- **Traffic Light Controls:** Chuẩn macOS native positioning (`top-3 left-4`).

---

## 2. Màn hình 1: Dashboard (System Telemetry & Health)

Màn hình hiển thị 4 khối chỉ số phần cứng thời gian thực và thẻ gợi ý hành động Smart Scan.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ DASHBOARD HỆ THỐNG                                    [⟳ Làm mới (2s)] [Quét ngay]     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────────────────┐ │
│ │ CPU (Apple Silicon)  │ │ BỘ NHỚ RAM           │ │ DUNG LƯỢNG Ổ ĐĨA (Macintosh HD)  │ │
│ │   14.2%              │ │   24.8 GB / 32 GB    │ │   342.5 GB Khả dụng / 994.7 GB   │ │
│ │ ┌──────────────────┐ │ │ ┌──────────────────┐ │ │ ┌──────────────────────────────┐ │ │
│ │ │ ▄▅▂ ▂▃▅▆▇        │ │ │ ▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░ │ │ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒░░░░░░░ │ │ │
│ │ └──────────────────┘ │ │ └──────────────────┘ │ │ └──────────────────────────────┘ │ │
│ │ User: 9.8%  Sys: 4.4%│ │ Active: 14.1G Wired:6.2G│ Used: 652.2G • Purgeable: 18.4G │ │
│ └──────────────────────┘ └──────────────────────┘ └──────────────────────────────────┘ │
│                                                                                        │
│ ┌──────────────────────────────────────────────┐ ┌───────────────────────────────────┐ │
│ │ NGUỒN ĐIỆN & PIN                             │ │ KHUYẾN NGHỊ THU HỒI DUNG LƯỢNG    │ │
│ │   86% • Đang sạc (AC Attached)               │ │   Ước tính có thể dọn: ~14.8 GB   │ │
│ │ Tình trạng: Bình thường (Health 98%)         │ │                                   │ │
│ │ Chu kỳ sạc: 42 • Công suất: 96W USB-C        │ │ [ Bắt đầu Smart Scan toàn diện ]  │ │
│ │ *(Trên Mac để bàn: Hiển thị nguồn điện AC)*   │ │                                   │ │
│ └──────────────────────────────────────────────┘ └───────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Chi tiết Khối Pin (Xử lý trường hợp không có pin - Desktop Mac):
- Khi telemetry trả về `battery.has_battery = false` (Mac Studio, Mac Pro, Mac mini, iMac):
  - Khối nguồn điện tự động chuyển sang hiển thị: `Nguồn điện AC trực tiếp • Thiết bị để bàn`.
  - Ẩn thanh phần trăm pin và số chu kỳ sạc, không hiển thị giá trị ảo `0%`.

---

## 3. Màn hình 2: Smart Scan (3 Trạng thái Chi tiết)

### 3.1. Trạng thái 1: Sẵn sàng (Idle State)
Ở trạng thái này, giao diện tập trung vào một nút tròn lớn ở trung tâm để kích hoạt quét nhanh:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│                                      ╭─────────╮                                       │
│                                    │     ⚡    │                                       │
│                                    │   QUÉT    │  ◄── Nút tròn phát sáng Cyan Glow     │
│                                    │   NHANH   │      (hover:scale-105 active:scale-95)│
│                                      ╰─────────╯                                       │
│                                                                                        │
│                         Sẵn sàng kiểm tra toàn diện hệ thống                           │
│     Quét an toàn: Bộ nhớ đệm • Nhật ký ứng dụng • Dữ liệu build Xcode • Thùng rác      │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2. Trạng thái 2: Đang quét (Scanning Progress State)
Hiển thị tiến trình dạng vòng tròn kèm danh mục đang xử lý thời gian thực:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│                                      ╭─── 68% ─╮                                       │
│                                    │  Đang quét│                                       │
│                                    │  12.4 GB  │                                       │
│                                      ╰─────────╯                                       │
│                                                                                        │
│                          Đang kiểm tra: Xcode DerivedData...                           │
│               [■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■░░░░░░░░░░░░░░░░]                │
│                                                                                        │
│  [✓] Bộ nhớ đệm hệ thống (3.2 GB)             [✓] Nhật ký & Báo cáo lỗi (412 MB)       │
│  [●] Tệp phát triển Xcode (8.8 GB)...         [○] Thùng rác hệ thống (Chờ duyệt)       │
│                                                                                        │
│                                   [ Dừng quét ]                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3. Trạng thái 3: Kết quả Quét (Results & Action State)
Sau khi quét xong, hiển thị bảng phân loại rác và nút bấm dọn dẹp an toàn:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PHÁT HIỆN: 14.82 GB DỮ LIỆU CÓ THỂ DỌN                     [Tất cả] [Bỏ chọn]          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [✓] 🗄️ BỘ NHỚ ĐỆM NGƯỜI DÙNG (User Caches)                           3.20 GB   [Xem >] │
│     Bao gồm: Caches Safari, Spotify, Chrome, Slack (Tự động tái tạo khi dùng)          │
│                                                                                        │
│ [✓] 🛠️ DỮ LIỆU BUILD XCODE (DerivedData & Archives)                   8.80 GB   [Xem >] │
│     Bao gồm: Build index, module cache dự án cũ (Không ảnh hưởng source code)          │
│                                                                                        │
│ [✓] 📄 NHẬT KÝ HỆ THỐNG & CRASH LOGS                                 412.0 MB   [Xem >] │
│     Bao gồm: DiagnosticReports, ASL logs cũ hơn 30 ngày                                │
│                                                                                        │
│ [✓] 🗑️ THÙNG RÁC HỆ THỐNG (Trash)                                     2.41 GB   [Xem >] │
│     Bao gồm: 142 tệp đang nằm trong ~/.Trash                                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Đã chọn: 14.82 GB • Xóa trực tiếp 12.41 GB, Làm rỗng Thùng rác 2.41 GB                 │
│                                                              [ Dọn dẹp 14.82 GB ]      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Màn hình 3: App Uninstaller (Gỡ cài đặt Ứng dụng & File Rác)

Bố cục dạng 2 cột (Master-Detail Layout): Cột trái là danh sách ứng dụng; Cột phải là cây phân rã tệp phụ thuộc liên quan.

```text
┌──────────────────────────────────────┬─────────────────────────────────────────────────┐
│ TÌM ỨNG DỤNG [🔍 Tìm tên hoặc ID...]  │ CHI TIẾT GỠ CÀI ĐẶT: Docker Desktop             │
│ Sắp xếp: [Dung lượng giảm dần ▼]     │                                                 │
├──────────────────────────────────────┼─────────────────────────────────────────────────┤
│ [✓] 🐳 Docker Desktop        12.4 GB │ [✓] Ứng dụng gốc (.app)                 3.8 GB  │
│     v4.35 • Apple Silicon            │     /Applications/Docker.app                    │
│                                      │                                                 │
│ [ ] 🎨 Figma                   2.1 GB │ [✓] Dữ liệu máy ảo & Container          8.1 GB  │
│     v116.15 • Apple Silicon          │     ~/Library/Containers/com.docker.docker      │
│                                      │                                                 │
│ [ ] 🎧 Spotify                 1.4 GB │ [✓] Bộ nhớ đệm ứng dụng                 480 MB  │
│     v1.2.40 • Universal              │     ~/Library/Caches/com.docker.docker          │
│                                      │                                                 │
│ [🔒] 🧭 Safari                48.0 MB │ [✓] Tệp cấu hình người dùng              24 MB  │
│     Hệ thống bảo vệ (SIP Locked)     │     ~/Library/Preferences/com.docker.docker.plist│
│                                      ├─────────────────────────────────────────────────┤
│                                      │ Cơ chế: Đưa vào Thùng rác (trashItem)           │
│                                      │ [ Bỏ chọn cấu hình ]     [ Gỡ cài đặt (12.4 GB) ]│
└──────────────────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 5. Màn hình 4: Space Lens (Phân tích Trực quan Dung lượng)

Cung cấp khả năng điều hướng sâu vào từng thư mục với Breadcrumb và hiển thị phân cấp trực quan:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PHẠM VI: [~ / Users / vic / Projects /] ◄── Breadcrumb Navigation  [Bubble Map] [Bảng] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┐ ┌───────────────────────────────────┐ │
│ │ TRỰC QUAN HÓA BUBBLE MAP / TREEMAP           │ │ DANH SÁCH TỆP & THƯ MỤC NẶNG      │ │
│ │ ┌───────────────────────┬──────────────────┐ │ │                                   │ │
│ │ │                       │ node_modules     │ │ │ [📁] target/            14.2 GB  │ │
│ │ │ target/               │ 6.8 GB           │ │ │ [📁] node_modules/       6.8 GB  │ │
│ │ │ 14.2 GB               ├──────────────────┤ │ │ [📁] .build/             2.4 GB  │ │
│ │ │                       │ .build/          │ │ │ [📄] backup.tar.gz       1.8 GB  │ │
│ │ │                       │ 2.4 GB           │ │ │                                   │ │
│ │ └───────────────────────┴──────────────────┘ │ │ Chi tiết: target/debug/deps       │ │
│ │                                              │ │ Đường dẫn: .../photo_picker/target│ │
│ │ Click đúp vào khối để phóng to thư mục con   │ │                                   │ │
│ └──────────────────────────────────────────────┘ │ [ Mở Finder ]  [ Chuyển vào Trash]│ │
│                                                  └───────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Màn hình 5: Menu Bar Popover (Tiện ích Giám sát Khay Hệ thống)

Cửa sổ nhỏ gọn (Kích thước: `320px × 380px`) mở ra khi người dùng click vào biểu tượng VXClean trên Menu Bar:

```text
┌────────────────────────────────────────┐
│  VXClean Monitor            [⚙] [✕]    │
├────────────────────────────────────────┤
│  CPU           12.4%  [ ▄▅▂ ▂▃  ]     │
│  RAM (32GB)    78.0%  [▓▓▓▓▓▓▓░░]     │
│    App: 14.2G • Wired: 6.1G • Free: 7G │
│                                        │
│  DISK          65.5%  [▓▓▓▓▓▓░░░]     │
│    Khả dụng: 342.5 GB (Purgeable: 18G) │
│                                        │
│  PIN           86% ⚡ Đang sạc (96W)   │
│    Thời gian đầy: ~25 phút             │
├────────────────────────────────────────┤
│  ⚡ Rác khả dụng: ~14.8 GB              │
│  [ Quét & Dọn nhanh ]                  │
├────────────────────────────────────────┤
│  [ Mở Dashboard chính ]  [ Thoát hẳn ] │
└────────────────────────────────────────┘
```

---

## 7. Hộp thoại Xác nhận An toàn (Safety Confirmation Modal)

Mọi thao tác dọn dẹp lớn bắt buộc hiển thị hộp thoại xác nhận tuân thủ `safety_audit.md`:

```text
┌─────────────────────────────────────────────────────────┐
│ ⚠️ XÁC NHẬN DỌN DẸP DỮ LIỆU                             │
├─────────────────────────────────────────────────────────┤
│ Bạn sắp dọn dẹp 14.82 GB dữ liệu đã chọn.               │
│                                                         │
│ Chi tiết cơ chế xử lý:                                  │
│ • 12.41 GB (Caches, Logs, Xcode): Xóa trực tiếp vĩnh viễn│
│   (Không thể khôi phục từ Thùng rác).                   │
│ • 2.41 GB (Thùng rác hệ thống): Làm rỗng hoàn toàn.     │
│                                                         │
│ [ ] Tôi hiểu rằng các tệp bộ nhớ đệm sẽ bị xóa vĩnh viễn│
│                                                         │
│              [ Hủy bỏ ]   [ Xác nhận Dọn dẹp ]          │
└─────────────────────────────────────────────────────────┘
```
