import type {
  C3FactFile,
  FactRow,
  HomesFact,
  Layout,
  ObjectionCard,
  ObjectionsFile,
  OfferFact,
} from '../types';

type JsonModule = Record<string, unknown> | unknown[];

const liveModules = import.meta.glob('../../data/live/*.{json,geojson}', {
  eager: true,
  import: 'default',
}) as Record<string, JsonModule>;

const sampleModules = import.meta.glob('../../data/sample/*.{json,geojson}', {
  eager: true,
  import: 'default',
}) as Record<string, JsonModule>;

const LIVE_KEYS = new Set(['C1', 'C2', 'C3', 'P1', 'P2', 'S1', 'S2']);

function moduleFileName(key: string): string {
  const base = key.split('/').pop() ?? key;
  return base;
}

function livePathFor(fileName: string): string | undefined {
  return Object.keys(liveModules).find((k) => k.endsWith(`/${fileName}`));
}

function samplePathFor(fileName: string): string | undefined {
  return Object.keys(sampleModules).find((k) => k.endsWith(`/${fileName}`));
}

/** True when a live file exists for this stem (e.g. C1 → C1.json). */
export function hasLiveFile(stem: string): boolean {
  return Boolean(livePathFor(`${stem}.json`) || livePathFor(`${stem}.geojson`));
}

/**
 * Prefer data/live/; fall back to data/sample/ only when no live file exists.
 * Never returns sample content for a stem that has a live file.
 */
export function pickModule(fileName: string): JsonModule {
  const liveKey = livePathFor(fileName);
  if (liveKey) return liveModules[liveKey];
  const sampleKey = samplePathFor(fileName);
  if (sampleKey) return sampleModules[sampleKey];
  throw new Error(
    `Missing data file: ${fileName} (checked data/live then data/sample)`,
  );
}

export function loadJson<T>(fileName: string): T {
  return pickModule(fileName) as T;
}

/** Parse trailing number from ids like C1-04, C2-14, C3-32. */
export function rowSuffix(id: string): number | null {
  const m = /^[A-Za-z]+\d*-(\d+)$/.exec(id);
  if (!m) return null;
  return Number(m[1]);
}

export function inIdRange(
  id: string,
  prefix: string,
  from: number,
  to: number,
): boolean {
  if (!id.startsWith(`${prefix}-`)) return false;
  const n = rowSuffix(id);
  return n !== null && n >= from && n <= to;
}

/**
 * Flat EvidenceRow list adapter.
 * - Skips status "not_found"
 * - Skips check "fail" EXCEPT for C1 rows (kept as computed)
 * - Drops C1-60 and C1-61 always
 */
export function adaptFlatRows(
  rows: FactRow[],
  opts?: { keepC1Fails?: boolean },
): FactRow[] {
  const keepC1Fails = opts?.keepC1Fails ?? true;
  return rows.filter((row) => {
    if (!row || typeof row.id !== 'string') return false;
    if (row.status === 'not_found') return false;
    if (row.id === 'C1-60' || row.id === 'C1-61') return false;
    if (row.check === 'fail') {
      if (keepC1Fails && row.id.startsWith('C1-')) return true;
      return false;
    }
    return true;
  });
}

export function loadFlatFile(stem: string): FactRow[] {
  const fileName = `${stem}.json`;
  if (!hasLiveFile(stem) && !samplePathFor(fileName)) {
    return [];
  }
  // When live exists, never read sample for this stem.
  const raw = hasLiveFile(stem)
    ? (liveModules[livePathFor(fileName)!] as FactRow[] | FactRow)
    : (pickModule(fileName) as FactRow[] | FactRow);

  // Live files are flat lists. Sample / legacy files may be a single object.
  if (Array.isArray(raw)) {
    return adaptFlatRows(raw as FactRow[]);
  }
  // Legacy nested sample shapes — only used when no live file exists.
  return adaptFlatRows([raw as FactRow]);
}

export function indexRows(rows: FactRow[]): Record<string, FactRow> {
  const map: Record<string, FactRow> = {};
  for (const row of rows) map[row.id] = row;
  return map;
}

export interface SiteData {
  ring: [number, number][];
  fact: FactRow;
  center: { lon: number; lat: number };
}

export function loadSite(): SiteData {
  const geo = loadJson<{
    features: Array<{
      properties: FactRow;
      geometry: { coordinates: [number, number][][] };
    }>;
  }>('site.geojson');
  const feature = geo.features[0];
  const ring = feature.geometry.coordinates[0] as [number, number][];
  return {
    ring,
    fact: feature.properties,
    center: { lon: feature.properties.lon, lat: feature.properties.lat },
  };
}

export function loadC1Rows(): FactRow[] {
  return loadFlatFile('C1');
}

export function loadHomes(): HomesFact {
  const rows = loadC1Rows().filter((r) => inIdRange(r.id, 'C1', 4, 23));
  if (hasLiveFile('C1') || rows.length > 0) {
    const summary: HomesFact = {
      id: 'C1',
      claim: 'Residential receptors near the site (C1-04 … C1-23)',
      value: rows.length,
      unit: 'homes',
      lat: rows[0]?.lat ?? 52.865,
      lon: rows[0]?.lon ?? -1.255,
      source_org: rows[0]?.source_org ?? 'C1',
      url: rows[0]?.url ?? '',
      quote: rows[0]?.quote ?? '',
      retrieved: rows[0]?.retrieved ?? '',
      status: rows[0]?.status ?? 'found',
      check: 'pass',
      homes: rows.map((r) => ({
        ...r,
        value: typeof r.value === 'number' ? r.value : 1,
      })),
    };
    return summary;
  }
  // Legacy sample nested shape when no live C1.
  return loadJson<HomesFact>('C1.json');
}

