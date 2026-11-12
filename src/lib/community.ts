import { haversineM, polygonCentroid } from './score';
import type { Layout, LayoutBlock, LonLat } from '../types';

/** Reference distance (m) for the assumed generator source level. */
export const NOISE_REF_DISTANCE_M = 10;

/** Disclaimer shown wherever noiseAtHome results appear. */
export const NOISE_DISCLAIMER =
  'simple estimate, not an acoustic assessment';

export interface NoiseAtHomeResult {
  /** Estimated level at the home in dB (energy-summed over generators). */
  db: number;
  /** Row ids consulted for the estimate. */
  rowIds: string[];
  label: typeof NOISE_DISCLAIMER;
}

/**
 * Point-source fall-off: 6 dB per doubling of distance
 * (L = sourceDb − 20·log10(r / r0)), energy-summed over generators.
 */
export function noiseAtHome(
  generators: LayoutBlock[] | Layout,
  home: LonLat,
  sourceDb: number,
  options?: { refDistanceM?: number; rowIds?: string[] },
): NoiseAtHomeResult {
  const ref = options?.refDistanceM ?? NOISE_REF_DISTANCE_M;
  const rowIds = options?.rowIds ?? ['N1', 'C1'];
  const gens = generators
    .filter((b) => b.kind === 'generator')
    .map((b) => polygonCentroid(b.polygon));

  if (gens.length === 0 || !Number.isFinite(sourceDb)) {
    return { db: 0, rowIds, label: NOISE_DISCLAIMER };
  }

  let energy = 0;
  for (const g of gens) {
    const r = Math.max(haversineM(g, home), 1);
    const level = sourceDb - 20 * Math.log10(r / ref);
    energy += 10 ** (level / 10);
  }

  const db = 10 * Math.log10(Math.max(energy, Number.EPSILON));
  return {
    db: Math.round(db * 10) / 10,
    rowIds,
    label: NOISE_DISCLAIMER,
  };
}

/** Five-step dB bins used to colour homes (cool → hot). */
export const NOISE_SCALE_STEPS = [
  { max: 55, label: '≤55 dB', color: [42, 111, 122, 230] as const },
  { max: 57, label: '55–57 dB', color: [74, 143, 98, 230] as const },
  { max: 59, label: '57–59 dB', color: [196, 160, 58, 230] as const },
  { max: 61, label: '59–61 dB', color: [196, 98, 42, 230] as const },
  { max: Infinity, label: '>61 dB', color: [196, 64, 64, 230] as const },
] as const;

export type NoiseRgba = [number, number, number, number];

export function noiseStepIndex(db: number): number {
  for (let i = 0; i < NOISE_SCALE_STEPS.length; i++) {
    if (db <= NOISE_SCALE_STEPS[i].max) return i;
  }
  return NOISE_SCALE_STEPS.length - 1;
}

export function noiseColor(db: number): NoiseRgba {
  const step = NOISE_SCALE_STEPS[noiseStepIndex(db)];
  return [...step.color];
}
