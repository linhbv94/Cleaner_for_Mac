//! Portable full-tree metadata. File contents and link targets are never read.
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::{Path, PathBuf},
    sync::atomic::{AtomicBool, Ordering},
    time::{Duration, Instant},
};
const DIRECTORY: u8 = 1;
const PACKAGE: u8 = 2;
const DENIED: u8 = 4;
const PARTIAL: u8 = 8;
const TRASH: u8 = 16;
/// Compact wire/storage row: name, parent index, allocated/logical bytes, flags.
#[derive(Serialize, Deserialize)]
struct Entry(String, usize, u64, u8);
#[derive(Serialize, Deserialize)]
pub struct TreeSnapshot {
    pub root_path: PathBuf,
    size_kind: String,
    nodes: Vec<Entry>,
    #[serde(skip)]
    children: Vec<Vec<usize>>,
    #[serde(skip)]
    directories: HashMap<PathBuf, usize>,
    #[serde(skip)]
    directory_paths: HashMap<usize, PathBuf>,
}
impl TreeSnapshot {
    pub fn index(&mut self) -> Result<(), String> {
        if self.nodes.is_empty() {
            return Err("Empty lens snapshot".into());
        }
        self.children = vec![Vec::new(); self.nodes.len()];
        self.directories.clear();
        self.directory_paths.clear();
        self.directory_paths.insert(0, self.root_path.clone());
        self.directories.insert(self.root_path.clone(), 0);
        for index in 1..self.nodes.len() {
            let row = &self.nodes[index];
            if row.1 >= index
                || row.0.is_empty()
                || Path::new(&row.0).components().count() != 1
                || row.0 == "."
                || row.0 == ".."
            {
                return Err("Invalid lens parent/name".into());
            }
            let parent = self
                .directory_paths
                .get(&row.1)
                .ok_or("Missing lens directory")?;
            self.children[row.1].push(index);
            if row.3 & DIRECTORY != 0 {
                let path = parent.join(&row.0);
                self.directories.insert(path.clone(), index);
                self.directory_paths.insert(index, path);
            }
        }
        for rows in &mut self.children {
            rows.sort_by_key(|&i| std::cmp::Reverse(self.nodes[i].2));
        }
        Ok(())
    }
    fn node(&self, index: usize, path: &Path) -> Value {
        let row = &self.nodes[index];
        json!({"name":row.0,"path":path,"size_bytes":row.2,"is_directory":row.3&DIRECTORY!=0,"is_package":row.3&PACKAGE!=0,"is_access_denied":row.3&DENIED!=0,"is_partial":row.3&(DENIED|PARTIAL)!=0,"can_trash":row.3&TRASH!=0 && row.3&(DENIED|PARTIAL)==0,"children_complete":true,"item_count":self.children[index].len()})
    }
    pub fn response(&self, path: &str, ticket: &str) -> Option<Value> {
        let &index = self.directories.get(Path::new(path))?;
        let mut node = self.node(index, Path::new(path));
        node["children"] = json!(self.children[index]
            .iter()
            .map(|&i| self.node(i, &Path::new(path).join(&self.nodes[i].0)))
            .collect::<Vec<_>>());
        Some(
            json!({"root_path":path,"scan_root_path":self.root_path,"root_node":node,"total_analyzed_bytes":self.nodes[index].2,"is_partial":self.nodes[index].3&(DENIED|PARTIAL)!=0,"lens_id":ticket,"size_kind":self.size_kind,"retained_nodes":self.nodes.len()}),
        )
    }
}
struct Scanner<'a, F: FnMut(Value)> {
    cancel: &'a AtomicBool,
    progress: F,
    count: usize,
    bytes: u64,
    last: Instant,
    seen: HashSet<(u64, u64)>,
}
impl<F: FnMut(Value)> Scanner<'_, F> {
    fn check(&self) -> Result<(), String> {
        if self.cancel.load(Ordering::SeqCst) {
            Err("Đã hủy quét".into())
        } else {
            Ok(())
        }
    }
    fn directory_progress(&mut self, path: &Path) {
        (self.progress)(
            json!({"current_path":path,"scanned_bytes":self.bytes,"item_count":self.count}),
        );
    }
    fn size(&mut self, path: &Path, m: &fs::Metadata) -> u64 {
        #[cfg(unix)]
        let size = {
            use std::os::unix::fs::MetadataExt;
            if m.is_file() && m.nlink() > 1 && !self.seen.insert((m.dev(), m.ino())) {
                0
            } else {
                m.blocks().saturating_mul(512)
            }
        };
        #[cfg(not(unix))]
        let size = m.len();
        self.count += 1;
        self.bytes = self.bytes.saturating_add(size);
        if self.last.elapsed() >= Duration::from_millis(100) {
            self.last = Instant::now();
            self.directory_progress(path)
        }
        size
    }
    fn total(&mut self, root: &Path) -> Result<(u64, bool), String> {
        let mut stack = vec![root.to_path_buf()];
        let mut size = 0;
        let mut partial = false;
        while let Some(path) = stack.pop() {
            self.check()?;
            self.directory_progress(&path);
            let entries = match fs::read_dir(path) {
                Ok(v) => v,
                Err(_) => {
                    partial = true;
                    continue;
                }
            };
            for entry in entries {
                self.check()?;
                let path = match entry {
                    Ok(e) => e.path(),
                    Err(_) => {
                        partial = true;
                        continue;
                    }
                };
                match fs::symlink_metadata(&path) {
                    Ok(m) if m.is_dir() && !is_link(&m) => stack.push(path),
                    Ok(m) => size += self.size(&path, &m),
                    Err(_) => partial = true,
                }
            }
        }
        Ok((size, partial))
    }
    fn scan(&mut self, root: PathBuf) -> Result<TreeSnapshot, String> {
        let mut nodes = vec![Entry(
            root.file_name()
                .unwrap_or(root.as_os_str())
                .to_string_lossy()
                .into_owned(),
            0,
            0,
            DIRECTORY,
        )];
        let mut pending = vec![(root.clone(), 0)];
        let home =
            std::env::var_os(if cfg!(windows) { "USERPROFILE" } else { "HOME" }).map(PathBuf::from);
        while let Some((parent, index)) = pending.pop() {
            self.check()?;
            self.directory_progress(&parent);
            let entries = match fs::read_dir(&parent) {
                Ok(entries) => entries,
                Err(_) => {
                    nodes[index].3 |= DENIED | PARTIAL;
                    continue;
                }
            };
            for entry in entries {
                self.check()?;
                let entry = match entry {
                    Ok(e) => e,
                    Err(_) => {
                        nodes[index].3 |= PARTIAL;
                        continue;
                    }
                };
                let path = entry.path();
                let mut flags = 0;
                let mut size = 0;
                match fs::symlink_metadata(&path) {
                    Ok(m) => {
                        let directory = m.is_dir() && !is_link(&m);
                        let package = cfg!(target_os = "macos")
                            && directory
                            && path.extension().is_some_and(|e| {
                                [
                                    "app",
                                    "bundle",
                                    "framework",
                                    "photoslibrary",
                                    "photolibrary",
                                    "pkg",
                                ]
                                .iter()
                                .any(|x| e == *x)
                            });
                        let candidate = cfg!(target_os = "macos")
                            && !is_link(&m)
                            && (m.is_file() || m.is_dir())
                            && home
                                .as_ref()
                                .and_then(|h| path.strip_prefix(h).ok())
                                .and_then(|p| p.components().next())
                                .is_some_and(|c| {
                                    let first = c.as_os_str().to_string_lossy();
                                    !first.starts_with('.')
                                        && first != "Library"
                                        && first != "Applications"
                                });
                        if candidate {
                            flags |= TRASH
                        }
                        if package {
                            flags |= PACKAGE;
                            let result = self.total(&path)?;
                            size = result.0;
                            if result.1 {
                                flags |= PARTIAL
                            }
                        } else if directory {
                            flags |= DIRECTORY;
                            pending.push((path, nodes.len()))
                        } else {
                            size = self.size(&path, &m)
                        }
                    }
                    Err(_) => flags |= DENIED | PARTIAL,
                }
                nodes.push(Entry(
                    entry.file_name().to_string_lossy().into_owned(),
                    index,
                    size,
                    flags,
                ));
            }
        }
        // Parent indices always precede descendants. No recursion/depth cutoff.
        for i in (1..nodes.len()).rev() {
            let p = nodes[i].1;
            nodes[p].2 = nodes[p].2.saturating_add(nodes[i].2);
            if nodes[i].3 & (DENIED | PARTIAL) != 0 {
                nodes[p].3 |= PARTIAL
            }
        }
        Ok(TreeSnapshot {
            root_path: root,
            size_kind: if cfg!(unix) { "allocated" } else { "logical" }.into(),
            nodes,
            children: Vec::new(),
            directories: HashMap::new(),
            directory_paths: HashMap::new(),
        })
    }
}
fn is_link(m: &fs::Metadata) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        m.file_attributes() & 0x400 != 0
    }
    #[cfg(not(windows))]
    {
        m.file_type().is_symlink()
    }
}
pub fn scan(
    path: PathBuf,
    cancel: &AtomicBool,
    progress: impl FnMut(Value),
) -> Result<TreeSnapshot, String> {
    let text = path.to_string_lossy();
    let path = if text == "~" || text.starts_with("~/") || text.starts_with("~\\") {
        PathBuf::from(
            std::env::var_os(if cfg!(windows) { "USERPROFILE" } else { "HOME" })
                .ok_or("Không tìm thấy thư mục người dùng")?,
        )
        .join(text.get(2..).unwrap_or(""))
    } else {
        path
    };
    let root = fs::canonicalize(path).map_err(|e| e.to_string())?;
    if !root.is_dir() {
        return Err("Thư mục không tồn tại".into());
    }
    #[cfg(all(unix, not(test)))]
    if [
        "/", "/System", "/Library", "/private", "/usr", "/bin", "/sbin", "/etc",
    ]
    .iter()
    .any(|p| root == Path::new(p) || (p != &"/" && root.starts_with(p)))
    {
        return Err("Chọn thư mục dữ liệu; không quét vùng hệ thống".into());
    }
    Scanner {
        cancel,
        progress,
        count: 0,
        bytes: 0,
        last: Instant::now(),
        seen: HashSet::new(),
    }
    .scan(root)
}
#[cfg(test)]
mod tests {
    use super::*;
    fn fixture() -> PathBuf {
        std::env::temp_dir().join(format!(
            "vxclean_lens_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ))
    }
    #[test]
    fn retains_tree_without_reading_contents() {
        let root = fixture();
        fs::create_dir_all(root.join("child/deep")).unwrap();
        fs::write(root.join("child/deep/file"), vec![7; 8192]).unwrap();
        let mut tree = scan(root.clone(), &AtomicBool::new(false), |_| {}).unwrap();
        tree.index().unwrap();
        let root = tree.root_path.clone();
        let child = root.join("child/deep");
        fs::write(child.join("new_after_scan"), vec![9; 4096]).unwrap();
        let response = tree.response(child.to_str().unwrap(), "proof").unwrap();
        assert_eq!(
            response["root_node"]["children"].as_array().unwrap().len(),
            1
        );
        assert_eq!(response["root_node"]["children"][0]["name"], "file");
        assert!(tree
            .response(root.join("outside").to_str().unwrap(), "proof")
            .is_none());
        let mut new_tree = scan(root.clone(), &AtomicBool::new(false), |_| {}).unwrap();
        new_tree.index().unwrap();
        assert_eq!(
            new_tree.response(child.to_str().unwrap(), "new").unwrap()["root_node"]["children"]
                .as_array()
                .unwrap()
                .len(),
            2
        );
        assert!(scan(root.clone(), &AtomicBool::new(true), |_| {}).is_err());
        fs::remove_dir_all(root).unwrap();
    }
    #[test]
    fn retains_more_than_fifty_thousand_nodes_and_deep_folders() {
        // Compact synthetic metadata proves index/query is not capped; filesystem fixture is tested separately.
        let mut nodes = vec![
            Entry("root".into(), 0, 0, DIRECTORY),
            Entry("large".into(), 0, 0, DIRECTORY),
        ];
        for i in 0..50_100 {
            nodes.push(Entry(format!("file_{i}"), 1, 4096, 0));
        }
        let mut parent = 1;
        for depth in 0..100 {
            let index = nodes.len();
            nodes.push(Entry(format!("depth_{depth}"), parent, 0, DIRECTORY));
            parent = index;
        }
        let mut tree = TreeSnapshot {
            root_path: PathBuf::from("/root"),
            size_kind: "allocated".into(),
            nodes,
            children: vec![],
            directories: HashMap::new(),
            directory_paths: HashMap::new(),
        };
        tree.index().unwrap();
        assert_eq!(
            tree.response("/root/large", "test").unwrap()["root_node"]["children"]
                .as_array()
                .unwrap()
                .len(),
            50_101
        );
        let deep = tree.directory_paths[&parent].to_string_lossy();
        assert!(tree.response(&deep, "test").is_some());
        let wire = serde_json::to_vec(&tree).unwrap();
        let mut decoded: TreeSnapshot = serde_json::from_slice(&wire).unwrap();
        decoded.index().unwrap();
        assert!(decoded.response(&deep, "test").is_some());
    }
    #[test]
    fn filesystem_beyond_previous_node_limit() {
        struct Owned(PathBuf);impl Drop for Owned {fn drop(&mut self){let _=fs::remove_dir_all(&self.0);}}
        let root=fixture();let _owned=Owned(root.clone());
        fs::create_dir_all(root.join("large/leaf")).unwrap();fs::create_dir_all(root.join("sibling/deep")).unwrap();
        for i in 0..50_050 {fs::File::create(root.join(format!("large/leaf/file_{i}"))).unwrap();}
        fs::write(root.join("sibling/deep/marker"),vec![1;8192]).unwrap();
        let mut tree=scan(root.clone(),&AtomicBool::new(false),|_|{}).unwrap();tree.index().unwrap();let root=tree.root_path.clone();
        assert!(tree.nodes.len()>50_000);
        assert_eq!(tree.response(root.join("large/leaf").to_str().unwrap(),"test").unwrap()["root_node"]["children"].as_array().unwrap().len(),50_050);
        fs::write(root.join("large/leaf/new_after_scan"),b"new").unwrap();
        assert_eq!(tree.response(root.join("large/leaf").to_str().unwrap(),"test").unwrap()["root_node"]["children"].as_array().unwrap().len(),50_050);
        assert_eq!(tree.response(root.join("sibling/deep").to_str().unwrap(),"test").unwrap()["root_node"]["children"][0]["name"],"marker");
        let mut encoded=flate2::write::GzEncoder::new(Vec::new(),flate2::Compression::fast());serde_json::to_writer(&mut encoded,&tree).unwrap();
        let bytes=encoded.finish().unwrap();let mut decoded:TreeSnapshot=serde_json::from_reader(flate2::read::GzDecoder::new(bytes.as_slice())).unwrap();decoded.index().unwrap();
        assert_eq!(decoded.response(root.join("large/leaf").to_str().unwrap(),"test").unwrap()["root_node"]["children"].as_array().unwrap().len(),50_050);
    }
    #[cfg(unix)]
    #[test]
    fn does_not_follow_symlinks() {
        let root = fixture();
        fs::create_dir_all(&root).unwrap();
        std::os::unix::fs::symlink("/", root.join("link")).unwrap();
        let mut tree = scan(root.clone(), &AtomicBool::new(false), |_| {}).unwrap();
        tree.index().unwrap();
        assert_eq!(tree.nodes.len(), 2);
        assert_eq!(tree.nodes[1].3 & DIRECTORY, 0);
        fs::remove_dir_all(root).unwrap();
    }
}
