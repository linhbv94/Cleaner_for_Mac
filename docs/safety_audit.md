# Báo Cáo Đối Soát An Toàn Xóa Tệp (Safety Audit)

> **Tài liệu đối soát mã nguồn VXClean**  
> **Cập nhật:** 2026-10-07  
> **Phạm vi:** Đối soát tĩnh các điểm vào (entry points) xóa tệp thực tế trong mã nguồn dự án. Báo cáo này là kết quả review mã nguồn tĩnh, không phải chứng chỉ an toàn (security certification) hay kiểm định bảo mật đầy đủ, và chưa bao gồm regression tests xóa thực tế trên dữ liệu thật.

---

## 1. Đối Chiếu Với Tuyên Bố Upstream

Tài liệu README gốc của dự án upstream ([docs_upstream/readme_original.md](../docs_upstream/readme_original.md)) đưa ra cam kết:
* *Thùng rác, không `rm`*: "Mọi thứ bị xoá đều vào Thùng rác qua `FileManager.trashItem` — xoá nhầm thì kéo lại".
* "MClean không: thu thập dữ liệu · cần mạng để hoạt động · chuyển tệp đi đâu ngoài Thùng rác."

Qua việc đối soát tĩnh các điểm vào thực tế trong mã nguồn, cam kết này chỉ đúng với một số phân hệ nhất định (như Space Lens và luồng thông thường của App Uninstaller), trong khi các tác vụ dọn dẹp hệ thống, tệp mồ côi và dọn nâng cao bằng quyền quản trị lại sử dụng thao tác xóa trực tiếp (`removeItem` hoặc `rm -rf`).

---

## 2. Bằng Chứng Mã Nguồn Cụ Thể (Code Evidence)

### A. Dọn Dẹp Tiêu Chuẩn: `CleaningEngine.cleanItems`
* **Vị trí:** [CleaningEngine.swift](../MClean/Services/CleaningEngine.swift) (hàm `cleanItems`, dòng 77)
* **Cơ chế thực thi:**
  ```swift
  try fileManager.removeItem(at: resolvedURL)
  ```
* **Bản chất:** Thao tác xóa trực tiếp, không đưa tệp vào Thùng rác (`Trash`). Phương thức có cơ chế kiểm tra danh sách cho phép (allow-list) và kiểm tra lại liên kết mềm (symlink recheck), tuy nhiên chưa chứng minh triệt tiêu hoàn toàn race condition trong môi trường đa tiến trình (TOCTOU).

### B. Dọn Dẹp Quyền Quản Trị: `CleaningEngine.cleanWithAdminPrivileges`
* **Vị trí:** [CleaningEngine.swift](../MClean/Services/CleaningEngine.swift) (hàm `cleanWithAdminPrivileges`, dòng 118, 159)
* **Cơ chế thực thi:**
  Sử dụng `NSAppleScript` thực thi `do shell script` chạy lệnh:
  ```bash
  /usr/bin/xargs -0 /bin/rm -rf -- < ...
  ```
  với quyền administrator privileges.
* **Bản chất:** Xóa trực tiếp tệp/thư mục cần đặc quyền quản trị. Mã nguồn có bước tái kiểm tra (revalidate) tính hợp lệ theo allow-list trước khi xuất danh sách tệp ra tệp tạm và ủy quyền thực thi, do đó không thể coi là "không có lớp bảo vệ nào".

### C. Gỡ Cài Đặt Ứng Dụng: `AppState.removeSelectedFiles` & `trashDirectly`
* **Vị trí:** [AppState.swift](../MClean/ViewModels/AppState.swift) (dòng 278, 365–382)
* **Cơ chế thực thi:**
  Luồng thông thường gọi `trashDirectly`, sử dụng:
  ```swift
  try FileManager.default.trashItem(at: url, resultingItemURL: &resulting)
  ```
  Nếu thao tác Thùng rác gặp lỗi quyền truy cập, hệ thống có bước fallback sang `cleanWithAdminPrivileges`.
* **Bản chất:** Phân hệ gỡ ứng dụng (Uninstaller) sở hữu luồng xử lý kết hợp: phần lớn tệp thông thường được đưa vào Thùng rác (`trashItem`), và chỉ khi thiếu quyền mới kích hoạt fallback xóa trực tiếp qua quyền quản trị. Không được quy kết toàn bộ thao tác gỡ cài đặt là `removeItem`.

### D. Xóa Tệp Mồ Côi: `OrphanListView`
* **Vị trí:** [OrphanListView.swift](../MClean/Views/Orphans/OrphanListView.swift)
* **Cơ chế thực thi:**
  * Dòng 148, 260: Kiểm tra an toàn trước khi xóa bằng `guard OrphanSafetyPolicy.isSafeCandidate(url)`.
  * Dòng 211, 213: Xóa người dùng thông thường bằng `try FileManager.default.removeItem(at: url)`.
  * Dòng 258, 266: Khi cần quyền quản trị, gọi lệnh `rm -rf --` thông qua AppleScript (`osascript`).
* **Bản chất:** Xóa trực tiếp khỏi hệ thống sau khi đã qua bộ lọc xác thực `OrphanSafetyPolicy`.

### E. Bản Đồ Dung Lượng: `CleaningEngine.trashItems` & `SpaceLensViewModel`
* **Vị trí:** [CleaningEngine.swift](../MClean/Services/CleaningEngine.swift) (dòng 379, 402) và [SpaceLensViewModel.swift](../MClean/ViewModels/SpaceLensViewModel.swift) (dòng 141)
* **Cơ chế thực thi:**
  ```swift
  try fileManager.trashItem(at: item.url, resultingItemURL: nil)
  ```
