# API & Data Contract Specification: VXClean (`_spec4_api_data`)

> **Tên sản phẩm:** VXClean  
> **Thư mục dự án:** `cleaner_for_mac`  
> **Mã tài liệu:** `_spec4_api_data`  
> **Phiên bản:** 1.0.0  
> **Ngày cập nhật:** 2026-10-07  
> **Phạm vi:** Khế ước giao tiếp IPC Tauri 2, định nghĩa kiểu dữ liệu TypeScript & Rust DTO, và JSON Schema tương tác với Native Engine.

---

## 1. Khế ước Lệnh IPC Tauri (Tauri IPC Commands)

Tầng Frontend giao tiếp với Rust Core thông qua các lệnh Tauri `invoke`:

```typescript
// Các hàm invoke khả dụng trên Frontend:
invoke<CapabilitiesResponse>("get_capabilities");
invoke<SystemSnapshotResponse>("get_system_snapshot");
invoke<ScanResponse>("start_scan", { options: ScanOptions });
invoke<CleanResponse>("execute_clean", { payload: CleanPayload });
invoke<AppsListResponse>("get_installed_apps", { filter: AppFilterOptions });
invoke<SpaceLensResponse>("analyze_space_lens", { path: string, maxDepth?: number });
```

---

## 2. Định nghĩa DTO & TypeScript Interfaces

### 2.1. Phản hồi Năng lực Hệ thống (`get_capabilities`)

```typescript
export interface CapabilitiesResponse {
  protocol_version: "1.0";
  platform: "macos" | "windows";
  architecture: "arm64" | "x86_64";
  os_version: string;
  has_full_disk_access: boolean;
  capabilities: {
    telemetry: boolean;
    smart_scan: boolean;
    system_clean: boolean;
    app_uninstaller: boolean;
    orphan_scan: boolean;
    space_lens: boolean;
    menu_bar_monitor: boolean;
  };
}
```

### 2.2. Dữ liệu Giám sát Hệ thống (`get_system_snapshot`)

```typescript
export interface SystemSnapshotResponse {
  protocol_version: "1.0";
  platform: "macos";
  timestamp: number; // Unix timestamp tính bằng giây
  cpu: {
    usage_percent: number;      // 0.0 - 100.0%
    user_percent: number;
    system_percent: number;
    idle_percent: number;
    core_count: number;
    history: number[];          // Mảng 10 - 20 điểm mẫu gần nhất phục vụ vẽ sparkline
  };
  ram: {
    total_bytes: number;
    used_bytes: number;
    free_bytes: number;
    active_bytes: number;
    wired_bytes: number;
    compressed_bytes: number;
    pressure_level: "normal" | "warning" | "critical";
  };
  disk: {
    total_bytes: number;
    free_bytes: number;
    used_bytes: number;
    available_bytes: number;    // Bao gồm purgeable
    purgeable_bytes: number;
    mount_point: string;        // Mặc định: "/"
  };
  battery: {
    has_battery: boolean;       // false đối với Mac mini, Mac Studio, Mac Pro, iMac
    percentage?: number;        // 0 - 100
    is_charging?: boolean;
    power_watts?: number;       // Công suất sạc/tiêu thụ (W)
    cycle_count?: number;
    health_percent?: number;
  };
}
```

### 2.3. Dữ liệu Kết quả Quét Rác (`start_scan`)

```typescript
export type JunkCategoryType = 
  | "user_caches" 
  | "system_logs" 
  | "xcode_derived_data" 
  | "mail_downloads" 
  | "trash_bin" 
  | "orphan_residues";

export interface JunkItem {
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
  fda_limited_categories: JunkCategoryType[]; // Các nhóm bị bỏ qua do thiếu quyền
}
```

### 2.4. Khế ước Yêu cầu Dọn dẹp (`execute_clean`)

```typescript
export interface CleanPayload {
  scan_id: string;
  item_ids: string[]; // Danh sách ID tệp được người dùng chọn dọn dẹp
  confirm_direct_delete: boolean; // Bắt buộc true để xác nhận hiểu chính sách xóa
}

export interface CleanFileResult {
  path: string;
  status: "success" | "skipped" | "permission_denied" | "file_in_use";
  freed_bytes: number;
  error_message?: string;
}

export interface CleanResponse {
  total_freed_bytes: number;
  success_count: number;
  failure_count: number;
  duration_ms: number;
  details: CleanFileResult[];
}
```

### 2.5. Khế ước Dữ liệu Gỡ Cài đặt Ứng dụng (`get_installed_apps`)

```typescript
export interface AssociatedFile {
  path: string;
  file_type: "bundle" | "app_support" | "cache" | "preferences" | "saved_state" | "logs";
  size_bytes: number;
  is_essential: boolean; // Nếu là bundle .app thì true
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
  is_system_protected: boolean; // SIP / Apple default -> true (Khóa gỡ)
  is_self_app: boolean;         // VXClean -> true (Khóa tự gỡ)
  associated_files: AssociatedFile[];
}

export interface AppsListResponse {
  apps: InstalledApp[];
  total_apps: number;
}
```

### 2.6. Khế ước Dữ liệu Space Lens (`analyze_space_lens`)

```typescript
export interface SpaceLensNode {
  name: string;
  path: string;
  size_bytes: number;
  is_directory: boolean;
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

Rust Host thực thi binary bản địa bằng Command Line với argv định danh:

| Câu lệnh CLI | Tham số (Arguments) | stdout JSON Format | Timeout |
| :--- | :--- | :--- | :--- |
| `vxclean_engine metrics` | Không tham số | `SystemSnapshotResponse` | 5000ms |
| `vxclean_engine scan` | `--all` hoặc `--category <name>` | `ScanResponse` | 30000ms |
| `vxclean_engine clean` | `--stdin` (Nhận danh sách path qua stdin pipe) | `CleanResponse` | 60000ms |
| `vxclean_engine apps` | `--include-residuals` | `AppsListResponse` | 20000ms |
| `vxclean_engine lens` | `--path <dir> --depth <n>` | `SpaceLensResponse` | 45000ms |

### Quy chuẩn Xử lý Lỗi CLI:
- Nếu subprocess trả về exit code khác 0, toàn bộ nội dung trong `stderr` được Rust bắt lại, đóng gói thành đối tượng lỗi:
```json
{
  "status": "error",
  "code": "ENGINE_EXECUTION_FAILED",
  "message": "Nội dung chi tiết từ stderr",
  "timestamp": 1728302400
}
```
