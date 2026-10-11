const { stripTypeScriptTypes } = require('node:module');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const code = stripTypeScriptTypes(readFileSync(join(__dirname, '../desktop/src/services/uninstall_selection.ts'), 'utf8'))
  .replace('export function defaultUninstallPaths', 'function defaultUninstallPaths');
const select = new Function(code + ';return defaultUninstallPaths;')();
const known = { path: '/Applications/Test.app', file_type: 'bundle' };
const discovered = { path: '/Users/fixture/Movies/Test', file_type: 'discovered', is_selected_by_default: false };
assert.deepEqual([...select([known, discovered])], [known.path]);
assert.equal(select([{ ...discovered, is_selected_by_default: true }]).size, 0);
assert.equal(select([{ ...discovered, is_selected_by_default: undefined }]).size, 0);
assert.equal(select([{ ...known, is_selected_by_default: false }]).size, 0);
const manuallySelected = select([known, discovered]); manuallySelected.add(discovered.path);
assert.equal(select([known, discovered]).has(discovered.path), false);
console.log('Uninstall defaults: 5 cases pass; discovery cannot become selected by refresh/default metadata');
