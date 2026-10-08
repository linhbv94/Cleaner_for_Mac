export interface FeatureCapabilities {
  system_monitor: boolean;
  smart_scan: boolean;
  cleanup: boolean;
  uninstaller: boolean;
  space_lens: boolean;
  menu_bar_monitor: boolean;
}

export interface Capabilities {
  platform: string;
  has_native_engine: boolean;
  can_monitor_system: boolean;
  features: FeatureCapabilities;
  engine_status: string;
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

export type TabId = 'dashboard' | 'smart_scan' | 'cleanup' | 'uninstaller' | 'space_lens';
