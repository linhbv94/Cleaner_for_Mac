use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureCapabilities {
    pub system_monitor: bool,
    pub smart_scan: bool,
    pub cleanup: bool,
    pub uninstaller: bool,
    pub space_lens: bool,
    pub menu_bar_monitor: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Capabilities {
    pub platform: String,
    pub has_native_engine: bool,
    pub can_monitor_system: bool,
    pub features: FeatureCapabilities,
    pub engine_status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuMetrics {
    pub usage: f64,
    pub history: Vec<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryMetrics {
    pub used_bytes: i64,
    pub total_bytes: i64,
    pub active_bytes: i64,
    pub wired_bytes: i64,
    pub compressed_bytes: i64,
    pub fraction: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskMetrics {
    pub used_bytes: i64,
    pub total_bytes: i64,
    pub available_bytes: i64,
    pub fraction: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatteryMetrics {
    pub has_battery: bool,
    pub charge_percent: i32,
    pub is_charging: bool,
    pub is_ac_powered: bool,
    pub is_charged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsData {
    pub cpu: CpuMetrics,
    pub memory: MemoryMetrics,
    pub disk: DiskMetrics,
    pub battery: BatteryMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemSnapshot {
    pub protocol_version: String,
    pub platform: String,
    pub timestamp: String,
    pub metrics: MetricsData,
}
