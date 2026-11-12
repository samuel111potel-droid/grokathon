const EARTH_M = 6_371_000;

export function haversineM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const dp = toRad(lat2 - lat1);
  const dl = toRad(lon2 - lon1);
  const a =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.sqrt(a));
}

/** Approximate local metres relative to a reference latitude. */
export function metresPerDegree(lat: number): { mPerLat: number; mPerLon: number } {
  const mPerLat = 111_320;
  const mPerLon = 111_320 * Math.cos((lat * Math.PI) / 180);
  return { mPerLat, mPerLon };
}

/**
 * Shortest distance in metres from a point to a closed lon/lat ring.
 * Negative when the point is inside the polygon (distance to nearest edge).
 */
export function distanceToRingM(
  lat: number,
  lon: number,
  ring: [number, number][],
): number {
  if (ring.length < 4) return Number.POSITIVE_INFINITY;

  const lat0 = ring.reduce((s, [, y]) => s + y, 0) / ring.length;
  const { mPerLat, mPerLon } = metresPerDegree(lat0);

  const pts = ring.map(([x, y]) => [(x * mPerLon), (y * mPerLat)] as [number, number]);
  const px = lon * mPerLon;
  const py = lat * mPerLat;

  let inside = false;
  let minDist = Number.POSITIVE_INFINITY;

  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];

    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;

    const dx = xj - xi;
    const dy = yj - yi;
    const len2 = dx * dx + dy * dy;
    const t =
      len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - xi) * dx + (py - yi) * dy) / len2));
    const cx = xi + t * dx;
    const cy = yi + t * dy;
    minDist = Math.min(minDist, Math.hypot(px - cx, py - cy));
  }

  return inside ? -minDist : minDist;
}

export function homeSquare(
  lon: number,
  lat: number,
  halfM = 7,
): [number, number][] {
  const { mPerLat, mPerLon } = metresPerDegree(lat);
  const dLon = halfM / mPerLon;
  const dLat = halfM / mPerLat;
  return [
    [lon - dLon, lat - dLat],
    [lon + dLon, lat - dLat],
    [lon + dLon, lat + dLat],
    [lon - dLon, lat + dLat],
    [lon - dLon, lat - dLat],
  ];
}
