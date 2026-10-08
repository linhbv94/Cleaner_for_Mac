use crate::models::{Capabilities, FeatureCapabilities, SystemSnapshot};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::Duration;
use tauri::{AppHandle, Manager};

/// Truy vấn năng lực hệ thống hiện tại của ứng dụng.
/// Quyết định giao diện kích hoạt chức năng nào theo nền tảng thực tế.
#[tauri::command]
pub fn get_capabilities() -> Capabilities {
    let is_macos = cfg!(target_os = "macos");
    Capabilities {
        platform: std::env::consts::OS.to_string(),
        has_native_engine: is_macos,
        can_monitor_system: is_macos,
        features: FeatureCapabilities {
            system_monitor: is_macos,
            smart_scan: false,
            cleanup: false,
            uninstaller: false,
            space_lens: false,
            menu_bar_monitor: false,
        },
        engine_status: if is_macos {
            "Swift native engine sẵn sàng (macOS)".to_string()
        } else {
            "Chưa hỗ trợ nền tảng này (Windows adapter đang trong lộ trình)".to_string()
        },
    }
}

#[cfg(target_os = "macos")]
fn resolve_engine_path(app: &AppHandle) -> Result<PathBuf, String> {
    // 1. Kiểm tra trong tài nguyên đóng gói của ứng dụng (Tauri Resource Directory)
    if let Ok(resource_dir) = app.path().resource_dir() {
        let path = resource_dir.join("vxclean_engine");
        if path.is_file() {
            return Ok(path);
        }
    }

    // 2. Chế độ phát triển nội bộ cục bộ (chỉ kích hoạt khi debug_assertions bật)
    #[cfg(debug_assertions)]
    {
        let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let dev_path = manifest_dir.join("../native/vxclean_engine");
        if dev_path.is_file() {
            if let Ok(canonical) = dev_path.canonicalize() {
                return Ok(canonical);
            }
            return Ok(dev_path);
        }
    }

    Err("Không tìm thấy tệp nhị phân vxclean_engine trong app resources.".to_string())
}

/// Lấy snapshot viễn trắc hệ thống thật từ Swift native engine.
/// Chặn tuyệt đối shell injection: chỉ chấp nhận gọi tệp thực thi định danh với argv cố định ["metrics"].
#[tauri::command]
pub async fn get_system_snapshot(app: AppHandle) -> Result<SystemSnapshot, String> {
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        Err("Chức năng giám sát hệ thống bằng Swift native engine hiện chỉ hỗ trợ macOS. Windows adapter đang trong lộ trình phát triển.".to_string())
    }

    #[cfg(target_os = "macos")]
    {
        let engine_path = resolve_engine_path(&app)?;

        // Chạy tiến trình con trong worker thread riêng để không block luồng chính
        let task = tokio::task::spawn_blocking(move || {
            let mut child = Command::new(&engine_path)
                .arg("metrics")
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .map_err(|e| format!("Không thể khởi tạo tiến trình Swift engine: {e}"))?;

            let start_time = std::time::Instant::now();
            let timeout = Duration::from_secs(6);

            loop {
                match child.try_wait() {
                    Ok(Some(status)) => {
                        let output = child
                            .wait_with_output()
                            .map_err(|e| format!("Lỗi khi thu thập kết quả engine: {e}"))?;

                        if !status.success() {
                            let stderr_text = String::from_utf8_lossy(&output.stderr);
                            return Err(format!("Swift engine kết thúc với lỗi (mã {status}): {stderr_text}"));
                        }

                        let stdout_text = String::from_utf8_lossy(&output.stdout);
                        let snapshot: SystemSnapshot = serde_json::from_str(&stdout_text)
                            .map_err(|e| format!("Lỗi phân giải JSON từ engine: {e} | Dữ liệu nhận: {stdout_text}"))?;

                        // Xác thực protocol_version và platform trước khi trả về
                        if snapshot.protocol_version != "1.0" {
                            return Err(format!(
                                "Phiên bản giao thức không khớp: kỳ vọng '1.0', nhận '{}'",
                                snapshot.protocol_version
                            ));
                        }
                        if snapshot.platform != "macos" {
                            return Err(format!(
                                "Nền tảng viễn trắc không khớp: kỳ vọng 'macos', nhận '{}'",
                                snapshot.platform
                            ));
                        }

                        return Ok(snapshot);
                    }
                    Ok(None) => {
                        if start_time.elapsed() > timeout {
                            let _ = child.kill();
                            let _ = child.wait(); // reap zombie process
                            return Err("Quá thời gian chờ phản hồi từ Swift engine (timeout 6 giây). Đã hủy tiến trình.".to_string());
                        }
                        std::thread::sleep(Duration::from_millis(50));
                    }
                    Err(e) => {
                        let _ = child.kill();
                        let _ = child.wait(); // reap zombie process
                        return Err(format!("Lỗi thăm dò trạng thái tiến trình: {e}"));
                    }
                }
            }
        });

        match task.await {
            Ok(result) => result,
            Err(e) => Err(format!("Lỗi luồng bất đồng bộ: {e}")),
        }
    }
}
