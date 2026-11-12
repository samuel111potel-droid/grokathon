// deck.gl layer builders for the demo stage. Pure functions of store state + animation values.
import { ColumnLayer, GeoJsonLayer, PathLayer, PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { HeatmapLayer, HexagonLayer } from '@deck.gl/aggregation-layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import type { LayoutRound } from '../types/schema';
import { geoLayers, geomCenter, receptorPts, route, rowPts } from '../components/data';
import type { State } from '../components/store';

type RGB = [number, number, number];
export interface FitItem {
  id: string;
  kind: string;
  label: string;
  polygon: number[][];
  height: number;
  color: RGB;
  alpha: number;
}

const hexRgb = (h?: string): RGB | null =>
  h && /^#[0-9a-f]{6}$/i.test(h) ? [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)] : null;

// Colours fixed by the Lane 5 visual spec; anything else falls back to the feature's own colour.
function kindColor(kind: string, fallback?: string): RGB {
  const k = (kind || '').toLowerCase();
  if (k.includes('hall')) return [56, 189, 248];
  if (k.includes('gen')) return [239, 68, 68];
  if (k.includes('sub') || k.includes('bess') || k.includes('batter')) return [129, 140, 248];
  if (/barrier|screen|tree|belt|bund|landscap/.test(k)) return [16, 185, 129];
  return hexRgb(fallback) ?? [148, 163, 184];
}

export function fitFromRound(r?: LayoutRound): Map<string, FitItem> {
  const m = new Map<string, FitItem>();
  for (const f of r?.features?.features ?? []) {
    const g = f.geometry;
    const p: any = f.properties || {};
    const ring: number[][] | undefined = g?.type === 'Polygon' ? g.coordinates[0] : g?.type === 'MultiPolygon' ? g.coordinates[0]?.[0] : undefined;
    if (!ring || !p.id) continue;
    m.set(p.id, {
      id: p.id,
      kind: p.kind ?? '',
      label: p.label ?? p.id,
      polygon: ring.map((c) => [c[0], c[1]]),
      height: Number(p.height_m) || 0,
      color: kindColor(p.kind, p.color),
      alpha: 1,
    });
  }
  return m;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Interpolate two layouts by feature id: matched features morph, new ones rise, removed ones sink. */
export function lerpFit(a: Map<string, FitItem>, b: Map<string, FitItem>, t: number): FitItem[] {
  const out: FitItem[] = [];
  const ids = new Set([...a.keys(), ...b.keys()]);
  for (const id of ids) {
    const A = a.get(id);
    const B = b.get(id);
    if (A && B) {
      if (A.polygon.length === B.polygon.length) {
        out.push({
          ...B,
          polygon: B.polygon.map((p, i) => [lerp(A.polygon[i][0], p[0], t), lerp(A.polygon[i][1], p[1], t)]),
          height: lerp(A.height, B.height, t),
          color: [lerp(A.color[0], B.color[0], t), lerp(A.color[1], B.color[1], t), lerp(A.color[2], B.color[2], t)],
          alpha: lerp(A.alpha, 1, t),
        });
      } else if (t < 0.5) out.push({ ...A, height: A.height * (1 - 2 * t), alpha: A.alpha * (1 - 2 * t) });
      else out.push({ ...B, height: B.height * (2 * t - 1), alpha: 2 * t - 1 });
    } else if (A) out.push({ ...A, height: A.height * (1 - t), alpha: A.alpha * (1 - t) });
    else if (B) out.push({ ...B, height: B.height * t, alpha: t });
  }
  return out.filter((f) => f.alpha > 0.01);
}

export function genCenterOf(items: FitItem[]): [number, number] | null {
  let x = 0,
    y = 0,
    n = 0;
  for (const f of items) {
    if (!f.kind.toLowerCase().includes('gen')) continue;
    for (const p of f.polygon.slice(0, -1)) {
      x += p[0];
      y += p[1];
      n++;
    }
  }
  return n ? [x / n, y / n] : null;
}

/** Acoustic ring radius in metres, from the round file. */
export function ringRadiusOf(r?: LayoutRound): number {
  if (!r) return 0;
  const m: any = r.metrics;
  if (typeof m.acoustic_contour_m === 'number') return m.acoustic_contour_m;
  // No contour in the round file: draw an indicative ring that reaches the nearest home only when the round fails its noise check.
  const d = Number(m.nearest_home_to_gen_m) || 0;
  return m.bs4142_compliant ? d * 0.6 : d * 1.15;
}

/** Fast local distance in metres (equirectangular); used per frame for pin colouring only. */
export function distM(a: number[], b: number[]): number {
  const k = Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  const dx = (a[0] - b[0]) * 111320 * k;
  const dy = (a[1] - b[1]) * 110540;
  return Math.sqrt(dx * dx + dy * dy);
}

export const areaMetricKeys: string[] = Object.keys(geoLayers.areas.data.features[0]?.properties?.metrics ?? {});

// ---------- flow paths (Grid flows view) ----------
const FLOW_T = 100;
const FLOW_COPIES = 3;
interface FlowPath {
  id: string;
  path: number[][];
  frac: number[];
  color: RGB;
}
function lineParts(fc: { features: any[] }): { id: string; coords: number[][]; props: any }[] {
  const out: { id: string; coords: number[][]; props: any }[] = [];
  for (const f of fc.features) {
    const g = f?.geometry;
    const id = f?.properties?.id ?? `line-${out.length}`;
    if (g?.type === 'LineString') out.push({ id, coords: g.coordinates, props: f.properties ?? {} });
    else if (g?.type === 'MultiLineString') g.coordinates.forEach((c: number[][], i: number) => out.push({ id: `${id}-${i}`, coords: c, props: f.properties ?? {} }));
  }
  return out;
}
function densify(coords: number[][], stepM = 40): { path: number[][]; frac: number[] } {
  const path: number[][] = [];
  const cum: number[] = [];
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const d = distM(a, b);
    const n = Math.max(1, Math.ceil(d / stepM));
    for (let j = 0; j < n; j++) {
      path.push([lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n)]);
      cum.push(total + (d * j) / n);
    }
    total += d;
  }
  if (coords.length) {
    path.push(coords[coords.length - 1].slice(0, 2));
    cum.push(total);
  }
  return { path, frac: cum.map((c) => (total > 0 ? c / total : 0)) };
}
const maxKv = Math.max(0, ...geoLayers.lines.data.features.map((f) => Number(f?.properties?.voltage_kv) || 0));
const lineColor = (p: any): RGB => (maxKv > 0 && Number(p?.voltage_kv) >= maxKv ? [250, 204, 21] : [129, 140, 248]);
const FLOW_PATHS: FlowPath[] = [
  ...lineParts(route.data).map((l) => ({ id: l.id, ...densify(l.coords), color: [56, 189, 248] as RGB })),
  ...lineParts(geoLayers.lines.data).map((l) => ({ id: l.id, ...densify(l.coords), color: lineColor(l.props) })),
].filter((p) => p.path.length > 1);
const TRIPS = FLOW_PATHS.flatMap((p) =>
  Array.from({ length: FLOW_COPIES * 2 }, (_, i) => {
    const shift = ((i - FLOW_COPIES) * FLOW_T) / FLOW_COPIES;
    return { path: p.path, ts: p.frac.map((f) => f * FLOW_T + shift), color: p.color };
  }),
);

