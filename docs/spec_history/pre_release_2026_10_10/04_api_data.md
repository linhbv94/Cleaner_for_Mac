# API & Data Contract Specification: VXClean (`_spec4_api_data`)

> **Đối soát hiện hành — 2026-10-10:** [Truth engine và gaps](13_engine_behavior_truth.md) thay thế các mô tả implementation cũ mâu thuẫn bên dưới. [Dictionary toàn Dọn chi tiết](12_cleanup_dictionary.md) và [Quit/reopen](11_detailed_app_cleanup.md) là target **chưa nối engine/UI**. Scan mặc định giữ nguyên. Cleanup khác Uninstall; Movies/CapCut có thể xóa cả root khi chọn trong Uninstall, broad candidate mặc định bỏ chọn. Không coi thiết kế cũ hoặc mock preview là tính năng native đã nghiệm thu.


> Cập nhật UI/engine 2026-10-09: [spec feedback mới](07_ui_engine_feedback.md) ưu tiên khi hành vi/scope trong tài liệu này mâu thuẫn.


> **Tên sản phẩm:** VXClean
> **Thư mục dự án:** `cleaner_for_mac`
> **Mã tài liệu:** `_spec4_api_data`
> **Phiên bản:** 1.2.0 (Đồng bộ chuẩn hóa 100% với `desktop/src/types.ts` và Swift Engine)
> **Ngày cập nhật:** 2026-10-09
> **Phạm vi:** Khế ước giao tiếp IPC Tauri 2, định nghĩa kiểu dữ liệu TypeScript & Rust DTO, sự kiện luồng thời gian thực (Events), và JSON Schema tương tác với Native Engine.

---

## 1. Khế ước Lệnh IPC Tauri (Tauri IPC Commands)

Tầng Frontend giao tiếp với Rust Core thông qua các lệnh Tauri `invoke`:

```typescript
// 1. Giám sát & Năng lực hệ thống
invoke<Capabilities>("get_capabilities");
invoke<SystemSnapshot>("get_system_snapshot");

// 2. Quét & Dọn dẹp rác hệ thống
invoke<ScanResponse>("start_scan", { options: ScanOptions });
invoke<void>("cancel_scan");
invoke<CleanResponse>("execute_clean", { payload: CleanPayload });

// 3. Gỡ cài đặt ứng dụng
invoke<AppsListResponse>("get_installed_apps", { filter?: AppFilterOptions });
invoke<CleanResponse>("uninstall_app", { payload: UninstallPayload });

// 4. Phân tích dung lượng Space Lens
invoke<SpaceLensResponse>("analyze_space_lens", { path: string, maxDepth?: number });
invoke<CleanResponse>("trash_space_lens_items", { paths: string[] });

// 5. Tiện ích hệ điều hành (OS Utilities)
invoke<void>("reveal_in_file_manager", { path: string });
invoke<void>("copy_to_clipboard", { text: string });
```

---

## 2. Định nghĩa DTO & TypeScript Interfaces Chuẩn Hóa

### 2.1. Phản hồi Năng lực Hệ thống (`get_capabilities`)
*Khớp 100% với [desktop/src/types.ts](../../desktop/src/types.ts):*

```typescript
export interface FeatureCapabilities {
  system_monitor: boolean;
  smart_scan: boolean;
  cleanup: boolean;
  uninstaller: boolean;
  space_lens: boolean;
  menu_bar_monitor: boolean;
}

export interface Capabilities {
  platform: string;               // "macos" | "windows"
  has_native_engine: boolean;
  can_monitor_system: boolean;
  features: FeatureCapabilities;
  engine_status: string;
  has_full_disk_access?: boolean;
}
```

### 2.2. Dữ liệu Giám sát Hệ thống (`get_system_snapshot`)
*Khớp 100% với [desktop/src/types.ts](../../desktop/src/types.ts) và Swift CLI `metrics`:*

