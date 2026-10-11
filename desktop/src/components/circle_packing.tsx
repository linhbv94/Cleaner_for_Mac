import { SpaceLensNode } from '../types';

export interface PackedCircle {
  node: SpaceLensNode;
  x: number;
  y: number;
  r: number;
  percentage: string;
}

interface InternalCircle {
  node: SpaceLensNode;
  x: number;
  y: number;
  r: number;
}

/**
 * Deterministic non-overlapping circle packing algorithm.
 * Radius is strictly proportional to sqrt(node.size_bytes).
 * Fits inside the bounding box [width, height].
 */
export function packCircles(
  nodes: SpaceLensNode[],
  width: number,
  height: number,
  totalBytes: number
): PackedCircle[] {
  if (!nodes || nodes.length === 0 || width <= 0 || height <= 0) return [];

  // Only plot positive sizes
  const validNodes = nodes.filter((n) => n.size_bytes > 0);
  if (validNodes.length === 0) return [];

  const safeTotalBytes =
    totalBytes > 0 ? totalBytes : validNodes.reduce((acc, n) => acc + n.size_bytes, 0) || 1;

  // Sort descending by size for optimal compact packing
  const sorted = [...validNodes].sort((a, b) => b.size_bytes - a.size_bytes);

  // Single circle edge case
  if (sorted.length === 1) {
    const node = sorted[0];
    const r = Math.min(width, height) / 2;
    return [
      {
        node,
        x: width / 2,
        y: height / 2,
        r,
        percentage:
          safeTotalBytes > 0 ? ((node.size_bytes / safeTotalBytes) * 100).toFixed(1) : '100.0',
      },
    ];
  }

  // Radii proportional to sqrt(size_bytes)
  const baseRadii = sorted.map((n) => Math.sqrt(n.size_bytes));

  const placed: InternalCircle[] = [];

  // Circle 0 at origin
  placed.push({
    node: sorted[0],
    x: 0,
    y: 0,
    r: baseRadii[0],
  });

  // Circle 1 tangent to circle 0 on the x-axis
  placed.push({
    node: sorted[1],
    x: baseRadii[0] + baseRadii[1],
    y: 0,
    r: baseRadii[1],
  });

  // Constructive placement for remaining circles
  for (let i = 2; i < sorted.length; i++) {
    const r = baseRadii[i];
    let bestCand: { x: number; y: number } | null = null;
    let minDistOrigin = Infinity;

    // Try placing tangent to pairs of already placed circles
    for (let j = 0; j < placed.length; j++) {
      for (let k = j + 1; k < placed.length; k++) {
        const c1 = placed[j];
        const c2 = placed[k];

        const d1 = c1.r + r;
        const d2 = c2.r + r;
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const d = Math.hypot(dx, dy);

        if (d > d1 + d2 || d < Math.abs(d1 - d2) || d === 0) continue;

        const a = (d1 * d1 - d2 * d2 + d * d) / (2 * d);
        const h = Math.sqrt(Math.max(0, d1 * d1 - a * a));
        const px = c1.x + (dx * a) / d;
        const py = c1.y + (dy * a) / d;
        const rx = -dy / d;
        const ry = dx / d;

        const candidates = [
          { x: px + h * rx, y: py + h * ry },
          { x: px - h * rx, y: py - h * ry },
        ];

        for (const cand of candidates) {
          let collision = false;
          for (let m = 0; m < placed.length; m++) {
            if (m === j || m === k) continue;
            const dist = Math.hypot(cand.x - placed[m].x, cand.y - placed[m].y);
            if (dist < r + placed[m].r - 1e-6) {
              collision = true;
              break;
            }
          }

          if (!collision) {
            const distOrigin = Math.hypot(cand.x, cand.y);
            if (distOrigin < minDistOrigin) {
              minDistOrigin = distOrigin;
              bestCand = cand;
            }
          }
        }
      }
    }

    // Fallback: place to the right of bounding box
    if (!bestCand) {
      let maxX = -Infinity;
      for (const c of placed) {
        if (c.x + c.r > maxX) maxX = c.x + c.r;
      }
      bestCand = { x: maxX + r, y: 0 };
    }

    placed.push({
      node: sorted[i],
      x: bestCand.x,
      y: bestCand.y,
      r,
    });
  }

  // Calculate common bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const c of placed) {
    if (c.x - c.r < minX) minX = c.x - c.r;
    if (c.x + c.r > maxX) maxX = c.x + c.r;
    if (c.y - c.r < minY) minY = c.y - c.r;
    if (c.y + c.r > maxY) maxY = c.y + c.r;
  }

  const boxW = Math.max(1e-6, maxX - minX);
  const boxH = Math.max(1e-6, maxY - minY);

  const scale = Math.min(width / boxW, height / boxH);
  const offsetX = (width - boxW * scale) / 2;
  const offsetY = (height - boxH * scale) / 2;

  return placed.map((c) => ({
    node: c.node,
    x: (c.x - minX) * scale + offsetX,
    y: (c.y - minY) * scale + offsetY,
    r: c.r * scale,
    percentage:
      safeTotalBytes > 0 ? ((c.node.size_bytes / safeTotalBytes) * 100).toFixed(1) : '0',
  }));
}
