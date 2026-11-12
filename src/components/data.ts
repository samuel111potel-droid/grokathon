// Lane 5 data loader. Everything is bundled local JSON: zero network calls for data.
// Lookup order per file: data/out (or the lane's canonical path) -> data/fixtures -> data/fixtures_ui.
import type { EvidenceRow, ObjectionCard, LayoutRound, MSCIReceipt } from '../types/schema';

// data/cache holds raw licensed scratch and must never be bundled.
const jsonMods = import.meta.glob(['/data/**/*.json', '!/data/cache/**'], { eager: true }) as Record<string, any>;
const geoMods = import.meta.glob(['/data/**/*.geojson', '!/data/cache/**'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export interface Loaded<T> {
  data: T;
  sample: boolean;
  path: string | null;
}
export type FC = { type: 'FeatureCollection'; features: any[] };
const EMPTY_FC: FC = { type: 'FeatureCollection', features: [] };

function pickJson<T>(primary: string, name: string, fallback: T): Loaded<T> {
  const cands = [primary, `/data/fixtures/${name}`, `/data/fixtures_ui/${name}`];
  for (let i = 0; i < cands.length; i++) {
    const m = jsonMods[cands[i]];
    if (m !== undefined) return { data: (m.default ?? m) as T, sample: i > 0, path: cands[i] };
  }
  return { data: fallback, sample: true, path: null };
}

function pickGeo(primary: string, name: string): Loaded<FC> {
  const cands = [primary, `/data/fixtures/${name}`, `/data/fixtures_ui/${name}`];
  for (let i = 0; i < cands.length; i++) {
    const raw = geoMods[cands[i]];
    if (raw === undefined) continue;
    try {
      const j = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const fc: FC = j.type === 'FeatureCollection' ? j : { type: 'FeatureCollection', features: [j] };
      return { data: fc, sample: i > 0, path: cands[i] };
    } catch {
      /* fall through to the next candidate */
    }
  }
  return { data: EMPTY_FC, sample: true, path: null };
}

// ---------- evidence rows ----------
export const EVIDENCE_KEYS = ['P1', 'P2', 'C1', 'C2', 'C3', 'S1', 'S2'] as const;
export type EvKey = (typeof EVIDENCE_KEYS)[number];

export const failedIds = new Set<string>();
export const rowsById = new Map<string, EvidenceRow>();
export const rowMeta = new Map<string, { file: EvKey; sample: boolean }>();
export const evidence = {} as Record<EvKey, Loaded<EvidenceRow[]>>;

let checked = 0;
let passed = 0;
for (const k of EVIDENCE_KEYS) {
  const l = pickJson<EvidenceRow[]>(`/data/out/${k}.json`, `${k}.json`, []);
  const all = Array.isArray(l.data) ? l.data : [];
  const kept: EvidenceRow[] = [];
  for (const r of all) {
    if (!r || !r.id) continue;
    if (r.check || r.status === 'found') checked++;
    if (r.check === 'pass') passed++;
    // Only Red Team passes reach the screen: a 'found' row needs check === 'pass'.
    // Assumption and not_found rows stay, with their labels.
    if (r.check === 'fail' || (r.status === 'found' && r.check !== 'pass')) {
      failedIds.add(r.id);
      continue;
    }
    kept.push(r);
    rowsById.set(r.id, r);
    rowMeta.set(r.id, { file: k, sample: l.sample });
  }
  evidence[k] = { ...l, data: kept };
}
export const redTeam = { passed, checked };

// ---------- other files ----------
export const objections = pickJson<ObjectionCard[]>('/data/out/objections.json', 'objections.json', []);
export const rounds: Loaded<LayoutRound>[] = [0, 1, 2]
  .map((i) => pickJson<LayoutRound | null>(`/data/rounds/round${i}.json`, `round${i}.json`, null))
  .filter((l) => l.data && (l.data as any).features) as Loaded<LayoutRound>[];
export const receiptsFile = pickJson<MSCIReceipt[]>('/data/receipts/msci_receipts.json', 'msci_receipts.json', []);
export const receiptsById = new Map<string, MSCIReceipt>();
for (const r of Array.isArray(receiptsFile.data) ? receiptsFile.data : []) if (r?.id) receiptsById.set(r.id, r);

export const m1 = pickJson<any>('/data/out/M1_summary.json', 'M1_summary.json', null);
export const m1Items = new Map<string, any>();
(function flattenM1(d: any) {
  if (!d) return;
  const lists = Array.isArray(d) ? [d] : Object.values(d).filter(Array.isArray);
  for (const list of lists as any[][]) for (const it of list) if (it && typeof it === 'object' && it.id) m1Items.set(it.id, it);
})(m1.data);

export const site = pickGeo('/data/site.geojson', 'site.geojson');
export const receptors = pickGeo('/data/out/receptors.geojson', 'receptors.geojson');
export const route = pickGeo('/data/out/power_route.geojson', 'power_route.geojson');
export const LAYER_FILES = ['flood', 'contamination', 'ecology', 'lines', 'fibre', 'areas'] as const;
export type LayerFile = (typeof LAYER_FILES)[number];
export const geoLayers = {} as Record<LayerFile, Loaded<FC>>;
for (const n of LAYER_FILES) geoLayers[n] = pickGeo(`/data/out/layers/${n}.geojson`, `layers/${n}.geojson`);

export const agentScript = pickJson<any[]>('/data/agent/script.json', 'script.json', []);

// ---------- geometry helpers ----------
export function geomCenter(geom: any): [number, number] | null {
  if (!geom) return null;
  let sx = 0,
    sy = 0,
    n = 0;
  const walk = (c: any) => {
    if (typeof c?.[0] === 'number') {
      sx += c[0];
      sy += c[1];
      n++;
    } else if (Array.isArray(c)) c.forEach(walk);
  };
  walk(geom.coordinates);
  return n ? [sx / n, sy / n] : null;
}

// Reference pin from AGENTS.md section 0, used only if no boundary file is loaded.
const REF_PIN: [number, number] = [-1.2550158, 52.8652963];
const sitePoly = site.data.features.find((f) => f?.geometry?.type === 'Polygon' || f?.geometry?.type === 'MultiPolygon');
export const siteRing: number[][] = sitePoly
  ? sitePoly.geometry.type === 'Polygon'
    ? sitePoly.geometry.coordinates[0]
    : sitePoly.geometry.coordinates[0][0]
  : [];
export const siteCenter: [number, number] = (sitePoly && geomCenter({ coordinates: siteRing.slice(0, -1) })) || REF_PIN;

export interface Pt {
  id: string;
  label: string;
  lon: number;
  lat: number;
  citation_ids: string[];
}
// A receptor pin must rest on at least one usable row that is not 'not_found' (a "none found" row is not a home).
const pinnable = (ids: string[]) => !ids.length || ids.some((id) => rowsById.get(id)?.status === 'assumption' || rowsById.get(id)?.status === 'found');
export const receptorPts: Pt[] = receptors.data.features
  .filter((f: any) => pinnable(f?.properties?.citation_ids ?? []))
  .map((f: any, i: number) => {
    const c = geomCenter(f.geometry);
    if (!c) return null;
    const p = f.properties || {};
    return { id: p.id ?? `receptor-${i}`, label: p.label ?? 'Dwelling', lon: c[0], lat: c[1], citation_ids: p.citation_ids ?? [] };
  })
  .filter(Boolean) as Pt[];

export function rowPts(key: EvKey): (EvidenceRow & { lon: number; lat: number })[] {
  return evidence[key].data.filter((r) => typeof r.lat === 'number' && typeof r.lon === 'number') as any;
}

// Static features addressable as "feature:<id>" (round features are resolved separately).
export const featureIndex = new Map<string, { lon: number; lat: number; label: string; citation_ids: string[] }>();
function indexFC(fc: FC) {
  for (const f of fc.features) {
    const id = f?.properties?.id;
    const c = geomCenter(f?.geometry);
    if (id && c) featureIndex.set(id, { lon: c[0], lat: c[1], label: f.properties.label ?? id, citation_ids: f.properties.citation_ids ?? [] });
  }
}
[site.data, receptors.data, route.data, ...LAYER_FILES.map((n) => geoLayers[n].data)].forEach(indexFC);

// Night-time threshold row: read from S2, never typed into the UI.
export const thresholdRow: EvidenceRow | undefined = evidence.S2.data.find(
  (r) => /dba?/i.test(r.unit ?? '') && typeof r.value === 'number' && ((r as any).kind === 'threshold' || /target|threshold|limit|background|night/i.test(r.claim)),
);

// ---------- citations ----------
export type Citation =
  | { kind: 'row'; row: EvidenceRow; sample: boolean }
  | { kind: 'receipt'; receipt: MSCIReceipt; sample: boolean }
  | { kind: 'm1'; item: any; sample: boolean }
  | { kind: 'failed' }
  | { kind: 'unknown' };

export function resolveCitation(id: string): Citation {
  const row = rowsById.get(id);
  if (row) return { kind: 'row', row, sample: rowMeta.get(id)?.sample ?? false };
  const receipt = receiptsById.get(id);
  if (receipt) return { kind: 'receipt', receipt, sample: receiptsFile.sample };
  const item = m1Items.get(id);
  if (item) return { kind: 'm1', item, sample: m1.sample };
  if (failedIds.has(id)) return { kind: 'failed' };
  return { kind: 'unknown' };
}
export const isCitable = (id: string) => {
  const k = resolveCitation(id).kind;
  return k !== 'failed' && k !== 'unknown';
};

export const sampleSources: string[] = [
  ...EVIDENCE_KEYS.filter((k) => evidence[k].sample),
  ...(objections.sample ? ['objections'] : []),
  ...(rounds.some((r) => r.sample) ? ['rounds'] : []),
  ...(site.sample ? ['site'] : []),
  ...(receptors.sample ? ['receptors'] : []),
  ...(route.sample ? ['power_route'] : []),
  ...LAYER_FILES.filter((n) => geoLayers[n].sample && geoLayers[n].data.features.length),
  ...(receiptsFile.sample ? ['msci_receipts'] : []),
];
export const anySample = sampleSources.length > 0;

export function fmtNum(v: number, digits = 1): string {
  return v.toLocaleString('en-GB', { maximumFractionDigits: digits });
}

// Round metrics the engine calculates (same list as scripts/check_traceability.py).
export const CALCULATED = new Set([
  'predicted_receptor_dba',
  'objection_risk_score',
  'approval_probability_pct',
  'bs4142_compliant',
  'risk_adjusted_land_value_gbp_m',
  'gross_powered_land_gbp_m',
]);
