import { describe, expect, it } from "vitest";
import {
  evaluateGates,
  hallFloorAreaM2,
  maxHallHeightM,
  nearestHomeDistanceM,
} from "./layoutMetrics";
import type { HomeFact, Layout } from "../types";

const layout: Layout = [
  {
    id: "H1",
    kind: "hall",
    polygon: [
      [-1.255, 52.865],
      [-1.254, 52.865],
      [-1.254, 52.8655],
      [-1.255, 52.8655],
      [-1.255, 52.865],
    ],
    height_m: 40,
  },
  {
    id: "G1",
    kind: "generator",
    polygon: [
      [-1.258, 52.862],
      [-1.2575, 52.862],
      [-1.2575, 52.8623],
      [-1.258, 52.8623],
      [-1.258, 52.862],
    ],
    height_m: 12,
  },
];

const homes: HomeFact[] = [
  {
    id: "C1-H01",
    claim: "home",
    value: 1,
    unit: "home",
    lat: 52.8615,
    lon: -1.2585,
    source_org: "t",
    url: "https://example.com",
    quote: "q",
    retrieved: "2026-11-12",
    status: "found",
    check: "pass",
  },
];

describe("layoutMetrics", () => {
  it("reads max hall height and floor area", () => {
    expect(maxHallHeightM(layout)).toBe(40);
    expect(hallFloorAreaM2(layout)).toBeGreaterThan(1000);
  });

  it("computes nearest home distance", () => {
    const d = nearestHomeDistanceM(layout, homes);
    expect(d).toBeGreaterThan(50);
    expect(d).toBeLessThan(500);
  });

  it("fails hall height gate at 40 m and passes floor area under limit", () => {
    const gates = evaluateGates(layout, homes, [
      {
        id: "S1-10",
        claim: "30 m",
        value: 30,
        unit: "m",
        lat: 0,
        lon: 0,
        source_org: "t",
        url: "https://example.com",
        quote: "q",
        retrieved: "2026-11-12",
        status: "assumption",
        check: "pass",
      },
      {
        id: "S1-05",
        claim: "810000",
        value: 810000,
        unit: "m2",
        lat: 0,
        lon: 0,
        source_org: "t",
        url: "https://example.com",
        quote: "q",
        retrieved: "2026-11-12",
        status: "assumption",
        check: "pass",
      },
      {
        id: "S1-HOME",
        claim: "home",
        value: null,
        unit: "m",
        lat: 0,
        lon: 0,
        source_org: "t",
        url: "https://example.com",
        quote: "q",
        retrieved: "2026-11-12",
        status: "computed",
        check: "pass",
      },
    ]);
    expect(gates.find((g) => g.id === "hall_height")?.pass).toBe(false);
    expect(gates.find((g) => g.id === "floor_area")?.pass).toBe(true);
  });
});
