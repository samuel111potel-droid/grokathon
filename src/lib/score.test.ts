import { describe, expect, it } from 'vitest';
import {
  haversineM,
  homesWithin,
  minDistanceM,
  objectionRisk,
  polygonCentroid,
  validateLayout,
} from './score';
import type { Layout, ObjectionCard } from '../types';

const siteRing: [number, number][] = [
  [-1.259464, 52.862305],
  [-1.250536, 52.862305],
  [-1.250536, 52.867695],
  [-1.259464, 52.867695],
  [-1.259464, 52.862305],
];

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

const nearHomesLayout: Layout = [
  {
    id: 'G1',
    kind: 'generator',
    polygon: rect(-1.251, 52.863),
    height_m: 18,
  },
  {
    id: 'H1',
    kind: 'hall',
    polygon: rect(-1.255, 52.865),
    height_m: 22,
  },
  {
    id: 'S1',
    kind: 'substation',
    polygon: rect(-1.256, 52.866),
    height_m: 12,
  },
];

const farLayout: Layout = [
  {
    id: 'G1',
    kind: 'generator',
    polygon: rect(-1.2585, 52.867),
    height_m: 18,
  },
  {
    id: 'H1',
    kind: 'hall',
    polygon: rect(-1.253, 52.864),
    height_m: 22,
  },
  {
    id: 'S1',
    kind: 'substation',
    polygon: rect(-1.254, 52.863),
    height_m: 12,
  },
];

const homes = [
  { lon: -1.2495, lat: 52.8615 },
  { lon: -1.249, lat: 52.8612 },
  { lon: -1.2485, lat: 52.861 },
];

const cards: ObjectionCard[] = [
  {
    id: 'OBJ1',
    theme: 'noise',
    who_affected: 'homes',
    fix: 'move generators',
    row_ids: ['C1', 'C2', 'S2'],
    severity: 5,
  },
  {
    id: 'OBJ4',
    theme: 'capacity',
    who_affected: 'sponsor',
    fix: 'keep halls',
    row_ids: ['P1', 'S1'],
    severity: 2,
  },
];

describe('haversineM / polygonCentroid', () => {
  it('returns ~0 for identical points', () => {
    expect(haversineM({ lon: 0, lat: 0 }, { lon: 0, lat: 0 })).toBe(0);
  });

  it('centroids a closed square', () => {
    const c = polygonCentroid(rect(-1.255, 52.865));
    expect(c.lon).toBeCloseTo(-1.255, 5);
    expect(c.lat).toBeCloseTo(52.865, 5);
  });
});

describe('minDistanceM', () => {
  it('is smaller when generators sit nearer homes', () => {
    const near = minDistanceM(nearHomesLayout, homes);
    const far = minDistanceM(farLayout, homes);
    expect(near).toBeLessThan(far);
    expect(near).toBeGreaterThan(0);
  });

  it('returns Infinity with empty inputs', () => {
    expect(minDistanceM([], homes)).toBe(Number.POSITIVE_INFINITY);
    expect(minDistanceM(nearHomesLayout, [])).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('homesWithin', () => {
  it('counts homes inside the radius of a near generator', () => {
    const nearCount = homesWithin(nearHomesLayout, homes, 400);
    const farCount = homesWithin(farLayout, homes, 400);
    expect(nearCount).toBeGreaterThanOrEqual(farCount);
    expect(nearCount).toBeGreaterThan(0);
  });

  it('returns 0 for non-positive radius edge via empty gens', () => {
    expect(homesWithin([], homes, 400)).toBe(0);
  });
});

describe('validateLayout', () => {
  it('passes a layout fully inside the site', () => {
    const result = validateLayout(nearHomesLayout, { ring: siteRing });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails when a vertex is outside the site', () => {
    const bad: Layout = [
      {
        id: 'G1',
        kind: 'generator',
        polygon: rect(-1.27, 52.865),
        height_m: 18,
      },
    ];
    const result = validateLayout(bad, { ring: siteRing });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('outside site'))).toBe(true);
  });
});

describe('objectionRisk', () => {
  it('drops when generators move away from homes', () => {
    const nearRisk = objectionRisk(cards, nearHomesLayout, homes, 400);
    const farRisk = objectionRisk(cards, farLayout, homes, 400);
    expect(farRisk).toBeLessThan(nearRisk);
  });

  it('returns 0 for no cards', () => {
    expect(objectionRisk([], nearHomesLayout, homes)).toBe(0);
  });
});
