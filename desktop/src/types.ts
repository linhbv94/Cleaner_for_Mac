export interface FeatureCapabilities {
  system_monitor: boolean;
  smart_scan: boolean;
  cleanup: boolean;
  uninstaller: boolean;
  space_lens: boolean;
  menu_bar_monitor: boolean;
  orphans?: boolean;
}

export interface Capabilities {
  platform: string;
  has_native_engine: boolean;
  can_monitor_system: boolean;
  features: FeatureCapabilities;
  engine_status: string;
  has_full_disk_access?: boolean;
}

export interface CpuMetrics {
  usage: number;
  history: number[];
}

export interface MemoryMetrics {
  used_bytes: number;
  total_bytes: number;
  active_bytes: number;
  wired_bytes: number;
  compressed_bytes: number;
  fraction: number;
}

export interface DiskMetrics {
  used_bytes: number;
  total_bytes: number;
  available_bytes: number;
  fraction: number;
}

export interface BatteryMetrics {
  has_battery: boolean;
  charge_percent: number;
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
  protocol_version: string;
  platform: string;
  timestamp: string;
  metrics: MetricsData;
}

export type TabId = 'dashboard' | 'smart_scan' | 'cleanup' | 'uninstaller' | 'orphans' | 'space_lens';

// --- Smart Scan & System Cleaner Types ---

export type JunkCategoryType =
  | 'chrome'
  | 'media_apps'
  | 'system_junk'
  | 'ai_apps'
  | 'large_files'
  | 'xcode_junk'
  | 'brew_cache'
  | 'node_cache'
  | 'docker_cache'
  | 'user_caches'
  | 'system_logs'
  | 'xcode_derived_data'
  | 'xcode_archives'
  | 'mail_downloads'
  | 'trash_bin'
  | 'orphan_residues';

export interface JunkItem {
  store_size_bytes?: number;
  rule_id?: string;
  safety_level?: 'rebuildable' | 'user_data' | 'unknown' | 'protected';
  consequence_vi?: string;
  blocked_reason?: string;
  requires_app_quit?: boolean;
  app_bundle_ids?: string[];
  conditions?: string[];
  is_cleanable?: boolean;
  id: string;
  path: string;
  name: string;
  size_bytes: number;
  category: JunkCategoryType;
  requires_admin: boolean;
  deletion_method: 'trash' | 'remove_item' | 'admin_shell' | 'pnpm_prune';
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
  excluded_items?: JunkItem[];
  fda_limited_categories: JunkCategoryType[];
  timed_out_categories?: JunkCategoryType[];
  is_partial?: boolean;
  unsupported_cache_paths?: string[];
}

export interface ScanProgressEvent {
  current_category: string;
  current_path: string;
  progress_fraction: number;
  scanned_bytes: number;
}

export interface CleanTargetItem {
  path: string;
  deletion_method: 'trash' | 'remove_item' | 'admin_shell' | 'pnpm_prune';
}

export interface CleanPayload {
  scan_id: string;
  targets: CleanTargetItem[];
  confirm_direct_delete: boolean;
}

export interface CleanFileResult {
  path: string;
  status: 'success' | 'skipped' | 'permission_denied' | 'file_in_use' | 'outcome_unknown';
  affected_bytes: number;
  method_used: 'trash' | 'remove_item' | 'admin_shell' | 'pnpm_prune';
  error_message?: string;
}

export interface CleanResponse {
  permanently_freed_bytes: number;
  trashed_bytes: number;
  total_affected_bytes: number;
  success_count: number;
  failure_count: number;
  duration_ms: number;
  details: CleanFileResult[];
}

export interface CleanProgressEvent {
  current_item: string;
  progress_fraction: number;
  trashed_bytes: number;
  freed_bytes: number;
}

// --- App Uninstaller Types ---

export interface AssociatedFile {
  path: string;
  file_type: 'bundle' | 'app_support' | 'cache' | 'preferences' | 'saved_state' | 'logs' | 'container' | 'app_scripts' | 'discovered';
  size_bytes: number;
  is_essential: boolean;
  is_selected_by_default?: boolean;
  discovery_reason?: string;
  deletion_method: 'trash' | 'remove_item' | 'admin_shell' | 'pnpm_prune';
}

export interface InstalledApp {
  id: string;
  name: string;
  bundle_id: string;
  version: string;
  bundle_path: string;
  icon_path?: string;
  architectures: ('arm64' | 'x86_64')[];
  total_size_bytes: number;
  is_system_protected: boolean;
  is_self_app: boolean;
  associated_files: AssociatedFile[];
}

export interface AppsListResponse {
  apps: InstalledApp[];
  total_apps: number;
  discovery_incomplete?: boolean;
}

export interface UninstallPayload {
  app_id: string;
  selected_paths: string[];
  allow_admin_fallback: boolean;
}

// --- Space Lens Types ---

export interface LensProgressEvent {
  current_path: string;
  scanned_bytes: number;
  item_count: number;
}

export interface SpaceLensNode {
  can_trash?: boolean;
  name: string;
  path: string;
  size_bytes: number;
  is_directory: boolean;
  is_package: boolean;
  is_access_denied: boolean;
  children?: SpaceLensNode[];
  item_count?: number;
}

export interface SpaceLensResponse {
  is_partial?: boolean;
  lens_id?: string;
  root_path: string;
  total_analyzed_bytes: number;
  root_node: SpaceLensNode;
}

// --- Orphan Residual Files Types ---

export interface OrphanResidualItem {
  id: string;
  path: string;
  size_bytes: number;
  residual_type: 'app_support' | 'cache' | 'preferences' | 'logs';
  is_safe_candidate: boolean;
}

export interface OrphanAppGroup {
  id: string;
  original_app_name: string;
  bundle_id_guess?: string;
  last_modified?: string;
  total_size_bytes: number;
  items: OrphanResidualItem[];
}

export interface OrphansResponse {
  orphans: OrphanAppGroup[];
  total_bytes: number;
  total_count: number;
}
