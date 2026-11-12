import type {
  FactRow,
  HomesFact,
  Layout,
  ObjectionsFile,
} from '../types';

type JsonModule = Record<string, unknown> | unknown[];

/** Raw text modules so `.geojson` is parsed as JSON, not JS. */
const liveModules = import.meta.glob('../../data/live/*.{json,geojson}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const sampleModules = import.meta.glob('../../data/sample/*.{json,geojson}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function pickModule(fileName: string): JsonModule {
  const liveKey = Object.keys(liveModules).find((k) =>
    k.includes(`/${fileName}`),
  );
  if (liveKey) return JSON.parse(liveModules[liveKey]) as JsonModule;
  const sampleKey = Object.keys(sampleModules).find((k) =>
    k.includes(`/${fileName}`),
  );
  if (sampleKey) return JSON.parse(sampleModules[sampleKey]) as JsonModule;
  throw new Error(
    `Missing data file: ${fileName} (checked data/live then data/sample)`,
  );
}

export function loadJson<T>(fileName: string): T {
  return pickModule(fileName) as T;
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

export function loadHomes(): HomesFact {
  return loadJson<HomesFact>('C1.json');
}

export function loadFact(fileName: string): FactRow {
  return loadJson<FactRow>(fileName);
}

export function loadObjections(): ObjectionsFile {
  return loadJson<ObjectionsFile>('objections.json');
}

export function loadLayout(round: number): Layout {
  return loadJson<Layout>(`layout_round${round}.json`);
}

export function loadAllFacts(ids: string[]): Record<string, FactRow> {
  const map: Record<string, FactRow> = {};
  const site = loadSite();
  map[site.fact.id] = site.fact;
  map.SITE = site.fact;

  const fileById: Record<string, string> = {
    C1: 'C1.json',
    C2: 'C2.json',
    P1: 'P1.json',
    S1: 'S1.json',
    S2: 'S2.json',
    OBJ: 'objections.json',
  };

  for (const id of ids) {
    if (map[id]) continue;
    const file = fileById[id];
    if (file) map[id] = loadFact(file);
  }

  for (const [id, file] of Object.entries(fileById)) {
    if (!map[id]) map[id] = loadFact(file);
  }

  return map;
}
