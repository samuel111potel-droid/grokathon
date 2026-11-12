import type {
  CommunityC1,
  CommunityC2,
  CommunityData,
  FactRow,
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

function pick<T>(name: string): { data: T; sourceDir: "live" | "sample" } {
  const liveKey = Object.keys(liveModules).find((k) => basename(k) === name);
  if (liveKey) {
    return { data: JSON.parse(liveModules[liveKey] as string) as T, sourceDir: "live" };
  }
  const sampleKey = Object.keys(sampleModules).find((k) => basename(k) === name);
  if (!sampleKey) {
    throw new Error(`Missing data file: ${name}`);
  }
  return {
    data: JSON.parse(sampleModules[sampleKey] as string) as T,
    sourceDir: "sample",
  };
}

export function passesCheck<T extends FactRow>(row: T): boolean {
  return row.check !== "fail";
}

export function loadCommunityData(): CommunityData {
  const site = pick<SiteFeatureCollection>("site.geojson");
  const c1 = pick<CommunityC1>("C1.json");
  const c2 = pick<CommunityC2>("C2.json");

  const sourceDir =
    site.sourceDir === "live" || c1.sourceDir === "live" || c2.sourceDir === "live"
      ? "live"
      : "sample";

  return {
    site: site.data,
    c1: {
      ...c1.data,
      homes: (c1.data.homes ?? []).filter(passesCheck),
      schools: (c1.data.schools ?? []).filter(passesCheck),
      places_of_worship: (c1.data.places_of_worship ?? []).filter(passesCheck),
      rings: (c1.data.rings ?? []).filter(passesCheck),
      counts: (c1.data.counts ?? []).filter(passesCheck),
    },
    c2: {
      ...c2.data,
      applications: (c2.data.applications ?? []).filter(passesCheck),
    },
    sourceDir,
  };
}
