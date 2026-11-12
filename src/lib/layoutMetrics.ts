import { haversineM, metresPerDegree } from "./geo";
import type { FactRow, HomeFact, Layout, LayoutBlock } from "../types";

export function polygonAreaM2(ring: [number, number][]): number {
  if (ring.length < 4) return 0;
  const lat0 = ring.reduce((s, [, y]) => s + y, 0) / ring.length;
  const { mPerLat, mPerLon } = metresPerDegree(lat0);
  const pts = ring.map(([lon, lat]) => [lon * mPerLon, lat * mPerLat] as const);
  let area = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    area += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
  }
  return Math.abs(area) / 2;
}

export function blockCentroid(block: LayoutBlock): { lat: number; lon: number } {
  const ring = block.polygon;
  const n = Math.max(1, ring.length - 1);
  let lon = 0;
  let lat = 0;
  for (let i = 0; i < n; i++) {
    lon += ring[i][0];
    lat += ring[i][1];
  }
  return { lon: lon / n, lat: lat / n };
}

export function hallFloorAreaM2(layout: Layout): number {
  return layout
    .filter((b) => b.kind === "hall")
    .reduce((sum, b) => sum + polygonAreaM2(b.polygon), 0);
}

export function maxHallHeightM(layout: Layout): number {
  const halls = layout.filter((b) => b.kind === "hall");
  if (!halls.length) return 0;
  return Math.max(...halls.map((b) => b.height_m));
}

export function nearestHomeDistanceM(
  layout: Layout,
  homes: HomeFact[],
): number {
  const gens = layout.filter((b) => b.kind === "generator");
  const blocks = gens.length ? gens : layout;
  let min = Number.POSITIVE_INFINITY;
  for (const block of blocks) {
    const c = blockCentroid(block);
    for (const home of homes) {
      min = Math.min(min, haversineM(c.lat, c.lon, home.lat, home.lon));
    }
  }
  return min;
}

export type GateId = "hall_height" | "floor_area" | "nearest_home";

export interface GateEvaluation {
  id: GateId;
  label: string;
  pass: boolean;
  display: string;
  row: FactRow;
}

const HOME_STANDOFF_M = 150;

export function evaluateGates(
  layout: Layout,
  homes: HomeFact[],
  s1Rows: FactRow[],
): GateEvaluation[] {
  const heightRow =
    s1Rows.find((r) => r.id === "S1-10") ??
    s1Rows.find((r) => r.unit === "m" && (r.value ?? 0) <= 40) ??
    synthetic("S1-10", "Hall height gate", 30, "m");
  const areaRow =
    s1Rows.find((r) => r.id === "S1-05") ??
    s1Rows.find((r) => r.unit === "m2") ??
    synthetic("S1-05", "Floor area gate", 810_000, "m2");
  const homeRow =
    s1Rows.find((r) => r.id === "S1-HOME") ??
    synthetic(
      "S1-HOME",
      "Nearest home distance (computed from C1)",
      null,
      "m",
      "computed",
    );

  const maxH = maxHallHeightM(layout);
  const area = hallFloorAreaM2(layout);
  const nearest = nearestHomeDistanceM(layout, homes);
  const heightLimit = heightRow.value ?? 30;
  const areaLimit = areaRow.value ?? 810_000;

  return [
    {
      id: "hall_height",
      label: "Hall height ≤ 30 m",
      pass: maxH <= heightLimit,
      display: `${Math.round(maxH)} m`,
      row: heightRow,
    },
    {
      id: "floor_area",
      label: "Floor area < 810,000 m²",
      pass: area < areaLimit,
      display: `${Math.round(area).toLocaleString("en-GB")} m²`,
      row: areaRow,
    },
    {
      id: "nearest_home",
      label: "Nearest home (from C1)",
      pass: Number.isFinite(nearest) && nearest >= HOME_STANDOFF_M,
      display: Number.isFinite(nearest) ? `${Math.round(nearest)} m` : "—",
      row: homeRow,
    },
  ];
}

function synthetic(
  id: string,
  claim: string,
  value: number | null,
  unit: string,
  status: FactRow["status"] = "assumption",
): FactRow {
  return {
    id,
    claim,
    value,
    unit,
    lat: 52.8652963,
    lon: -1.2550158,
    source_org: "Application",
    url: "https://www.rushcliffe.gov.uk/",
    quote: claim,
    retrieved: "2026-11-12",
    status,
    check: "pass",
  };
}
