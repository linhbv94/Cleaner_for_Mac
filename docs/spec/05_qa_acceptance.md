# QA & Acceptance Specification: VXClean (`_spec5_qa_acceptance`)

> **Tên sản phẩm:** VXClean  
> **Thư mục dự án:** `cleaner_for_mac`  
> **Mã tài liệu:** `_spec5_qa_acceptance`  
> **Phiên bản:** 1.0.0  
> **Ngày cập nhật:** 2026-10-07  
> **Phạm vi:** Tiêu chí nghiệm thu (Gherkin Syntax), Ma trận trường hợp biên (Edge Cases), và Bộ checklist kiểm thử chất lượng trước phát hành.

---

## 1. Tiêu chí Nghiệm thu Tính năng (Acceptance Criteria - Gherkin)

### 1.1. Phân hệ Telemetry & Giám sát Hệ thống (Dashboard)

```gherkin
Kịch bản: Khởi động ứng dụng và đọc chỉ số phần cứng thật
  Giả sử ứng dụng VXClean vừa được khởi chạy
  Khi người dùng nhìn vào màn hình Dashboard
  Thì ứng dụng hiển thị chính xác % CPU sử dụng, phân bổ RAM (Active, Wired, Compressed), và dung lượng đĩa
  Và số liệu phải khớp với Activity Monitor của macOS với độ lệch không quá ±3%
  Và nút "Làm mới" bị vô hiệu hóa (disabled) trong 2 giây khi đang lấy mẫu để chống spam request.

Kịch bản: Hiển thị trạng thái nguồn điện trên máy tính Mac không có pin
  Giả sử ứng dụng đang chạy trên Mac mini, Mac Studio hoặc Mac Pro
  Khi hệ thống đọc dữ liệu telemetry pin
  Thì trường "has_battery" trả về false
  Và giao diện hiển thị nhãn "Nguồn điện AC trực tiếp • Thiết bị để bàn"
  Và không hiển thị thanh tiến trình 0% hoặc thông báo pin yếu ảo.
```

### 1.2. Phân hệ Smart Scan & Dọn dẹp An toàn (System Cleaner)

```gherkin
Kịch bản: Quét hệ thống khi chưa có quyền Full Disk Access
  Giả sử người dùng chưa cấp quyền Full Disk Access cho VXClean
  Khi người dùng nhấn "Bắt đầu Smart Scan"
  Thì hệ thống chỉ quét các thư mục người dùng mở (User Caches, Xcode DerivedData, Trash)
  Và hiển thị một Banner cảnh báo màu Amber thông báo các thư mục sâu (Mail, Safari) bị bỏ qua
  Và cung cấp nút mở trực tiếp Cài đặt Hệ thống macOS để cấp quyền.

Kịch bản: Dọn dẹp tệp với xác nhận chính sách an toàn
  Giả sử quá trình quét hoàn tất và phát hiện 12.4 GB tệp rác
  Khi người dùng bấm nút "Dọn dẹp"
  Thì một hộp thoại xác nhận bắt buộc xuất hiện
  Và hộp thoại phân tách rõ ràng: tệp nào sẽ bị xóa vĩnh viễn (direct removeItem) và tệp nào chuyển vào Thùng rác
  Khi người dùng bấm "Xác nhận dọn dẹp"
  Thì tiến trình dọn dẹp bắt đầu và cập nhật dung lượng đã giải phóng theo thời gian thực.
```

### 1.3. Phân hệ Gỡ cài đặt Ứng dụng (App Uninstaller)

```gherkin
Kịch bản: Bảo vệ ứng dụng hệ thống và ứng dụng tự thân
  Giả sử danh sách ứng dụng đã quét xong
  Khi người dùng tìm kiếm "Safari" hoặc "VXClean"
  Thì nút checkbox chọn gỡ cài đặt bị khóa (disabled)
  Và ứng dụng Safari hiển thị nhãn "Bảo vệ hệ thống (SIP Locked)"
  Và ứng dụng VXClean hiển thị nhãn "Ứng dụng tự thân (Protected)"
  Và không có cách nào kích hoạt lệnh gỡ các ứng dụng này qua giao diện.

Kịch bản: Gỡ cài đặt ứng dụng bên thứ ba thông thường
  Giả sử người dùng chọn gỡ cài đặt ứng dụng "Docker Desktop"
  Khi người dùng xác nhận thao tác gỡ
  Thì file "Docker.app" và các tệp trong "~/Library/Application Support" được chuyển vào Thùng rác (trashItem)
  Và người dùng có thể mở Thùng rác để khôi phục (Put Back) nếu muốn.
```

### 1.4. Phân hệ Vòng đời Cửa sổ & Menu Bar (Window & Dock Lifecycle)

