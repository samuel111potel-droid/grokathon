import { describe, expect, it } from "vitest";
import { distanceToRingM, haversineM, homeSquare } from "./geo";

describe("geo", () => {
  it("haversineM is ~0 for identical points", () => {
    expect(haversineM(52.865, -1.255, 52.865, -1.255)).toBeLessThan(0.01);
  });

  it("distanceToRingM is negative inside a square and positive outside", () => {
    const ring: [number, number][] = [
      [-1.259464064, 52.862305066],
      [-1.250535936, 52.862305066],
      [-1.250535936, 52.867694934],
      [-1.259464064, 52.867694934],
      [-1.259464064, 52.862305066],
    ];
    expect(distanceToRingM(52.865, -1.255, ring)).toBeLessThan(0);
    expect(distanceToRingM(52.86, -1.255, ring)).toBeGreaterThan(100);
  });

  it("homeSquare returns a closed pentagon", () => {
    const sq = homeSquare(-1.255, 52.865, 7);
    expect(sq).toHaveLength(5);
    expect(sq[0]).toEqual(sq[4]);
  });
});
