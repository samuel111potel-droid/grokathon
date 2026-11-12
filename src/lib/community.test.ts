import { describe, expect, it } from 'vitest';
import { noiseAtHome, noiseColor, noiseStepIndex } from './community';
import type { Layout } from '../types';

function rect(
  clon: number,
  clat: number,
  wLon = 0.0004,
  hLat = 0.0003,
): [number, number][] {
  return [
    [clon - wLon, clat - hLat],
    [clon + wLon, clat - hLat],
    [clon + wLon, clat + hLat],
    [clon - wLon, clat + hLat],
    [clon - wLon, clat - hLat],
  ];
}

const near: Layout = [
  {
    id: 'G1',
    kind: 'generator',
    polygon: rect(-1.251, 52.863),
    height_m: 18,
  },
];

const far: Layout = [
  {
    id: 'G1',
    kind: 'generator',
    polygon: rect(-1.2585, 52.867),
    height_m: 18,
  },
];

const home = { lon: -1.2495, lat: 52.8615 };

describe('noiseAtHome', () => {
  it('falls ~6 dB when distance doubles', () => {
    // Place a generator at a known centroid, measure at 100 m and 200 m north.
    const genLat = 52.865;
    const genLon = -1.255;
    const layout: Layout = [
      {
        id: 'G1',
        kind: 'generator',
        polygon: rect(genLon, genLat, 0.00001, 0.00001),
        height_m: 10,
      },
    ];
    // 100 m ≈ 0.000899° lat
    const at100 = noiseAtHome(layout, { lon: genLon, lat: genLat + 0.000899 }, 90);
    const at200 = noiseAtHome(layout, { lon: genLon, lat: genLat + 0.001798 }, 90);
    const drop = at100.db - at200.db;
    expect(drop).toBeGreaterThan(5.5);
    expect(drop).toBeLessThan(6.5);
    expect(at100.label).toContain('not an acoustic assessment');
    expect(at100.rowIds.length).toBeGreaterThan(0);
  });

  it('is quieter when generators move away from homes', () => {
    const nearDb = noiseAtHome(near, home, 90).db;
    const farDb = noiseAtHome(far, home, 90).db;
    expect(farDb).toBeLessThan(nearDb);
  });

  it('energy-sums multiple generators above a single source', () => {
    const two: Layout = [
      ...near,
      {
        id: 'G2',
        kind: 'generator',
        polygon: rect(-1.2505, 52.8628),
        height_m: 18,
      },
    ];
    const one = noiseAtHome(near, home, 90).db;
    const both = noiseAtHome(two, home, 90).db;
    expect(both).toBeGreaterThan(one);
  });
});

describe('noise colour scale', () => {
  it('maps five dB steps cool → hot', () => {
    expect(noiseStepIndex(54)).toBe(0);
    expect(noiseStepIndex(56)).toBe(1);
    expect(noiseStepIndex(58)).toBe(2);
    expect(noiseStepIndex(60)).toBe(3);
    expect(noiseStepIndex(62)).toBe(4);
    const cool = noiseColor(54);
    const hot = noiseColor(62);
    // Hotter bins use more red channel relative to cool teal.
    expect(hot[0]).toBeGreaterThan(cool[0]);
  });
});
