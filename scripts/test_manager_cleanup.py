"""Disposable fixture only: manager owns pruning, exact installer rules, scope isolation."""
import json, os, plistlib, subprocess, tempfile, uuid, zipfile
from pathlib import Path
from test_native_maintenance import ROOT, SOURCES


def run():
    with tempfile.TemporaryDirectory(prefix='vxclean_manager_', dir=ROOT/'desktop/native') as temp:
        home=Path(temp)/'home';home.mkdir(); env=dict(os.environ,VXCLEAN_TEST_HOME=str(home))
        sdk=subprocess.check_output(['/usr/bin/xcrun','--show-sdk-path'],text=True).strip()
        binary=Path(temp)/'engine'
        r=subprocess.run(['/usr/bin/xcrun','swiftc','-D','ENGINE_TESTING','-parse-as-library','-sdk',sdk,'-module-cache-path','/tmp/vxclean_swift_module_cache',*[str(ROOT/x) for x in SOURCES],'-o',str(binary)],capture_output=True,timeout=120)
        assert r.returncode==0,r.stderr.decode()
        def put(p,data=b'x'*4096):p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data);return p
        def invoke(args,payload=None):
            r=subprocess.run([str(binary),*args],input=json.dumps(payload).encode() if payload else None,capture_output=True,env=env,timeout=30)
            assert r.returncode==0,r.stderr.decode();return json.loads(r.stdout)
        def scan(scope='detailed_cleanup'):return invoke(['scan','--scope',scope,'--include-empty'])
        def rows(value):return [i for c in value['categories'] for i in c['items']]
        def payload(p,method='pnpm_prune',scope='detailed_cleanup'):
            st=p.lstat();stamp={'path':str(p),'device':st.st_dev,'inode':st.st_ino,'mode':st.st_mode,'size':st.st_size,'modified_s':st.st_mtime_ns//1000000000,'modified_ns':st.st_mtime_ns%1000000000,'changed_s':st.st_ctime_ns//1000000000,'changed_ns':st.st_ctime_ns%1000000000}
            return {'protocol_version':'2.0','platform':'macos','policy_version':'1.0.0','operation_scope':scope,'operation_id':str(uuid.uuid4()),'targets':[{'path':str(p),'deletion_method':method}],'confirm_direct_delete':True,'identities':{str(p):[st.st_dev,st.st_ino]},'content_snapshots':{str(p):[stamp]}}
        cli=put(home/'.local/bin/pnpm',b'''#!/usr/bin/python3
import sys,os,json,time
from pathlib import Path
h=Path(os.environ['VXCLEAN_TEST_HOME']);args=sys.argv[1:];base=h/'Library/pnpm/store';store=base/'v10';mode=(h/'mode').read_text() if (h/'mode').exists() else ''
with (h/'calls.jsonl').open('a') as f:f.write(json.dumps(args)+'\\n')
if args[:1]==['--store-dir']:
 if args[1]!=str(base):sys.exit(8)
 args=args[2:]
if args==['store','path']:print(str(h/'Documents' if mode=='outside' else store));sys.exit(0)
if args==['store','prune']:
 if mode=='fail':sys.exit(7)
 if mode=='partial':(store/'unreferenced').unlink(missing_ok=True);sys.exit(7)
 if mode=='slow':time.sleep(10)
 (store/'unreferenced').unlink(missing_ok=True);print('prune complete');sys.exit(0)
sys.exit(9)
''');cli.chmod(0o755)
        store=home/'Library/pnpm/store/v10';legacy=put(home/'Library/pnpm/store/v9/keep-legacy');old=put(store/'unreferenced');live=put(store/'referenced',b'keep-live');outside=put(home/'Documents/project',b'keep-project');alias=home/'Documents/live-alias';os.link(live,alias)
        inventory=rows(scan());a=next(i for i in inventory if i['deletion_method']=='pnpm_prune');assert next(i for i in inventory if i['path']==str(legacy.parent))['is_cleanable'] is False
        assert a['is_cleanable'] and not a['is_selected_by_default'] and a['size_bytes']==0 and a['store_size_bytes']>=4096
        assert not any(json.loads(x)[-2:]==['store','prune'] for x in (home/'calls.jsonl').read_text().splitlines())
        result=invoke(['clean','--stdin'],payload(store));assert result['success_count']==1,result
        assert result['details'][0]['method_used']=='pnpm_prune' and result['permanently_freed_bytes']==4096
        assert legacy.exists() and not old.exists() and live.read_bytes()==b'keep-live' and alias.read_bytes()==b'keep-live' and outside.read_bytes()==b'keep-project'
        checks=['pnpm_cli_only_prune_no_scan_mutation_preserves_referenced_hardlink_and_project_inventory_not_reclaimable']
        put(old);put(home/'mode',b'fail');result=invoke(['clean','--stdin'],payload(store));assert result['failure_count']==1 and old.exists(),result
        checks.append('pnpm_nonzero_exit_is_failure_not_success')
        put(home/'mode',b'partial');result=invoke(['clean','--stdin'],payload(store));assert result['failure_count']==1 and not old.exists() and result['details'][0]['status']=='outcome_unknown',result
        journal=json.loads((home/'Library/Application Support/com.vxclean.desktop/operations'/result['operation_id']/'result.json').read_text());assert journal['targets'][0]['status']=='outcome_unknown' and not journal['automatic_replay'];put(old);checks.append('pnpm_partial_failure_keeps_durable_unknown_no_replay')
        put(home/'mode',b'slow');env['VXCLEAN_TEST_MANAGER_TIMEOUT']='1';result=invoke(['clean','--stdin'],payload(store));assert result['failure_count']==1 and old.exists(),result;env.pop('VXCLEAN_TEST_MANAGER_TIMEOUT');checks.append('pnpm_timeout_no_replay_truthful_partial_unknown')
        put(home/'mode',b'outside');assert not any(i['deletion_method']=='pnpm_prune' for i in rows(scan()));result=invoke(['clean','--stdin'],payload(store));assert result['failure_count']==1 and old.exists();checks.append('pnpm_outside_store_and_changed_plan_rejected')
        put(home/'mode',b'');p=payload(store);p['confirm_direct_delete']=False;assert invoke(['clean','--stdin'],p)['failure_count']==1 and old.exists();p=payload(store);cancel=home/'Library/Application Support/com.vxclean.desktop/operations'/p['operation_id']/'cancel';put(cancel,b'cancel');result=invoke(['clean','--stdin'],p);assert old.exists() and result['details'][0]['status']=='skipped';checks.append('pnpm_confirmation_and_cancel_no_mutation')
        info={'CFBundleIdentifier':'com.google.antigravity','CFBundleShortVersionString':'2.22.0','CFBundleVersion':'2.22.0'}
        installed=put(home/'Applications/Antigravity.app/Contents/Info.plist',plistlib.dumps(info));root=home/'Library/Caches/com.google.antigravity';ship=put(home/'Library/Caches/com.google.antigravity.ShipIt/ShipItState.plist',b'keep-state');state=put(root/'pending/update-info.json',b'keep-pending-state')
        for n in ['update.zip','pending/Antigravity.zip']:
            p=root/n;p.parent.mkdir(parents=True,exist_ok=True)
            with zipfile.ZipFile(p,'w') as z:z.writestr('Antigravity.app/Contents/Info.plist',plistlib.dumps(info));z.writestr('Antigravity.app/payload',os.urandom(4096))
        q=scan('quick_cleanup');archives=[i for i in rows(q) if i.get('rule_id')=='anti_installer_archive'];assert len(archives)==2 and all(i['is_cleanable'] and 'ShipIt' in i['consequence_vi'] for i in archives),archives
        info['CFBundleShortVersionString']='2.23.0';installed.write_bytes(plistlib.dumps(info));assert not any(i.get('rule_id')=='anti_installer_archive' for i in rows(scan('quick_cleanup')));assert state.read_bytes()==b'keep-pending-state' and ship.read_bytes()==b'keep-state';checks.append('anti_exact_installer_version_match_shipit_advice_mismatch_no_grant')
        info['CFBundleShortVersionString']='2.22.0';installed.write_bytes(plistlib.dumps(info));archive=root/'update.zip';p=payload(archive,'remove_item','quick_cleanup');result=invoke(['clean','--stdin'],p);assert result['success_count']==1 and not archive.exists() and state.exists() and ship.exists(),result;checks.append('anti_deletes_only_selected_archive_keeps_pending_state_shipit_app')
        put(home/'Library/Caches/Google/Chrome/Default/Cache/body');put(home/'Movies/CapCut/User Data/CEF/Cache/GPUCache/body')
        quick=[i for i in rows(scan('quick_cleanup')) if i['is_cleanable']];detail=rows(scan())
        for i in detail:
            if i['is_cleanable']:
                assert not any(i['path']==q['path'] or i['path'].startswith(q['path']+'/') or q['path'].startswith(i['path']+'/') for q in quick),(i,quick)
        assert any(i['category']=='media_apps' and i['is_cleanable'] for i in detail)
        checks.append('detailed_quick_path_child_parent_no_overlap_external_media_preserved')
        print(json.dumps({'count':len(checks),'passed':checks,'real_user_data_deleted':False},indent=2))

if __name__=='__main__':run()
