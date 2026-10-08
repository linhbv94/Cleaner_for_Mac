pub mod engine_bridge;
pub mod models;

pub use engine_bridge::*;
pub use models::*;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            engine_bridge::get_capabilities,
            engine_bridge::get_system_snapshot,
        ])
        .run(tauri::generate_context!())
        .expect("Lỗi khi khởi chạy ứng dụng Tauri VXClean");
}