const ramp = (t: number): [number, number, number, number] =>
  t < 0.5 ? [239, lerp(68, 180, t * 2), lerp(68, 40, t * 2), 235] : [lerp(245, 16, (t - 0.5) * 2), lerp(180, 185, (t - 0.5) * 2), lerp(40, 129, (t - 0.5) * 2), 235];

export interface Ctx {
  s: State;
  fit: FitItem[];
  ring: number;
  ringFail: boolean;
  time: number;
  hlPos: number[][];
}

export function buildLayers(c: Ctx): any[] {
  const { s } = c;
  const L = s.layers;
  const flows = s.view === 'flows';
  const columns = s.view === 'columns';
  const dim = flows ? 0.16 : 1;
  const hl = new Set(s.highlight);
  const hlKey = s.highlight.join('|');
  const out: any[] = [];
  const px = { lineWidthUnits: 'pixels' as const };

  // --- area and constraint polygons ---
  const areas = geoLayers.areas.data;
  const metric = s.communityMetric ?? areaMetricKeys[0];
  if (L.areas && areas.features.length && metric) {
    const vals = areas.features.map((f) => Number(f.properties?.metrics?.[metric])).filter(Number.isFinite);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    out.push(
      new GeoJsonLayer({
        id: 'cl-areas',
        data: areas as any,
        pickable: true,
        opacity: dim,
        getFillColor: (f: any) => {
          const v = Number(f.properties?.metrics?.[metric]);
          const t = Number.isFinite(v) && hi > lo ? (v - lo) / (hi - lo) : 0.5;
          return [56, 189, 248, 25 + t * 115];
        },
        getLineColor: [56, 189, 248, 170],
        getLineWidth: 1,
        ...px,
        updateTriggers: { getFillColor: [metric] },
      }),
    );
  }
  if (L.flood && geoLayers.flood.data.features.length) {
    const zmax = Math.max(...geoLayers.flood.data.features.map((f) => Number(f.properties?.zone) || 0));
    out.push(
      new GeoJsonLayer({
        id: 'cl-flood',
        data: geoLayers.flood.data as any,
        pickable: true,
        opacity: dim,
        getFillColor: (f: any) => (Number(f.properties?.zone) >= zmax ? [37, 99, 235, 125] : [96, 165, 250, 45]),
        getLineColor: [96, 165, 250, 210],
        getLineWidth: 1,
        ...px,
      }),
    );
  }
  if (L.contamination && geoLayers.contamination.data.features.length)
    out.push(
      new GeoJsonLayer({
        id: 'cl-contamination',
        data: geoLayers.contamination.data as any,
        pickable: true,
        opacity: dim,
        getFillColor: [217, 119, 6, 60],
        getLineColor: [245, 158, 11, 235],
        getLineWidth: 2,
        ...px,
        extensions: [new PathStyleExtension({ dash: true })],
        getDashArray: [3, 2],
      } as any),
    );
  if (L.ecology && geoLayers.ecology.data.features.length)
    out.push(
      new GeoJsonLayer({
        id: 'cl-ecology',
        data: geoLayers.ecology.data as any,
        pickable: true,
        opacity: dim,
        getFillColor: [34, 197, 94, 45],
        getLineColor: [34, 197, 94, 220],
        getLineWidth: 1.5,
        ...px,
      }),
    );

  // --- linear infrastructure ---
  if (L.lines && geoLayers.lines.data.features.length && !flows)
    out.push(
      new GeoJsonLayer({
        id: 'cl-lines',
        data: geoLayers.lines.data as any,
        pickable: true,
        getLineColor: (f: any) => [...lineColor(f.properties), 220] as any,
        getLineWidth: 2,
        ...px,
      }),
    );
  if (L.fibre && geoLayers.fibre.data.features.length)
    out.push(
      new GeoJsonLayer({
        id: 'cl-fibre',
        data: geoLayers.fibre.data as any,
        pickable: true,
        opacity: dim,
        getLineColor: [232, 121, 249, 230],
        getLineWidth: 2,
        ...px,
        extensions: [new PathStyleExtension({ dash: true })],
        getDashArray: [4, 3],
      } as any),
    );
  if (L.route && route.data.features.length && !flows) {
    out.push(new GeoJsonLayer({ id: 'cl-route-glow', data: route.data as any, getLineColor: [56, 189, 248, 55], getLineWidth: 9, ...px }));
    out.push(new GeoJsonLayer({ id: 'cl-route', data: route.data as any, pickable: true, getLineColor: [56, 189, 248, 245], getLineWidth: 2.5, ...px }));
  }

  if (L.heatmap && receptorPts.length)
    out.push(
      new HeatmapLayer({
        id: 'cl-heatmap',
        data: receptorPts,
        getPosition: (d: any) => [d.lon, d.lat],
        getWeight: 1,
        radiusPixels: 55,
        intensity: 1.1,
        threshold: 0.06,
        opacity: 0.65 * dim,
      } as any),
    );

  // --- acoustic ring around the generators ---
  const gc = genCenterOf(c.fit);
  if (L.ring && gc && c.ring > 1)
    out.push(
      new ScatterplotLayer({
        id: 'cl-acoustic-ring',
        data: [{ position: gc, r: c.ring }],
        getPosition: (d: any) => d.position,
        getRadius: (d: any) => d.r,
        radiusUnits: 'meters',
        stroked: true,
        filled: true,
        getFillColor: c.ringFail ? [239, 68, 68, 36] : [16, 185, 129, 24],
        getLineColor: c.ringFail ? [248, 113, 113, 235] : [52, 211, 153, 225],
        getLineWidth: 2,
        ...px,
        opacity: dim,
      }),
    );

  // --- Grok drawings ---
  if (s.rings.length)
    out.push(
      new ScatterplotLayer({
        id: 'cl-grok-rings',
        data: s.rings,
        getPosition: (d: any) => [d.lon, d.lat],
        getRadius: (d: any) => d.radius_m,
        radiusUnits: 'meters',
        stroked: true,
        filled: true,
        getFillColor: [56, 189, 248, 22],
        getLineColor: [125, 211, 252, 245],
        getLineWidth: 2,
        ...px,
      }),
    );
  if (s.measures.length)
    out.push(
      new PathLayer({
        id: 'cl-grok-measures',
        data: s.measures,
        getPath: (d: any) => [d.from, d.to],
        getColor: [255, 255, 255, 240],
        getWidth: 2,
        widthUnits: 'pixels',
        capRounded: true,
      }),
    );

  // --- pins ---
  if (L.pins) {
    const misc = [...rowPts('C1'), ...rowPts('C3'), ...rowPts('S1'), ...rowPts('P2')];
    if (misc.length)
      out.push(
        new ScatterplotLayer({
          id: 'cl-pins',
          data: misc,
          pickable: true,
          opacity: dim,
          getPosition: (d: any) => [d.lon, d.lat],
          radiusUnits: 'pixels',
          getRadius: 4,
          stroked: true,
          getFillColor: [148, 163, 184, 230],
          getLineColor: [5, 7, 12, 255],
          getLineWidth: 1,
          ...px,
        }),
      );
  }
  if (L.receptors && receptorPts.length)
    out.push(
      new ScatterplotLayer({
        id: 'cl-receptors',
        data: receptorPts,
        pickable: true,
        opacity: dim,
        getPosition: (d: any) => [d.lon, d.lat],
        radiusUnits: 'pixels',
        getRadius: 4.5,
        stroked: true,
        getLineColor: [5, 7, 12, 255],
        getLineWidth: 1,
        ...px,
        // Red inside the round's acoustic ring, green outside; amber before any test fit is shown.
        getFillColor: (d: any) => (!gc || !L.testfit ? [251, 191, 36, 240] : distM(gc, [d.lon, d.lat]) <= c.ring ? [239, 68, 68, 250] : [16, 185, 129, 240]),
        updateTriggers: { getFillColor: [gc?.[0], gc?.[1], c.ring, L.testfit] },
      }),
    );
  if (L.precedents) {
    const pts = rowPts('C2');
    if (pts.length)
      out.push(
        new ScatterplotLayer({
          id: 'cl-precedents',
          data: pts,
          pickable: true,
          opacity: dim,
          getPosition: (d: any) => [d.lon, d.lat],
          radiusUnits: 'pixels',
          getRadius: 6,
          stroked: true,
          getFillColor: (d: any) => (/refus/i.test(String(d.value ?? d.claim)) ? [244, 63, 94, 235] : [148, 163, 184, 235]),
          getLineColor: [255, 255, 255, 230],
          getLineWidth: 1.5,
          ...px,
        }),
      );
  }
  if (L.substations && !columns) {
    const pts = rowPts('P1');
    if (pts.length)
      out.push(
        new ScatterplotLayer({
          id: 'cl-substations',
          data: pts,
          pickable: true,
          opacity: flows ? 0.7 : 1,
          getPosition: (d: any) => [d.lon, d.lat],
          radiusUnits: 'pixels',
          getRadius: 7,
          stroked: true,
          getFillColor: [129, 140, 248, 240],
          getLineColor: [255, 255, 255, 235],
          getLineWidth: 1.5,
          ...px,
        }),
      );
  }

  // --- 3D test fit ---
  if (c.fit.length)
    out.push(
      new PolygonLayer({
        id: 'cl-testfit',
        data: c.fit,
        pickable: true,
        extruded: true,
        wireframe: true,
        filled: true,
        stroked: false,
        opacity: flows ? 0.22 : 1,
        getPolygon: (d: any) => d.polygon,
        getElevation: (d: any) => Math.max(0.2, d.height),
        getFillColor: (d: any) => [d.color[0], d.color[1], d.color[2], Math.round((hl.has(d.id) ? 255 : 208) * d.alpha)],
        getLineColor: (d: any) => (hl.has(d.id) ? [255, 255, 255, 255] : [Math.min(255, d.color[0] + 60), Math.min(255, d.color[1] + 60), Math.min(255, d.color[2] + 60), Math.round(255 * d.alpha)]),
        material: { ambient: 0.55, diffuse: 0.6, shininess: 24, specularColor: [60, 64, 70] },
        updateTriggers: { getFillColor: [hlKey], getLineColor: [hlKey] },
      } as any),
    );

  // --- Columns view ---
  if (columns) {
    const subs = rowPts('P1').filter((r) => typeof r.value === 'number');
    const max = Math.max(1e-6, ...subs.map((r) => r.value as number));
    if (subs.length)
      out.push(
        new ColumnLayer({
          id: 'cl-col-substations',
          data: subs,
          pickable: true,
          diskResolution: 6,
          radius: 90,
          extruded: true,
          getPosition: (d: any) => [d.lon, d.lat],
          getElevation: (d: any) => Math.max(0.02 * max, d.value),
          elevationScale: 900 / max,
          getFillColor: (d: any) => ramp(d.value / max),
        } as any),
      );
    if (areas.features.length && metric) {
      const cols = areas.features
        .map((f) => ({
          id: f.properties?.id,
          label: `${f.properties?.label ?? ''} · ${metric.replace(/_/g, ' ')}`,
          citation_ids: f.properties?.metric_citation_ids?.[metric] ?? f.properties?.citation_ids ?? [],
          position: geomCenter(f.geometry),
          v: Number(f.properties?.metrics?.[metric]),
        }))
        .filter((d) => d.position && Number.isFinite(d.v));
      const vmax = Math.max(1e-6, ...cols.map((d) => d.v));
      out.push(
        new ColumnLayer({
          id: 'cl-col-areas',
          data: cols,
          pickable: true,
          diskResolution: 24,
          radius: 150,
          extruded: true,
          getPosition: (d: any) => d.position,
          getElevation: (d: any) => d.v,
          elevationScale: 700 / vmax,
          getFillColor: [56, 189, 248, 215],
          updateTriggers: { getElevation: [metric] },
        } as any),
      );
    } else if (receptorPts.length)
      out.push(
        new HexagonLayer({
          id: 'cl-hex-receptors',
          data: receptorPts,
          getPosition: (d: any) => [d.lon, d.lat],
          radius: 70,
          elevationScale: 12,
          extruded: true,
          coverage: 0.85,
          gpuAggregation: false,
        } as any),
      );
  }

  // --- Grid flows view ---
  if (flows && FLOW_PATHS.length) {
    out.push(
      new PathLayer({ id: 'cl-flow-base', data: FLOW_PATHS, getPath: (d: any) => d.path, getColor: (d: any) => [d.color[0], d.color[1], d.color[2], 70], getWidth: 1.5, widthUnits: 'pixels' }),
    );
    out.push(
      new TripsLayer({
        id: 'cl-flow-trips',
        data: TRIPS,
        getPath: (d: any) => d.path,
        getTimestamps: (d: any) => d.ts,
        getColor: (d: any) => d.color,
        widthMinPixels: 4,
        capRounded: true,
        jointRounded: true,
        fadeTrail: true,
        trailLength: FLOW_T * 0.2,
        currentTime: ((c.time / 1000) * 32) % FLOW_T,
      } as any),
    );
  }

  // --- highlight pulse ---
  if (c.hlPos.length)
    out.push(
      new ScatterplotLayer({
        id: 'cl-highlight',
        data: c.hlPos,
        getPosition: (d: any) => d,
        radiusUnits: 'pixels',
        getRadius: 15 + 6 * Math.sin(c.time / 170),
        filled: false,
        stroked: true,
        getLineColor: [255, 255, 255, 235],
        getLineWidth: 2,
        ...px,
      }),
    );
  return out;
}