export function loadListedBuildings(): FactRow[] {
  return loadC1Rows().filter((r) => inIdRange(r.id, 'C1', 32, 59));
}

export function loadC2Rows(): FactRow[] {
  return loadFlatFile('C2');
}

/** Objection cards from live C2-04 … C2-14. Sample cards are never used when live C2 exists. */
export function loadObjections(): ObjectionsFile {
  const liveCards = loadC2Rows()
    .filter((r) => inIdRange(r.id, 'C2', 4, 14))
    .map((r): ObjectionCard => {
      const ext = r as FactRow & {
        theme?: string;
        who?: string;
        who_raised?: string;
      };
      const raisedMatch = /Raised by:\s*([^.]+)\./i.exec(r.claim);
      const who =
        ext.who_raised ??
        ext.who ??
        raisedMatch?.[1]?.trim() ??
        r.source_org;
      return {
        id: r.id,
        theme: ext.theme ?? r.claim,
        who_affected: who,
        fix: '',
        precedent_id: r.id,
        offer_id: r.id,
        row_ids: [r.id],
        severity: 3,
        quote: r.quote,
        who_raised: who,
      };
    });

  if (hasLiveFile('C2')) {
    return {
      id: 'C2',
      claim: 'Planning precedents and objections (C2-04 … C2-14)',
      value: liveCards.length,
      unit: 'cards',
      lat: 52.865,
      lon: -1.255,
      source_org: 'C2',
      url: liveCards[0]?.row_ids[0]
        ? loadC2Rows().find((r) => r.id === liveCards[0].id)?.url ?? ''
        : '',
      quote: '',
      retrieved: '',
      status: 'found',
      check: 'pass',
      cards: liveCards,
    };
  }

  // No live C2: do not invent cards from sample nested objections.json themes.
  // Return empty cards so the UI shows live-only once C2 lands.
  if (samplePathFor('objections.json') && !hasLiveFile('C2')) {
    // Per brief: remove every sample card — return empty when migrating to live shape.
    return {
      id: 'OBJ',
      claim: 'Waiting for live C2 objection rows',
      value: 0,
      unit: 'cards',
      lat: 52.865,
      lon: -1.255,
      source_org: '',
      url: '',
      quote: '',
      retrieved: '',
      status: 'not_found',
      check: 'fail',
      cards: [],
    };
  }

  return {
    id: 'OBJ',
    claim: 'No objection cards',
    value: 0,
    unit: 'cards',
    lat: 52.865,
    lon: -1.255,
    source_org: '',
    url: '',
    quote: '',
    retrieved: '',
    status: 'not_found',
    check: 'fail',
    cards: [],
  };
}

export function loadC3(): C3FactFile {
  const rows = loadFlatFile('C3');
  if (hasLiveFile('C3') || rows.length > 0) {
    const gaps = rows.filter((r) =>
      ['C3-32', 'C3-33', 'C3-35'].includes(r.id),
    );
    const facts = rows.filter((r) => !['C3-32', 'C3-33', 'C3-35'].includes(r.id));
    return {
      id: 'C3',
      claim: 'Ward / community profile',
      value: rows.length,
      unit: 'rows',
      lat: rows[0]?.lat ?? 52.865,
      lon: rows[0]?.lon ?? -1.255,
      source_org: rows[0]?.source_org ?? 'C3',
      url: rows[0]?.url ?? '',
      quote: rows[0]?.quote ?? '',
      retrieved: rows[0]?.retrieved ?? '',
      status: rows[0]?.status ?? 'found',
      check: 'pass',
      facts,
      offers: gaps.map(
        (g): OfferFact => ({
          ...g,
          objection_id: g.id,
          offer: g.claim,
        }),
      ),
      funding_gaps: gaps,
    };
  }
  return loadJson<C3FactFile>('C3.json');
}

export function loadFact(fileName: string): FactRow {
  const stem = fileName.replace(/\.json$/, '');
  if (LIVE_KEYS.has(stem) && hasLiveFile(stem)) {
    const rows = loadFlatFile(stem);
    return (
      rows[0] ?? {
        id: stem,
        claim: `${stem} (empty live file)`,
        value: null,
        unit: '',
        lat: 52.865,
        lon: -1.255,
        source_org: stem,
        url: '',
        quote: '',
        retrieved: '',
        status: 'not_found',
        check: 'fail',
      }
    );
  }
  return loadJson<FactRow>(fileName);
}

export function loadLayout(round: number): Layout {
  return loadJson<Layout>(`layout_round${round}.json`);
}

export function loadAllFacts(ids: string[]): Record<string, FactRow> {
  const map: Record<string, FactRow> = {};
  const site = loadSite();
  map[site.fact.id] = site.fact;
  map.SITE = site.fact;

  for (const stem of LIVE_KEYS) {
    const rows = loadFlatFile(stem);
    for (const row of rows) map[row.id] = row;
    if (rows[0]) map[stem] = rows[0];
  }

  // Optional N1 sample only if no live noise source among S2/C3
  if (!map.N1 && samplePathFor('N1.json') && !hasLiveFile('S2')) {
    try {
      map.N1 = loadJson<FactRow>('N1.json');
    } catch {
      /* optional */
    }
  }

  for (const id of ids) {
    if (!map[id] && id === 'OBJ') {
      map.OBJ = loadObjections();
    }
  }

  void moduleFileName;
  return map;
}

export function liveFileStemsPresent(): string[] {
  return [...LIVE_KEYS].filter((s) => hasLiveFile(s));
}
