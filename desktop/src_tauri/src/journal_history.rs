use serde_json::{json,Value};
use std::{path::Path,time::{Duration,SystemTime}};
const MAX_ENTRIES:usize=5000;
const MAX_TOTAL_BYTES:u64=32*1024*1024;
const KEEP_FOR:Duration=Duration::from_secs(180*24*60*60);
const FILES:[(&str,&str);3]=[("host.json","host"),("result.json","native"),("lifecycle.json","lifecycle")];
fn uuid(name:&str)->bool{name.len()==36 && name.bytes().enumerate().all(|(i,b)|if [8,13,18,23].contains(&i){b==b'-'}else{b.is_ascii_hexdigit()})}
fn complete(row:&Value)->bool {
    if row["journal_unverified"]==true {return false;}
    if row["host"]["status"]!="returned" {return false;}
    if row["native"].is_object() && !(row["native"]["status"]=="completed" && row["native"]["targets"].as_array().is_some_and(|targets|targets.iter().all(|t|t["status"]=="success"))) {return false;}
    if row["lifecycle"].is_object() {return row["lifecycle"]["status"]=="reopened";}
    row["native"]["status"]=="completed" && row["native"]["targets"].as_array().is_some_and(|targets|targets.iter().all(|t|t["status"]=="success"))
}
fn apply_events(row:&mut Value,data:&[u8])->bool {
    if !data.is_empty() && !data.ends_with(b"\n") {return false;}
    let mut targets=std::collections::BTreeMap::new();
    if let Some(existing)=row["native"]["targets"].as_array() {
        for target in existing {if let Some(path)=target["path"].as_str(){targets.insert(path.to_string(),target.clone());}}
    }
    for line in data.split(|b|*b==b'\n').filter(|l|!l.is_empty()) {
        let Ok(event)=serde_json::from_slice::<Value>(line) else {return false;};
        let target=&event["target"];
        let Some(path)=target["path"].as_str().filter(|p|p.starts_with('/')) else {return false;};
        let status=target["status"].as_str().unwrap_or("");
        if !(event["phase"]=="intent" && status=="outcome_unknown" || event["phase"]=="outcome" && ["success","skipped","permission_denied","file_in_use","outcome_unknown"].contains(&status)) {return false;}
        if targets.len()>=20000 && !targets.contains_key(path){return false;}
        targets.insert(path.to_string(),target.clone());
    }
    if !row["native"].is_object(){return false;}
    row["native"]["targets"]=json!(targets.into_values().collect::<Vec<_>>());
    true
}
/// Only completed, recognized journals expire. Pending/unknown recovery is never silently discarded.
pub(crate) fn read(root:&Path,now:SystemTime)->Result<Value,String>{
    if !root.exists(){return Ok(json!([]));}
    if std::fs::canonicalize(root).map_err(|e|e.to_string())?!=root{return Err("path_changed: journal root".into());}
    let entries=std::fs::read_dir(root).map_err(|e|e.to_string())?.take(MAX_ENTRIES+1).collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())?;
    if entries.len()>MAX_ENTRIES{return Err("Lịch sử vượt giới hạn kiểm tra an toàn; cần rà journal trước khi cập nhật.".into());}
    let mut total=0;let mut rows=Vec::new();
    for entry in entries {
        let dir=entry.path();let name=entry.file_name().to_string_lossy().into_owned();
        if !uuid(&name) || !entry.file_type().map_err(|e|e.to_string())?.is_dir() || std::fs::canonicalize(&dir).ok().as_ref()!=Some(&dir){continue;}
        let mut row=json!({"operation_id":name,"automatic_replay":false});let mut latest=SystemTime::UNIX_EPOCH;let mut recognized=true;
        for (file,key) in FILES {
            let p=dir.join(file);if !p.exists(){continue;}
            let meta=std::fs::symlink_metadata(&p).map_err(|e|e.to_string())?;
            if !meta.is_file() || std::fs::canonicalize(&p).ok().as_ref()!=Some(&p){recognized=false;continue;}
            latest=latest.max(meta.modified().map_err(|e|e.to_string())?);total+=meta.len();
            if meta.len()>4*1024*1024 || total>MAX_TOTAL_BYTES{return Err("Journal vượt giới hạn đọc an toàn; chưa cho phép cập nhật.".into());}
            match serde_json::from_slice::<Value>(&std::fs::read(&p).map_err(|e|e.to_string())?){Ok(v)=>row[key]=v,Err(_)=>recognized=false}
        }
        let events=dir.join("events.jsonl");
        if events.exists() {
            let meta=std::fs::symlink_metadata(&events).map_err(|e|e.to_string())?;
            if !meta.is_file() || std::fs::canonicalize(&events).ok().as_ref()!=Some(&events) {recognized=false;}
            else {
                latest=latest.max(meta.modified().map_err(|e|e.to_string())?); total+=meta.len();
                if meta.len()>16*1024*1024 || total>MAX_TOTAL_BYTES{return Err("Journal vượt giới hạn đọc an toàn; chưa cho phép cập nhật.".into());}
                recognized &= apply_events(&mut row,&std::fs::read(&events).map_err(|e|e.to_string())?);
            }
        }
        let files=std::fs::read_dir(&dir).map_err(|e|e.to_string())?.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())?;
        recognized &= files.iter().all(|f|f.file_type().is_ok_and(|t|t.is_file()) && ["host.json","result.json","lifecycle.json","events.jsonl","cancel"].contains(&f.file_name().to_string_lossy().as_ref()));
        row["journal_unverified"]=json!(!recognized);
        if recognized && complete(&row) && now.duration_since(latest).is_ok_and(|age|age>KEEP_FOR) {
            for file in files {std::fs::remove_file(file.path()).map_err(|e|e.to_string())?;}
            std::fs::remove_dir(&dir).map_err(|e|e.to_string())?;
        } else {rows.push((latest,row));}
    }
    rows.sort_by(|a,b|b.0.cmp(&a.0));Ok(json!(rows.into_iter().map(|(_,row)|row).collect::<Vec<_>>()))
}
#[cfg(test)] mod tests {
 use super::*;
 fn fixture(kind:&str)->std::path::PathBuf {let p=std::env::temp_dir().join(format!("vxclean_journal_{}_{}_{}",kind,std::process::id(),SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_nanos()));std::fs::create_dir_all(&p).unwrap();p.canonicalize().unwrap()}
 fn put(root:&Path,id:&str,host:Value,native:Value){let d=root.join(id);std::fs::create_dir(&d).unwrap();for (name,v) in [("host.json",host),("result.json",native)]{std::fs::write(d.join(name),v.to_string()).unwrap();}}
 #[test]fn completed_journals_expire_pending_and_unknown_survive(){
  let r=fixture("retention");let a="00000000-0000-4000-8000-000000000001";let b="00000000-0000-4000-8000-000000000002";let c="00000000-0000-4000-8000-000000000003";
  put(&r,a,json!({"status":"returned"}),json!({"status":"completed","targets":[{"status":"success"}]}));
  put(&r,b,json!({"status":"interrupted"}),json!({"status":"mutating","targets":[{"status":"outcome_unknown"}]}));
  put(&r,c,json!({"status":"returned"}),json!({"status":"completed","targets":[]}));std::fs::write(r.join(c).join("unknown.bin"),b"keep").unwrap();
  let rows=read(&r,SystemTime::now()+KEEP_FOR+Duration::from_secs(60)).unwrap();assert!(!r.join(a).exists());assert!(r.join(b).exists() && r.join(c).join("unknown.bin").exists());assert_eq!(rows.as_array().unwrap().len(),2);std::fs::remove_dir_all(r).unwrap();
 }
 #[test]fn reopen_obligations_and_unrecognized_outcomes_never_expire(){
  assert!(!complete(&json!({"host":{"status":"returned"},"lifecycle":{"status":"reopen_pending"}})));
  assert!(!complete(&json!({"host":{"status":"returned"},"native":{"status":"completed","targets":[{"status":"outcome_unknown"}]}})));
  assert!(!complete(&json!({"host":{"status":"returned"}})));
  assert!(!complete(&json!({"host":{"status":"returned"},"lifecycle":{"status":"reopened"},"native":{"status":"completed","targets":[{"status":"outcome_unknown"}]}})));
  assert!(complete(&json!({"host":{"status":"returned"},"lifecycle":{"status":"reopened"}})));
 }
 #[test]fn corrupt_lifecycle_is_exposed_and_never_expires(){
  let r=fixture("corrupt");let id="00000000-0000-4000-8000-000000000005";
  put(&r,id,json!({"status":"returned"}),json!({"status":"completed","targets":[]}));
  std::fs::write(r.join(id).join("lifecycle.json"),b"{broken").unwrap();
  let rows=read(&r,SystemTime::now()+KEEP_FOR+Duration::from_secs(60)).unwrap();
  assert_eq!(rows[0]["journal_unverified"],true);assert!(r.join(id).exists());std::fs::remove_dir_all(r).unwrap();
 }
 #[cfg(unix)] #[test]fn symlink_journal_preserves_external_file(){
  use std::os::unix::fs::symlink;let r=fixture("links");let outside=r.join("keep");std::fs::write(&outside,b"marker").unwrap();let d=r.join("00000000-0000-4000-8000-000000000004");std::fs::create_dir(&d).unwrap();symlink(&outside,d.join("host.json")).unwrap();read(&r,SystemTime::now()+KEEP_FOR+Duration::from_secs(60)).unwrap();assert_eq!(std::fs::read(outside).unwrap(),b"marker");assert!(d.exists());std::fs::remove_dir_all(r).unwrap();
 }
}

