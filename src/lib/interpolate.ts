import type { Layout, LayoutBlock } from '../types';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPolygon(
  from: [number, number][],
  to: [number, number][],
  t: number,
): [number, number][] {
  const n = Math.max(from.length, to.length);
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = from[Math.min(i, from.length - 1)] ?? from[0];
    const b = to[Math.min(i, to.length - 1)] ?? to[0];
    out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]);
  }
  return out;
}

/** Interpolate matching blocks by id between two layouts. */
export function interpolateLayout(from: Layout, to: Layout, t: number): Layout {
  const clamped = Math.min(1, Math.max(0, t));
  const fromById = new Map(from.map((b) => [b.id, b]));
  const toById = new Map(to.map((b) => [b.id, b]));
  const ids = new Set([...fromById.keys(), ...toById.keys()]);
  const result: LayoutBlock[] = [];
  for (const id of ids) {
    const a = fromById.get(id);
    const b = toById.get(id);
    if (a && b) {
      result.push({
        id,
        kind: b.kind,
        polygon: lerpPolygon(a.polygon, b.polygon, clamped),
        height_m: lerp(a.height_m, b.height_m, clamped),
      });
    } else if (b) {
      result.push(b);
    } else if (a) {
      result.push(a);
    }
  }
  return result;
}
