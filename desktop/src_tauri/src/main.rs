// Ngăn chặn cửa sổ console xuất hiện trên Windows trong bản release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    vxclean_lib::run();
}
