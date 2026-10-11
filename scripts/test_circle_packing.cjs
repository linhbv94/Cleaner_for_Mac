// Geometry checks use only Node's built-in TypeScript stripper, no new dependency.
const { stripTypeScriptTypes } = require('node:module');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const source = readFileSync(join(__dirname, '../desktop/src/components/circle_packing.tsx'), 'utf8').replace('import { SpaceLensNode }', 'import type { SpaceLensNode }');
const code = stripTypeScriptTypes(source).replace('export function packCircles', 'function packCircles');
const pack = new Function(code + '; return packCircles;')();
const cases = [[100, 25, 4], [1000000, 1, 1, 1], Array.from({ length: 150 }, (_, i) => i + 1), [0, 0, 100], [0, 0], [1]];
for (const sizes of cases) {
  const nodes = sizes.map((size, i) => ({name: String(i), path: String(i), size_bytes: size, is_directory: false, is_package: false, is_access_denied: false}));
  for (const [width, height] of [[650, 500], [220, 150], [1000, 240]]) {
    const circles = pack(nodes, width, height, sizes.reduce((a,b) => a+b, 0));
    assert.equal(circles.length, sizes.filter(size => size > 0).length);
    for (let i = 0; i < circles.length; i++) {
      const a = circles[i];
      assert(Number.isFinite(a.x) && Number.isFinite(a.y) && Number.isFinite(a.r) && a.r > 0);
      assert(a.x-a.r >= -.001 && a.y-a.r >= -.001 && a.x+a.r <= width+.001 && a.y+a.r <= height+.001, 'outside bounds');
      for (let j = i+1; j < circles.length; j++) {
        const b = circles[j];
        assert(Math.hypot(a.x-b.x, a.y-b.y)+.001 >= a.r+b.r, 'circles overlap');
        assert(Math.abs((a.r*a.r/b.r/b.r)/(a.node.size_bytes/b.node.size_bytes)-1) < .0001, 'area ratio differs from bytes');
      }
    }
    assert.deepEqual(pack(nodes,width,height,sizes.reduce((a,b)=>a+b,0)), circles, 'layout must be deterministic');
  }
}
console.log('Circle geometry: 18 cases pass (bounds, overlap, area ratios, zero sizes, deterministic layout).');
