/**
 * Community hard gates, theme weights, objection risk, and a simple
 * point-source noise estimate. Every function returns the fact-row ids it used.
 */
import { haversineM, minDistanceM, polygonCentroid } from './score';
import type {
  C2File,
  FloodZone,
  HomesFact,
  Layout,
  LayoutBlock,
  LonLat,
  ObjectionCard,
  PlanningQuote,
  S2File,
  SourceDb,
} from '../types';

export const NOISE_LABEL =
  'simple estimate, not an acoustic assessment' as const;

const SITE_CENTRE: LonLat = { lon: -1.255, lat: 52.865 };

export type GateStatus = 'pass' | 'fail';

export interface GateResult {
  id: string;
  label: string;
  status: GateStatus;
  detail: string;
}

export interface GatesResult {
  gates: GateResult[];
  usedRowIds: string[];
}

export interface ThemeWeightsResult {
  weights: Record<string, number>;
  /** Weighted quote counts before normalisation (refusals already doubled). */
  counts: Record<string, number>;
  /** Row ids counted under each (adapted) theme. */
  rowIdsByTheme: Record<string, string[]>;
  usedRowIds: string[];
}

/** Theme overrides applied in the adapter — never written back to C2.json. */
export const C2_THEME_RETAG: Record<string, string> = {
  'C2-07': 'heat',
  'C2-08': 'scale of development',
  'C2-11': 'environment',
  'C2-12': 'airport safeguarding',
};

/** Adapt a C2 row's display theme (retag map first, else the row's theme). */
export function adaptC2Theme(row: { id: string; theme?: string }): string {
  return C2_THEME_RETAG[row.id] ?? (row.theme || '').trim();
}

export interface CommunityRiskResult {
  score: number;
  activeCardIds: string[];
  resolvedCardIds: string[];
  usedRowIds: string[];
}

export interface NoiseAtHomeResult {
  db: number;
  label: typeof NOISE_LABEL;
  usedRowIds: string[];
  contributions: Array<{ generatorId: string; distance_m: number; db: number }>;
}

function uniq(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function pointInRing(lon: number, lat: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function ringSegments(ring: [number, number][]): Array<[LonLat, LonLat]> {
  const pts =
    ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1)
      : ring;
  const segs: Array<[LonLat, LonLat]> = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    segs.push([
      { lon: a[0], lat: a[1] },
      { lon: b[0], lat: b[1] },
    ]);
  }
  return segs;
}

/** Orientation for segment intersection (colinear counts as intersecting). */
function orient(a: LonLat, b: LonLat, c: LonLat): number {
  return (b.lon - a.lon) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lon - a.lon);
}

function onSegment(a: LonLat, b: LonLat, c: LonLat): boolean {
  return (
    Math.min(a.lon, b.lon) <= c.lon + 1e-12 &&
    c.lon <= Math.max(a.lon, b.lon) + 1e-12 &&
    Math.min(a.lat, b.lat) <= c.lat + 1e-12 &&
    c.lat <= Math.max(a.lat, b.lat) + 1e-12
  );
}

