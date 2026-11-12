import type {
  AppData,
  CommunityC1,
  CommunityC2,
  FactRow,
  Layout,
  ObjectionsFile,
  P1File,
  S1File,
  SiteFeatureCollection,
} from "../types";

const liveModules = import.meta.glob("../../data/live/*.{json,geojson}", {
  eager: true,
  query: "?raw",
  import: "default",
});

const sampleModules = import.meta.glob("../../data/sample/*.{json,geojson}", {
  eager: true,
  query: "?raw",
  import: "default",
});

function basename(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base.replace(/\?.*$/, "");
}

function pickRaw(name: string): { raw: string; sourceDir: "live" | "sample" } | null {
  const liveKey = Object.keys(liveModules).find((k) => basename(k) === name);
  if (liveKey) return { raw: liveModules[liveKey] as string, sourceDir: "live" };
  const sampleKey = Object.keys(sampleModules).find((k) => basename(k) === name);
  if (!sampleKey) return null;
  return { raw: sampleModules[sampleKey] as string, sourceDir: "sample" };
}

function pickRequired<T>(name: string): { data: T; sourceDir: "live" | "sample" } {
  const hit = pickRaw(name);
  if (!hit) throw new Error(`Missing data file: ${name}`);
  return { data: JSON.parse(hit.raw) as T, sourceDir: hit.sourceDir };
}

/** Skip not_found and fail rows. Keep computed / assumption / found. */
export function isDisplayableRow(row: FactRow | undefined | null): row is FactRow {
  if (!row) return false;
  if (row.check === "fail") return false;
  if (row.status === "not_found") return false;
  return true;
}

function filterRows<T extends FactRow>(rows: T[] | undefined): T[] {
  return (rows ?? []).filter(isDisplayableRow);
}

function indexFacts(data: Omit<AppData, "factIndex" | "sourceDir">): Record<string, FactRow> {
  const map: Record<string, FactRow> = {};
  const put = (row?: FactRow | null) => {
    if (row && isDisplayableRow(row)) map[row.id] = row;
  };

  const siteProps = data.site.features[0]?.properties;
  put(siteProps);
  put(data.c1);
  put(data.c2);
  put(data.s1);
  put(data.p1);
  put(data.objections);
  for (const h of data.c1.homes) put(h);
  for (const s of data.c1.schools) put(s);
  for (const w of data.c1.places_of_worship) put(w);
  for (const r of data.c1.rings) put(r);
  for (const c of data.c1.counts) put(c);
  for (const a of data.c2.applications) put(a);
  for (const r of data.s1.rows) put(r);
  for (const r of data.p1.rows) put(r);
  return map;
}

export function loadAppData(): AppData {
  const site = pickRequired<SiteFeatureCollection>("site.geojson");
  const c1Raw = pickRequired<CommunityC1>("C1.json");
  const c2Raw = pickRequired<CommunityC2>("C2.json");
  const s1Raw = pickRequired<S1File>("S1.json");
  const p1Raw = pickRequired<P1File>("P1.json");
  const objRaw = pickRequired<ObjectionsFile>("objections.json");
  const r0 = pickRequired<Layout>("layout_round0.json");
  const r1 = pickRequired<Layout>("layout_round1.json");
  const r2 = pickRequired<Layout>("layout_round2.json");

  const sourceDir =
    [site, c1Raw, c2Raw, s1Raw, p1Raw, objRaw, r0, r1, r2].some((x) => x.sourceDir === "live")
      ? "live"
      : "sample";

  const c1: CommunityC1 = {
    ...c1Raw.data,
    homes: filterRows(c1Raw.data.homes),
    schools: filterRows(c1Raw.data.schools),
    places_of_worship: filterRows(c1Raw.data.places_of_worship),
    rings: filterRows(c1Raw.data.rings),
    counts: filterRows(c1Raw.data.counts),
  };

  const c2: CommunityC2 = {
    ...c2Raw.data,
    applications: filterRows(c2Raw.data.applications),
  };

  const s1: S1File = {
    ...s1Raw.data,
    rows: filterRows(s1Raw.data.rows ?? []),
  };

  const p1: P1File = {
    ...p1Raw.data,
    rows: filterRows(p1Raw.data.rows ?? []),
  };

  const objections: ObjectionsFile = {
    ...objRaw.data,
    cards: (objRaw.data.cards ?? []).filter((card) =>
      (card.row_ids ?? []).some((id) => {
        // keep card if any cited row survives filtering later; always keep for now
        return Boolean(id);
      }),
    ),
  };

  const core = {
    site: site.data,
    c1,
    c2,
    s1,
    p1,
    objections,
    layouts: [r0.data, r1.data, r2.data] as [Layout, Layout, Layout],
  };

  return {
    ...core,
    sourceDir,
    factIndex: indexFacts(core),
  };
}

export function resolveFact(
  index: Record<string, FactRow>,
  id: string,
): FactRow | undefined {
  return index[id];
}