```typescript
export interface CpuMetrics {
  usage: number;                  // 0.0 - 100.0%
  history: number[];              // Mảng sparkline 10 - 20 mẫu
}

export interface MemoryMetrics {
  used_bytes: number;
  total_bytes: number;
  active_bytes: number;
  wired_bytes: number;
  compressed_bytes: number;
  fraction: number;               // 0.0 - 1.0
}

export interface DiskMetrics {
  used_bytes: number;
  total_bytes: number;
  available_bytes: number;        // Khả dụng (bao gồm purgeable)
  fraction: number;               // 0.0 - 1.0
}

export interface BatteryMetrics {
  has_battery: boolean;           // false với Mac mini, Mac Studio, Mac Pro, iMac
  charge_percent: number;         // 0 - 100
  is_charging: boolean;
  is_ac_powered: boolean;
  is_charged: boolean;
}

export interface MetricsData {
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  battery: BatteryMetrics;
}

export interface SystemSnapshot {
  protocol_version: string;       // "1.0"
  platform: string;               // "macos"
  timestamp: string;              // ISO-8601 (vd: "2026-10-09T05:20:00Z")
  metrics: MetricsData;
}
```

### 2.3. Dữ liệu Quét Rác & Tùy chọn (`start_scan`, `scan_progress`)

Cập nhật theo yêu cầu user: scan mặc định dùng trực tiếp ScanEngine MClean, đủ nhóm trong CleaningCategory.scannable; không trả nhóm rỗng. `is_selected_by_default` theo từng item từ MClean (large files/history AI không chọn sẵn), không suy ra từ cả category. DTO giữ legacy IDs để tương thích; source mới dùng System Junk/User Cache/Xcode Junk và các nhóm công cụ riêng. Dung lượng hiển thị decimal; parent/child cùng phương thức không dọn hai lần. `purgeableSpace` không nằm trong Smart Scan.

```typescript
export type JunkCategoryType =
  | "system_junk"
  | "ai_apps"
  | "large_files"
  | "xcode_junk"
  | "brew_cache"
  | "node_cache"
  | "docker_cache"
  | "user_caches"
  | "system_logs"
  | "xcode_derived_data"
  | "xcode_archives"             // Legacy ID; scanner hiện trả xcode_junk
  | "mail_downloads"
  | "trash_bin"
  | "orphan_residues";

export interface ScanOptions {
  categories?: JunkCategoryType[];
  fast_mode?: boolean;
}

export interface JunkItem {
  is_cleanable?: boolean; // false = chỉ thông tin (Docker reclaimable), không cấp quyền xóa
  id: string;
  path: string;
  name: string;
  size_bytes: number;
  category: JunkCategoryType;
  requires_admin: boolean;
  deletion_method: "trash" | "remove_item" | "admin_shell";
  is_selected_by_default: boolean;
}

export interface ScanCategorySummary {
  category: JunkCategoryType;
  title: string;
  description: string;
  total_bytes: number;
  item_count: number;
  items: JunkItem[];
}

export interface ScanResponse {
  scan_id: string;
  duration_ms: number;
  total_cleanable_bytes: number;
  categories: ScanCategorySummary[];
  fda_limited_categories: JunkCategoryType[];
}

// Sự kiện tiến trình quét stream về Frontend qua Tauri listen('scan_progress')
export interface ScanProgressEvent {
  current_category: string;
  current_path: string;
  progress_fraction: number;     // 0.0 - 1.0
  scanned_bytes: number;
}
```

### 2.4. Khế ước Yêu cầu Dọn dẹp (`execute_clean`, `clean_progress`)

```typescript
export interface CleanTargetItem {
  path: string;
  deletion_method: "trash" | "remove_item" | "admin_shell";
}

export interface CleanPayload {
  scan_id: string;
  targets: CleanTargetItem[];     // Danh sách path và phương thức xóa cụ thể
  confirm_direct_delete: boolean; // Bắt buộc true
}

export interface CleanFileResult {
  path: string;
  status: "success" | "skipped" | "permission_denied" | "file_in_use";
  affected_bytes: number;
  method_used: "trash" | "remove_item" | "admin_shell";
  error_message?: string;
}

export interface CleanResponse {
  permanently_freed_bytes: number; // Thu hồi đĩa thực tế (removeItem / admin)
  trashed_bytes: number;           // Chuyển vào Thùng rác (trashItem)
  total_affected_bytes: number;    // Tổng cộng
  success_count: number;
  failure_count: number;
  duration_ms: number;
  details: CleanFileResult[];
}

// Sự kiện tiến trình dọn dẹp stream về Frontend qua Tauri listen('clean_progress')
export interface CleanProgressEvent {
  current_item: string;
  progress_fraction: number;     // 0.0 - 1.0
  trashed_bytes: number;
  freed_bytes: number;
}
```

