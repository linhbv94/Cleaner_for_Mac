//! Public filesystem access probe. Never queries/modifies TCC or reads probe contents.
use serde_json::{json, Value};
use std::{
    io,
    path::{Path, PathBuf},
};
fn outcome(result: io::Result<std::fs::File>) -> &'static str {
    match result {
        Ok(handle) => {
            drop(handle);
            "access_confirmed"
        }
        Err(error)
            if error.kind() == io::ErrorKind::PermissionDenied
                || matches!(error.raw_os_error(), Some(1 | 13)) =>
        {
            "restricted"
        }
        Err(_) => "unverified",
    }
}
fn bundle_path(exe: &Path) -> Option<PathBuf> {
    let macos = exe.parent()?;
    let contents = macos.parent()?;
    let bundle = contents.parent()?;
    (macos.file_name()? == "MacOS"
        && contents.file_name()? == "Contents"
        && bundle.extension()? == "app")
        .then(|| bundle.to_path_buf())
}
fn signing_kind(text: &str) -> &'static str {
    if text.contains("designated => cdhash ") {
        "ad_hoc"
    } else if text.contains("designated =>") && (text.contains("anchor H\"") || text.contains("certificate leaf = H\"") || (text.contains("anchor apple generic") && text.contains("certificate"))) {
        "stable_certificate"
    } else {
        "unknown"
    }
}
pub fn status() -> Value {
    #[cfg(target_os = "macos")]
    {
        let executable = std::env::current_exe().ok();
        let bundle = executable.as_deref().and_then(bundle_path);
        let signing = bundle
            .as_ref()
            .and_then(|path| {
                std::process::Command::new("/usr/bin/codesign")
                    .args(["-d", "-r-"])
                    .arg(path)
                    .output()
                    .ok()
            })
            .filter(|out| out.status.success())
            .map(|out| signing_kind(&format!("{}{}",String::from_utf8_lossy(&out.stdout),String::from_utf8_lossy(&out.stderr))))
            .unwrap_or("unknown");
        let access = std::env::var_os("HOME")
            .map(PathBuf::from)
            .map(|home| {
                outcome(std::fs::File::open(
                    home.join("Library/Application Support/com.apple.TCC/TCC.db"),
                ))
            })
            .unwrap_or("unverified");
        json!({"platform":"macos","status":access,"evidence":"protected_read_probe","app_bundle_path":bundle,"signing_kind":signing,"version":env!("CARGO_PKG_VERSION")})
    }
    #[cfg(not(target_os = "macos"))]
    {
        json!({"platform":std::env::consts::OS,"status":"not_required","evidence":"platform_not_applicable","app_bundle_path":null,"signing_kind":"not_applicable","version":env!("CARGO_PKG_VERSION")})
    }
}
/// Preserve guidance location even if the isolated access worker cannot complete.
pub fn unverified_status(detail:String)->Value{
    json!({"platform":std::env::consts::OS,"status":"unverified","evidence":"probe_failed","app_bundle_path":std::env::current_exe().ok().as_deref().and_then(bundle_path),"signing_kind":"unknown","version":env!("CARGO_PKG_VERSION"),"detail":detail})
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn permission_errors_are_not_success() {
        assert_eq!(outcome(Err(io::Error::from_raw_os_error(1))), "restricted");
        assert_eq!(outcome(Err(io::Error::from_raw_os_error(13))), "restricted");
        assert_eq!(outcome(Err(io::Error::from_raw_os_error(2))), "unverified");
    }
    #[test]
    fn probe_does_not_read_or_modify_fixture() {
        let path = std::env::temp_dir().join(format!(
            "vxclean_access_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::write(&path, b"private fixture unchanged").unwrap();
        assert_eq!(outcome(std::fs::File::open(&path)), "access_confirmed");
        assert_eq!(std::fs::read(&path).unwrap(), b"private fixture unchanged");
        std::fs::remove_file(path).unwrap();
    }
    #[test]
    fn signing_identity_distinguishes_binary_hash_from_certificate() {
        assert_eq!(signing_kind("designated => cdhash H\"123\""), "ad_hoc");
        assert_eq!(
            signing_kind("designated => identifier app and certificate leaf = H\"123\""),
            "stable_certificate"
        );
        assert_eq!(signing_kind("designated => identifier app"), "unknown");
    }
    #[test]
    fn weak_identifier_only_or_unbound_certificate_is_not_stable() {
        assert_eq!(signing_kind("designated => identifier app and certificate leaf exists"),"unknown");
        assert_eq!(signing_kind("designated => identifier app and anchor H\"123\""),"stable_certificate");
    }
    #[test]
    fn bundle_path_uses_current_running_app() {
        assert_eq!(
            bundle_path(Path::new(
                "/Applications/VXClean.app/Contents/MacOS/vxclean"
            )),
            Some(PathBuf::from("/Applications/VXClean.app"))
        );
        assert!(bundle_path(Path::new("/tmp/vxclean")).is_none());
    }
}
