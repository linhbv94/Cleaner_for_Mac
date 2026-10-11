fn main() {
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("macos") {
        let root = std::path::PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap()).join("../..");
        let files = [
            "MClean/Services/ScanEngine.swift", "MClean/Models/Models.swift", "MClean/Logic/Utilities/Logger.swift", "MClean/Logic/Utilities/FileSize.swift",
            "desktop/native/app_lifecycle.swift", "desktop/native/operation_journal.swift", "desktop/native/cleanup_policy.swift", "desktop/native/compact_lens_scanner.swift", "desktop/native/main.swift", "desktop/native/maintenance_cli.swift", "desktop/native/manager_cleanup.swift",
            "MClean/Services/SystemMonitor.swift", "MClean/Services/SpaceLensEngine.swift",
            "MClean/Models/SpaceLensNode.swift", "MClean/Logic/Scanning/Conditions.swift",
            "MClean/Logic/Scanning/StringNormalization.swift", "MClean/Logic/Utilities/OrphanSafetyPolicy.swift",
        ];
        let out = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap());
        let binary = out.join("vxclean_engine");
        let cache = out.join("swift_module_cache");
        std::fs::create_dir_all(&cache).unwrap();
        let mut command = std::process::Command::new("/usr/bin/xcrun");
        command.args(["--sdk", "macosx", "swiftc", "-O", "-parse-as-library", "-sdk"]);
        let sdk = std::process::Command::new("/usr/bin/xcrun").args(["--sdk", "macosx", "--show-sdk-path"]).output().expect("Không tìm thấy macOS SDK");
        assert!(sdk.status.success(), "Không tìm thấy macOS SDK");
        command.arg(String::from_utf8(sdk.stdout).unwrap().trim());
        let arch = if std::env::var("CARGO_CFG_TARGET_ARCH").as_deref() == Ok("aarch64") { "arm64" } else { "x86_64" };
        command.args(["-target", &format!("{arch}-apple-macos13.0"), "-module-cache-path"]).arg(cache);
        for file in files {
            let path = root.join(file);
            println!("cargo:rerun-if-changed={}", path.display());
            command.arg(path);
        }
        let output = command.arg("-o").arg(&binary).output().expect("Không khởi chạy được Swift compiler");
        assert!(output.status.success(), "Swift engine build thất bại: {}", String::from_utf8_lossy(&output.stderr));
        let next = root.join("desktop/native/vxclean_engine_next");
        std::fs::copy(binary, &next).expect("Không cập nhật được engine resource");
        std::fs::rename(next, root.join("desktop/native/vxclean_engine")).expect("Không thay engine resource atomically");
    }
    tauri_build::build()
}
