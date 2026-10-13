// Ngăn chặn cửa sổ console xuất hiện trên Windows trong bản release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if !vxclean_lib::run_access_cli() && !vxclean_lib::run_lens_cli(){vxclean_lib::run();}
}