function segmentsIntersect(a: LonLat, b: LonLat, c: LonLat, d: LonLat): boolean {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  if (o1 === 0 && onSegment(a, b, c)) return true;
  if (o2 === 0 && onSegment(a, b, d)) return true;
  if (o3 === 0 && onSegment(c, d, a)) return true;
  if (o4 === 0 && onSegment(c, d, b)) return true;
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function polygonsIntersect(a: [number, number][], b: [number, number][]): boolean {
  if (a.length < 3 || b.length < 3) return false;
  const ca = polygonCentroid(a);
  const cb = polygonCentroid(b);
  if (pointInRing(ca.lon, ca.lat, b) || pointInRing(cb.lon, cb.lat, a)) return true;
  for (const [p, q] of ringSegments(a)) {
    for (const [r, s] of ringSegments(b)) {
      if (segmentsIntersect(p, q, r, s)) return true;
    }
  }
  // Any vertex of one inside the other.
  for (const [lon, lat] of a) {
    if (pointInRing(lon, lat, b)) return true;
  }
  for (const [lon, lat] of b) {
    if (pointInRing(lon, lat, a)) return true;
  }
  return false;
}

function homesFromC1(c1: HomesFact | LonLat[]): LonLat[] {
  if (Array.isArray(c1)) return c1;
  return (c1.homes ?? []).map((h) => ({ lon: h.lon, lat: h.lat }));
}

function c1RowIds(c1: HomesFact | LonLat[]): string[] {
  if (Array.isArray(c1)) return [];
  const ids = [c1.id];
  for (const h of c1.homes ?? []) ids.push(h.id);
  return ids;
}

function standOffM(s2: S2File | FactLike): number {
  const v = s2.value;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 400;
}

function floodZonesOf(s2: S2File | FactLike): FloodZone[] {
  if ('flood_zones' in s2 && Array.isArray(s2.flood_zones)) return s2.flood_zones;
  return [];
}

interface FactLike {
  id: string;
  value?: number | null;
  flood_zones?: FloodZone[];
  source_db?: SourceDb;
}

/**
 * Hard rules for a layout. Pass/fail for each gate.
 * Examples: no generator within stand-off of a home; no block inside a flood zone.
 */
export function gates(
  layout: Layout,
  c1: HomesFact | LonLat[],
  s2: S2File | FactLike,
): GatesResult {
  const homes = homesFromC1(c1);
  const standoff = standOffM(s2);
  const floods = floodZonesOf(s2);
  const usedRowIds = uniq([
    ...c1RowIds(c1),
    s2.id,
    ...floods.map((f) => f.id),
  ]);

  const gens = layout.filter((b) => b.kind === 'generator');
  const minD = minDistanceM(gens, homes);
  const standoffPass =
    gens.length === 0 ||
    homes.length === 0 ||
    (Number.isFinite(minD) && minD >= standoff);

  const floodHits: string[] = [];
  for (const block of layout) {
    for (const zone of floods) {
      if (polygonsIntersect(block.polygon, zone.ring)) {
        floodHits.push(`${block.id}∩${zone.id}`);
      }
    }
  }

  const gateList: GateResult[] = [
    {
      id: 'generator_standoff',
      label: `No generator within ${standoff} m of a home`,
      status: standoffPass ? 'pass' : 'fail',
      detail: Number.isFinite(minD)
        ? `nearest generator→home ${Math.round(minD)} m`
        : 'no generators or homes',
    },
    {
      id: 'flood_zone',
      label: 'No block inside a flood zone',
      status: floodHits.length === 0 ? 'pass' : 'fail',
      detail:
        floodHits.length === 0
          ? `checked ${floods.length} flood zone(s)`
          : `overlaps: ${floodHits.join(', ')}`,
    },
  ];

  return { gates: gateList, usedRowIds };
}

function asC2Rows(c2: C2File | PlanningQuote[] | FactLike): PlanningQuote[] {
  if (Array.isArray(c2)) return c2 as PlanningQuote[];
  if ('quotes' in c2 && Array.isArray(c2.quotes)) return c2.quotes as PlanningQuote[];
  // Single fact row with a theme field — treat as one quote.
  if ('theme' in c2 && typeof (c2 as PlanningQuote).theme === 'string') {
    return [c2 as PlanningQuote];
  }
  return [];
}

function isRefusal(q: PlanningQuote): boolean {
  const d = `${q.decision ?? ''} ${q.claim ?? ''}`.toLowerCase();
  return d.includes('refus');
}

function hasRaiser(q: PlanningQuote): boolean {
  return Boolean((q.raised_by ?? '').trim());
}

/**
 * Weight per theme = share of counted C2 rows with that theme.
 * Counts only status "found" rows with a non-empty raised_by (drops decisions,
 * application descriptions, and not-found rows). Refusal rows count double.
 * Theme retags (C2-07/08/11/12) are applied in the adapter, not in the data file.
 */
export function themeWeights(
  c2: C2File | PlanningQuote[] | FactLike,
): ThemeWeightsResult {
  const rows = asC2Rows(c2).filter(
    (q) =>
      q.check !== 'fail' &&
      q.status === 'found' &&
      hasRaiser(q),
  );

  const counts: Record<string, number> = {};
  const rowIdsByTheme: Record<string, string[]> = {};
  let total = 0;

  for (const q of rows) {
    const theme = adaptC2Theme(q);
    if (!theme) continue;
    const w = isRefusal(q) ? 2 : 1;
    counts[theme] = (counts[theme] ?? 0) + w;
    total += w;
    if (!rowIdsByTheme[theme]) rowIdsByTheme[theme] = [];
    rowIdsByTheme[theme].push(q.id);
  }

  const weights: Record<string, number> = {};
  for (const [theme, count] of Object.entries(counts)) {
    weights[theme] = total === 0 ? 0 : count / total;
  }

  const usedRowIds = uniq(Object.values(rowIdsByTheme).flat());
  return { weights, counts, rowIdsByTheme, usedRowIds };
}

function meanCentroid(blocks: LayoutBlock[]): LonLat | null {
  if (blocks.length === 0) return null;
  const pts = blocks.map((b) => polygonCentroid(b.polygon));
  return {
    lon: pts.reduce((s, p) => s + p.lon, 0) / pts.length,
    lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
  };
}

function hasMitigation(
  layout: Layout,
  pattern: RegExp,
): boolean {
  return layout.some((b) => pattern.test(`${b.kind} ${b.id}`));
}

/**
 * Whether the layout already implements the card's fix.
 * Matches free-text fixes and the six allowed ObjectionWriter verbs.
 */
export function layoutMeetsFix(card: ObjectionCard, layout: Layout): boolean {
  const layoutRound = (layout as unknown as { round?: number }).round;
  if (
    typeof card.resolved_in_round === 'number' &&
    typeof layoutRound === 'number'
  ) {
    return layoutRound >= card.resolved_in_round;
  }

  const fix = (card.fix || '').toLowerCase();
  const gens = layout.filter((b) => b.kind === 'generator');
  const halls = layout.filter((b) => b.kind === 'hall');
  const subs = layout.filter((b) => b.kind === 'substation');
  const genC = meanCentroid(gens);
  const hallC = meanCentroid(halls);
  const subC = meanCentroid(subs);

  if (
    fix.includes('move generators') ||
    fix.includes('north-west') ||
    fix.includes('northwest') ||
    (fix.includes('increase') && fix.includes('distance')) ||
    fix.includes('buffer')
  ) {
    // Generators west of site centre ⇒ away from SE homes on this sample site.
    return !!genC && genC.lon <= SITE_CENTRE.lon;
  }

  if (fix.includes('acoustic screen') || fix.includes('add acoustic')) {
    return hasMitigation(layout, /screen|barrier|bund/i);
  }

  if (fix.includes('tree belt') || fix.includes('add tree')) {
    return hasMitigation(layout, /tree|belt|landscape/i);
  }

  if (fix.includes('lower hall')) {
    return halls.length > 0 && halls.every((h) => h.height_m <= 14);
  }

  if (fix.includes('move site access') || fix.includes('move access')) {
    return hasMitigation(layout, /access/i);
  }

  if (fix.includes('move substation')) {
    return !!subC && subC.lon <= SITE_CENTRE.lon;
  }

  if (
    fix.includes('keep halls') ||
    fix.includes('it load') ||
    fix.includes('it capacity')
  ) {
    return halls.length > 0 && subs.length > 0;
  }

  if (fix.includes('shift halls') || fix.includes('inward')) {
    if (!hallC) return false;
    const dLon = hallC.lon - SITE_CENTRE.lon;
    const dLat = hallC.lat - SITE_CENTRE.lat;
    return Math.hypot(dLon, dLat) < 0.0025;
  }

  return false;
}

function themeKeyForCard(
  card: ObjectionCard,
  weights: Record<string, number>,
): string {
  const raw = (card.theme || '').toLowerCase().trim();
  const keys = Object.keys(weights);
  for (const key of keys) {
    if (raw === key || raw.includes(key) || key.includes(raw)) return key;
  }
  // Keyword fallbacks for long-form sample themes.
  if (/noise|acoustic|buffer/.test(raw)) {
    return keys.find((k) => k.includes('noise')) ?? 'noise';
  }
  if (/visual|sight|bulk|height/.test(raw)) {
    return keys.find((k) => k.includes('visual')) ?? 'visual';
  }
  if (/traffic|access|highway|hgv/.test(raw)) {
    return keys.find((k) => k.includes('traffic')) ?? 'traffic';
  }
  if (/flood|drainage/.test(raw)) {
    return keys.find((k) => k.includes('flood')) ?? 'flood';
  }
  if (/capacity|power|grid|jobs|it\b/.test(raw)) {
    return keys.find((k) => k.includes('power') || k.includes('jobs')) ?? 'other';
  }
  return raw || 'other';
}

/**
 * Community objection risk 0–100.
 * A card stops counting once the layout meets its fix.
 * Active cards are weighted by themeWeights and severity.
 */
export function communityRisk(
  cards: ObjectionCard[],
  layout: Layout,
  weights: Record<string, number>,
): CommunityRiskResult {
  const usedRowIds = uniq(cards.flatMap((c) => c.row_ids ?? []));
  if (cards.length === 0) {
    return { score: 0, activeCardIds: [], resolvedCardIds: [], usedRowIds };
  }

  const known = Object.values(weights);
  const meanWeight =
    known.length === 0
      ? 1
      : known.reduce((a, b) => a + b, 0) / known.length;
  const weightOr = (theme: string) =>
    theme in weights ? weights[theme]! : meanWeight;

  let activeSum = 0;
  let totalSum = 0;
  const activeCardIds: string[] = [];
  const resolvedCardIds: string[] = [];

  for (const card of cards) {
    const theme = themeKeyForCard(card, weights);
    const w = weightOr(theme);
    const contrib = Math.max(0, card.severity) * w;
    totalSum += contrib;
    if (layoutMeetsFix(card, layout)) {
      resolvedCardIds.push(card.id);
    } else {
      activeSum += contrib;
      activeCardIds.push(card.id);
    }
  }

  const score =
    totalSum <= 0 ? 0 : Math.round(Math.min(100, Math.max(0, (100 * activeSum) / totalSum)));

  return { score, activeCardIds, resolvedCardIds, usedRowIds };
}

/**
 * Point-source fall-off: 6 dB per doubling of distance, energy-summed over generators.
 * Labelled as a simple estimate, not an acoustic assessment.
 */
export function noiseAtHome(
  generators: LayoutBlock[],
  home: LonLat,
  sourceDb: SourceDb,
): NoiseAtHomeResult {
  const usedRowIds: string[] = [];
  const contributions: NoiseAtHomeResult['contributions'] = [];
  const gens = generators.filter((b) => b.kind === 'generator');

  let linearSum = 0;
  for (const gen of gens) {
    const src = sourceDb.generator ?? sourceDb[gen.kind] ?? sourceDb.default;
    if (!src) continue;
    usedRowIds.push(src.row_id);
    const centre = polygonCentroid(gen.polygon);
    const distance_m = Math.max(1, haversineM(centre, home));
    const ref = Math.max(1e-6, src.ref_distance_m);
    // 6 dB per doubling ≡ 20·log10(d/dref)
    const db = src.level_db - 20 * Math.log10(distance_m / ref);
    contributions.push({ generatorId: gen.id, distance_m, db });
    linearSum += 10 ** (db / 10);
  }

  const totalDb =
    contributions.length === 0 || linearSum <= 0
      ? 0
      : 10 * Math.log10(linearSum);

  return {
    db: Math.round(totalDb * 10) / 10,
    label: NOISE_LABEL,
    usedRowIds: uniq(usedRowIds),
    contributions,
  };
}