```gherkin
Kịch bản: Đóng cửa sổ chính bằng nút đỏ hoặc Cmd+W
  Giả sử cửa sổ chính của VXClean đang mở và hiển thị icon trên thanh Dock
  Khi người dùng bấm nút đỏ (X) hoặc nhấn tổ hợp phím Cmd+W
  Thì cửa sổ chính bị ẩn đi (window.hide)
  Và icon VXClean trên thanh Dock biến mất (ActivationPolicy = .accessory)
  Và biểu tượng VXClean trên Menu Bar vẫn tiếp tục hoạt động.

Kịch bản: Mở lại cửa sổ chính từ Menu Bar
  Giả sử cửa sổ chính đang ẩn và icon trên Dock không xuất hiện
  Khi người dùng click vào icon Menu Bar và chọn "Mở VXClean Dashboard"
  Thì cửa sổ chính xuất hiện và nhận tiêu điểm (focus)
  Và icon VXClean xuất hiện trở lại trên thanh Dock (ActivationPolicy = .regular).

Kịch bản: Thoát hoàn toàn ứng dụng (Explicit Quit)
  Giả sử ứng dụng đang chạy
  Khi người dùng nhấn Cmd+Q hoặc bấm "Thoát hoàn toàn" trong Menu Bar
  Thì toàn bộ tiến trình ứng dụng và các subprocess liên quan đều kết thúc hoàn toàn.
```

---

## 2. Ma trận Trường hợp Biên (Edge Cases Matrix)

| STT | Trường hợp biên (Edge Case) | Hành vi kỳ vọng của Hệ thống | Trạng thái Pass/Fail |
| :--- | :--- | :--- | :--- |
| **01** | Tệp đang được ứng dụng khác mở khóa ghi (File in-use / locked) khi dọn rác | Bỏ qua tệp đó an toàn, không làm treo app; báo lỗi chi tiết trong báo cáo tổng kết và tiếp tục dọn các file còn lại. | **Bắt buộc** |
| **02** | Xcode đang mở và đang build khi người dùng dọn `DerivedData` | Gửi tín hiệu cảnh báo hoặc bỏ qua các thư mục module cache đang bị lock để tránh làm hỏng tiến trình build hiện tại. | **Bắt buộc** |
| **03** | Thư mục `~/.Trash` đang trống khi bấm làm rỗng | Hiển thị nhãn "Thùng rác đã trống (0 B)", nút làm rỗng bị vô hiệu hóa mờ đi. | **Bắt buộc** |
| **04** | Người dùng thu hồi quyền FDA giữa chừng khi app đang chạy | Lần quét tiếp theo phát hiện lỗi quyền, hạ cấp xuống quét bình thường và hiển thị lại banner cảnh báo. | **Bắt buộc** |
| **05** | Máy Mac bị mất kết nối mạng Internet | Toàn bộ tính năng quét, dọn dẹp, Space Lens và telemetry hoạt động 100% offline, không gửi bất kỳ gói tin mạng nào ra ngoài. | **Bắt buộc** |
| **06** | Thư mục quét Space Lens có ký tự Unicode phức tạp hoặc Emoji | Đường dẫn UTF-8 được xử lý chuẩn xác, không bị lỗi escape hoặc phân rã ký tự (NFC/NFD). | **Bắt buộc** |
| **07** | Người dùng nhập sai mật khẩu xác thực quyền Admin nhiều lần | Không crash app; dừng lệnh dọn đặc quyền và thông báo "Xác thực không thành công. Các tệp yêu cầu quyền quản trị bị bỏ qua". | **Bắt buộc** |

---

## 3. Danh mục Kiểm định Chất lượng (QA Verification Checklist)

- [ ] **Bảo mật & Quyền riêng tư:** Xác nhận 0 request mạng ra bên ngoài; mã nguồn tuân thủ cam kết không thu thập dữ liệu cá nhân.
- [ ] **Tuân thủ Đối soát Xóa tệp (`safety_audit.md`):** Kiểm tra các điểm gọi `removeItem`, `trashItem` và `cleanWithAdminPrivileges` đúng 100% theo ma trận.
- [ ] **Theme & Giao diện:** Kiểm tra màu nền `#0f1117`, card `#141821`, màu nhấn Cyan `#06b6d4`, không bị vỡ font tiếng Việt.
- [ ] **Hiệu năng & Tiết kiệm Pin:** Đảm bảo khi đóng popover Menu Bar, mức tiêu thụ CPU của app ở trạng thái nền `< 0.3%`.
- [ ] **Bộ cài đặt & Ký số (Code Signature):** Kiểm tra entitlements macOS, cờ `HARDENED_RUNTIME`, và quyền truy cập Full Disk Access.
