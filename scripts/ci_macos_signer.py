"""Import the release-only signer into an isolated hosted-runner keychain."""
import base64,json,os,secrets,subprocess,sys
from pathlib import Path
root=Path(os.environ['RUNNER_TEMP'])/'vxclean_signer'
def run(*args):
    result=subprocess.run(args,capture_output=True,text=True)
    if result.returncode: raise RuntimeError('macOS signer command failed: '+args[0]+' '+args[1])
    return result.stdout
if sys.argv[1]=='install':
    root.mkdir(mode=0o700);keychain=root/'release.keychain-db';p12=root/'identity.p12';cert=root/'identity.pem'
    previous=run('security','list-keychains','-d','user');(root/'previous.json').write_text(json.dumps([line.strip().strip('"') for line in previous.splitlines() if line.strip()]))
    password=secrets.token_urlsafe(40)
    p12.write_bytes(base64.b64decode(os.environ['VXCLEAN_MACOS_CERTIFICATE'],validate=True));p12.chmod(0o600)
    run('security','create-keychain','-p',password,str(keychain));run('security','set-keychain-settings','-lut','21600',str(keychain));run('security','unlock-keychain','-p',password,str(keychain))
    run('security','import',str(p12),'-k',str(keychain),'-P',os.environ['VXCLEAN_MACOS_CERTIFICATE_PASSWORD'],'-T','/usr/bin/codesign','-T','/usr/bin/security')
    run('security','set-key-partition-list','-S','apple-tool:,apple:,codesign:','-s','-k',password,str(keychain))
    run('security','list-keychains','-d','user','-s',str(keychain),*json.loads((root/'previous.json').read_text()))
    cert.write_text(run('security','find-certificate','-a','-p',str(keychain)))
    run('security','add-trusted-cert','-r','trustRoot','-p','codeSign','-k',str(keychain),str(cert))
    identity='FE024021592C718A39AD70B76D2EDC5DA0CD6B70'
    if identity not in run('security','find-identity','-v','-p','codesigning',str(keychain)):raise RuntimeError('Expected signer is not trusted/available')
    (root/'tauri_signer.json').write_text(json.dumps({'bundle':{'macOS':{'signingIdentity':identity}}}))
    with open(os.environ['GITHUB_ENV'],'a') as stream:stream.write('VXCLEAN_SIGNER_CONFIG='+str(root/'tauri_signer.json')+'\n')
    p12.unlink();print('Expected certificate-bound signer installed in temporary keychain')
elif sys.argv[1]=='cleanup':
    if (root/'identity.pem').exists():run('security','remove-trusted-cert',str(root/'identity.pem'))
    if (root/'previous.json').exists():run('security','list-keychains','-d','user','-s',*json.loads((root/'previous.json').read_text()))
    if (root/'release.keychain-db').exists():run('security','delete-keychain',str(root/'release.keychain-db'))
    for path in root.glob('*'):path.unlink()
else:raise RuntimeError('Unknown action')