### 2.5. Khế ước Gỡ Cài đặt Ứng dụng (`get_installed_apps`, `uninstall_app`)

```typescript
export interface AppFilterOptions {
  keyword?: string;
  sort_by?: "size" | "name" | "last_used";
  filter_type?: "all" | "user" | "system";
}

export interface AssociatedFile {
  path: string;
  file_type: "bundle" | "app_support" | "cache" | "preferences" | "saved_state" | "logs";
  size_bytes: number;
  is_essential: boolean;
  deletion_method: "trash" | "remove_item" | "admin_shell";
}

export interface InstalledApp {
  id: string;
  name: string;
  bundle_id: string;
  version: string;
  bundle_path: string;
  icon_path?: string;
  architectures: ("arm64" | "x86_64")[];
  total_size_bytes: number;
  is_system_protected: boolean;   // SIP / Apple default -> true (Khóa gỡ)
  is_self_app: boolean;           // VXClean -> true (Khóa tự gỡ)
  associated_files: AssociatedFile[];
}

export interface AppsListResponse {
  apps: InstalledApp[];
  total_apps: number;
}

export interface UninstallPayload {
  app_id: string;
  selected_paths: string[];
  allow_admin_fallback: boolean;  // Bắt buộc xác nhận trước khi cho phép rm -rf
}
```

### 2.6. Khế ước Space Lens (`analyze_space_lens`)

```typescript
export interface SpaceLensNode {
  name: string;
  path: string;
  size_bytes: number;
  is_directory: boolean;
  is_package: boolean;            // .app, .photoslibrary bundle
  is_access_denied: boolean;      // Thiếu quyền đọc
  children?: SpaceLensNode[];
  item_count?: number;
}

export interface SpaceLensResponse {
  root_path: string;
  total_analyzed_bytes: number;
  root_node: SpaceLensNode;
}
```

---

## 3. Khế ước Giao tiếp Subprocess (`vxclean_engine` CLI)

Rust Host gọi binary bản địa bằng Command Line với argv cố định và pipe:

| Câu lệnh CLI | Tham số (Arguments) | Giao tiếp I/O | Timeout |
| :--- | :--- | :--- | :--- |
| `vxclean_engine metrics` | Không tham số | stdout JSON (`SystemSnapshot`) | 5000ms |
| `vxclean_engine scan` | `--all` hoặc `--categories <list>` | stdout JSON (`ScanResponse`) | 45000ms |
| `vxclean_engine clean` | `--stdin` | stdin: mảng path JSON<br>stdout JSON (`CleanResponse`) | 60000ms |
| `vxclean_engine apps` | `--include-residuals` | stdout JSON (`AppsListResponse`) | 30000ms |
| `vxclean_engine lens` | `--path <dir> --depth <n>` | stdout JSON (`SpaceLensResponse`) | 60000ms |

### Quy chuẩn Xử lý Lỗi CLI:
Nếu subprocess trả về exit code khác 0, toàn bộ nội dung trong `stderr` được Rust bắt lại, đóng gói thành đối tượng lỗi:
```json
{
  "status": "error",
  "code": "ENGINE_EXECUTION_FAILED",
  "message": "Nội dung chi tiết từ stderr",
  "timestamp": "2026-10-09T05:20:00Z"
}
```

## Hợp đồng bổ sung feedback UI/engine

- start_scan: operationId bắt buộc, includeEmpty tùy chọn boolean; detailed scan true, Smart Scan false.
- analyze_space_lens: path và operationId; emit lens_progress theo operationId; cancel_scan cũng hủy lens. DTO giới hạn depth 1 cho home, double click scan lại subtree.
- choose_scan_folder: trả string path hoặc null khi Hủy, native dialog.
- open_full_disk_access_settings: mở trang quyền, user tự cấp.
- SpaceLensResponse thêm is_partial; SpaceLensNode thêm can_trash. lens_id duy nhất mỗi scan, ngoài-home không có quyền dọn.