* **Bản chất:** Phân hệ Space Lens thực hiện di chuyển tệp đã chọn vào Thùng rác (`Trash`), cho phép người dùng khôi phục lại khi cần.

### F. Dọn Thùng Rác & Thu Hồi Purgeable Space
* **Vị trí:** [CleaningEngine.swift](../MClean/Services/CleaningEngine.swift) (dòng 204, 230, 242)
* **Cơ chế thực thi:**
  * `emptyTrash` (dòng 230, 242) gọi `removeItem(atPath:)` chỉ trên các tệp nằm bên trong nội dung Thùng rác (`Trash`).
  * `purgePurgeableSpace` (dòng 204) gọi lệnh `/usr/sbin/diskutil`, không sử dụng cơ chế xóa tệp trực tiếp; danh mục quét và dọn định kỳ không tự động thực thi việc purge dung lượng này.

### G. Dọn Dẹp Định Kỳ Theo Lịch: `SchedulerService` & `AppState`
* **Vị trí:** [SchedulerService.swift](../MClean/Services/SchedulerService.swift) và [AppState.swift](../MClean/ViewModels/AppState.swift) (gần dòng 1160)
* **Cơ chế thực thi:**
  `runScheduledScan` thực hiện quét các hạng mục định kỳ. Nếu cấu hình `config.autoClean` bật và tổng dung lượng vượt `minimumCleanSize`, hệ thống gọi `cleanAll()` (áp dụng cho các mục đang kích hoạt/chọn sẵn).
* **Bản chất:** Thuộc tính `Models.ScheduleConfig.autoClean` có giá trị mặc định là `false`. Mặc định này không thay thế việc kiểm tra cấu hình đang lưu khi chạy app. Khi bật dọn tự động định kỳ, không có cơ chế để người dùng xác nhận lại từng tệp tại thời điểm dọn; tác vụ này cần được kiểm định runtime thực tế trước khi vận hành thực tế.

---

## 3. Ma Trận Điểm Vào Xóa Tệp Thực Tế

| Phân hệ / Điểm vào | Tệp nguồn & Dòng tham chiếu | API / Lệnh thực thi | Cơ chế an toàn | Chuyển vào Trash |
| :--- | :--- | :--- | :--- | :--- |
| **System Junk Clean** | [CleaningEngine.swift](../MClean/Services/CleaningEngine.swift) : 77 | `fileManager.removeItem` | Allow-list, symlink recheck | Không (Xóa trực tiếp) |
| **Admin Clean** | [CleaningEngine.swift](../MClean/Services/CleaningEngine.swift) : 118, 159 | `/bin/rm -rf` qua AppleScript | Revalidate allow-list, temp file | Không (Xóa trực tiếp) |
| **App Uninstaller (Normal)** | [AppState.swift](../MClean/ViewModels/AppState.swift) : 365–382 | `fileManager.trashItem` | Bundle matching, system app protect | **Có** |
| **App Uninstaller (Admin)** | [AppState.swift](../MClean/ViewModels/AppState.swift) : 340 | `cleanWithAdminPrivileges` | Fallback khi thiếu quyền | Không (Xóa trực tiếp) |
| **Orphan Files** | [OrphanListView.swift](../MClean/Views/Orphans/OrphanListView.swift) : 148, 213, 266 | `removeItem` / `rm -rf` | `OrphanSafetyPolicy.isSafeCandidate` | Không (Xóa trực tiếp) |
| **Space Lens** | [SpaceLensViewModel.swift](../MClean/ViewModels/SpaceLensViewModel.swift) : 141 | `fileManager.trashItem` | Chọn thủ công từng thư mục/tệp | **Có** |
| **Empty Trash** | [CleaningEngine.swift](../MClean/Services/CleaningEngine.swift) : 230, 242 | `fileManager.removeItem` | Chỉ xóa bên trong thư mục Trash | Không (Đã ở trong Trash) |
| **Purgeable Space** | [CleaningEngine.swift](../MClean/Services/CleaningEngine.swift) : 204 | `diskutil` APFS purge | Gọi tiện ích hệ thống | N/A (Không xóa tệp) |
| **Scheduled Clean** | [AppState.swift](../MClean/ViewModels/AppState.swift) : 1162–1176 | `cleanAll` qua `CleaningEngine` | Mặc định tắt (`autoClean: false`) | Phụ thuộc từng hạng mục |

---

## 4. Kết Luận & Khuyến Cáo Vận Hành

1. **Minh bạch hóa hành vi:** Tài liệu và giao diện VXClean cần giải thích rõ ràng cho người dùng rằng thao tác dọn dẹp hệ thống và tệp mồ côi sẽ xóa trực tiếp, trong khi thao tác gỡ ứng dụng và Space Lens ưu tiên đưa vào Thùng rác.
2. **Giữ nguyên baseline:** Các thuật toán quét và dọn dẹp cốt lõi của baseline được giữ nguyên để bảo đảm tính tương thích; chưa thực thi kiểm thử dọn dữ liệu thực tế trên hệ thống.
3. **Giới hạn báo cáo:** Đây là báo cáo rà soát mã nguồn tĩnh (static analysis) dựa trên các tệp nguồn thật của dự án, nhằm loại bỏ các thông tin suy diễn sai lệch trước đây.
