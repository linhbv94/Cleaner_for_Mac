import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Local signing identity is supplied by the operator; no private key or
// machine-specific keychain location belongs in source control.
if (process.platform !== 'darwin') throw new Error('Build này yêu cầu macOS.');
const identity = process.env.VXCLEAN_CODESIGN_IDENTITY;
if (!identity || identity === '-') throw new Error('Thiếu VXCLEAN_CODESIGN_IDENTITY ổn định.');
const root = fileURLToPath(new URL('../', import.meta.url));
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run('npm', ['--prefix', 'desktop', 'run', 'tauri', '--', 'build', '--bundles', 'app',
  '--config', JSON.stringify({ bundle: { macOS: { signingIdentity: identity } } })]);
const app = resolve(root, 'desktop/src_tauri/target/release/bundle/macos/VXClean.app');
run('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', app]);
const requirement = spawnSync('/usr/bin/codesign', ['-d', '-r-', app], { encoding: 'utf8' });
const output = `${requirement.stdout ?? ''}${requirement.stderr ?? ''}`;
if (requirement.status !== 0 || !/certificate leaf = H"|anchor H"|anchor apple generic/.test(output)) {
  throw new Error('Gói chưa có designated requirement ràng buộc certificate.');
}
console.log(output.trim());