#[cfg(test)] mod event_tests {
 use super::*;
 #[test] fn events_recover_exact_outcomes_and_keep_missing_outcome_unknown() {
  let mut row=json!({"host":{"status":"interrupted"},"native":{"status":"mutating","targets":[]}});
  let log=b"{\"phase\":\"intent\",\"target\":{\"path\":\"/a\",\"status\":\"outcome_unknown\"}}\n{\"phase\":\"outcome\",\"target\":{\"path\":\"/a\",\"status\":\"success\",\"affected_bytes\":5}}\n{\"phase\":\"intent\",\"target\":{\"path\":\"/b\",\"status\":\"outcome_unknown\"}}\n";
  assert!(apply_events(&mut row,log)); assert_eq!(row["native"]["targets"][0]["affected_bytes"],5);assert_eq!(row["native"]["targets"][1]["status"],"outcome_unknown");assert!(!complete(&row));
 }
 #[test] fn truncated_or_unknown_events_fail_closed() {
  let mut row=json!({"native":{"status":"mutating","targets":[]}});
  assert!(!apply_events(&mut row,b"{broken"));
  assert!(!apply_events(&mut row,b"{\"phase\":\"garbage\",\"target\":{\"path\":\"/a\",\"status\":\"success\"}}\n"));
 }
}
