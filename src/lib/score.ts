import type { Layout, LayoutBlock, LonLat, ObjectionCard } from '../types';

const EARTH_RADIUS_M = 6_371_000;

/** Haversine distance in metres between two WGS84 points. */
export function haversineM(
  a: LonLat,
  b: LonLat,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δφ = toRad(b.lat - a.lat);
  const Δλ = toRad(b.lon - a.lon);
  const s =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Centroid of a closed or open polygon ring [[lon, lat], ...]. */
export function polygonCentroid(polygon: [number, number][]): LonLat {
  if (polygon.length === 0) {
    return { lon: 0, lat: 0 };
  }
  const ring =
    polygon.length > 1 &&
    polygon[0][0] === polygon[polygon.length - 1][0] &&
    polygon[0][1] === polygon[polygon.length - 1][1]
      ? polygon.slice(0, -1)
      : polygon;
  let lon = 0;
  let lat = 0;
  for (const [x, y] of ring) {
    lon += x;
    lat += y;
  }
  const n = ring.length || 1;
  return { lon: lon / n, lat: lat / n };
}

function generatorCentroids(generators: LayoutBlock[]): LonLat[] {
  return generators
    .filter((b) => b.kind === 'generator')
    .map((b) => polygonCentroid(b.polygon));
}

/**
 * Minimum distance in metres from any generator centroid to any home.
 * Returns Infinity when there are no generators or no homes.
 */
export function minDistanceM(
  generators: LayoutBlock[],
  homes: LonLat[],
): number {
  const gens = generatorCentroids(generators);
  if (gens.length === 0 || homes.length === 0) {
    return Number.POSITIVE_INFINITY;
  }
  let min = Number.POSITIVE_INFINITY;
  for (const g of gens) {
    for (const h of homes) {
      const d = haversineM(g, h);
      if (d < min) min = d;
    }
  }
  return min;
}

/**
 * Count of homes that lie within `radiusM` of at least one generator centroid.
 */
export function homesWithin(
  generators: LayoutBlock[],
  homes: LonLat[],
  radiusM: number,
): number {
  const gens = generatorCentroids(generators);
  if (gens.length === 0 || homes.length === 0 || radiusM < 0) {
    return 0;
  }
  let count = 0;
  for (const h of homes) {
    for (const g of gens) {
      if (haversineM(g, h) <= radiusM) {
        count += 1;
        break;
      }
    }
  }
  return count;
}

function pointInRing(lon: number, lat: number, ring: [number, number][]): boolean {
  // Ray casting; ring may be closed.
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

export interface SiteBounds {
  /** Outer ring [[lon, lat], ...] */
  ring: [number, number][];
}

export interface LayoutValidation {
  ok: boolean;
  errors: string[];
}

/**
 * Validate that every block has a usable polygon and that each vertex
 * (and centroid) lies inside the site ring.
 */
export function validateLayout(layout: Layout, site: SiteBounds): LayoutValidation {
  const errors: string[] = [];
  if (!site.ring || site.ring.length < 4) {
    errors.push('site ring is missing or too short');
    return { ok: false, errors };
  }
  const kinds = new Set([
    'hall',
    'generator',
    'battery',
    'substation',
    'screen',
    'barrier',
    'tree_belt',
    'access',
  ]);
  for (const block of layout) {
    if (!block.id) errors.push('block missing id');
    if (!kinds.has(block.kind)) {
      errors.push(`block ${block.id}: invalid kind ${block.kind}`);
    }
    if (!Array.isArray(block.polygon) || block.polygon.length < 4) {
      errors.push(`block ${block.id}: polygon needs at least 4 positions`);
      continue;
    }
    if (!(block.height_m > 0)) {
      errors.push(`block ${block.id}: height_m must be positive`);
    }
    for (const [lon, lat] of block.polygon) {
      if (!pointInRing(lon, lat, site.ring)) {
        errors.push(`block ${block.id}: vertex [${lon}, ${lat}] outside site`);
        break;
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Objection risk: sum of card severities weighted by how exposed homes are.
 * Noise/buffer cards (those referencing C2 or S2) scale with homesWithin / homes.
 * Capacity cards (P1) stay flat. Visual cards scale lightly with proximity.
 * Result is rounded to one decimal.
 */
export function objectionRisk(
  cards: ObjectionCard[],
  layout: Layout,
  homes: LonLat[] = [],
  radiusM = 400,
): number {
  if (cards.length === 0) return 0;
  const exposed =
    homes.length === 0
      ? 1
      : homesWithin(layout, homes, radiusM) / homes.length;
  const minD = minDistanceM(layout, homes);
  // Soft proximity factor: closer generators → higher factor (caps at 1).
  const proximity =
    homes.length === 0 || !Number.isFinite(minD)
      ? 1
      : Math.min(1, Math.max(0.15, 1 - minD / 800));

  let total = 0;
  for (const card of cards) {
    const ids = new Set(card.row_ids);
    let weight = 0.5;
    if (ids.has('C2') || ids.has('S2') || ids.has('C1')) {
      weight = 0.35 + 0.65 * exposed;
    } else if (ids.has('P1')) {
      const hasHall = layout.some((b) => b.kind === 'hall');
      const hasSub = layout.some((b) => b.kind === 'substation');
      weight = hasHall && hasSub ? 0.2 : 1;
    } else {
      weight = proximity;
    }
    total += card.severity * weight;
  }
  return Math.round(total * 10) / 10;
}
