import type { BlockKind } from '../types';

/** RGBA 0–255 colours by block kind. */
export const KIND_COLORS: Record<BlockKind, [number, number, number, number]> = {
  hall: [56, 132, 168, 220],
  generator: [196, 98, 42, 230],
  battery: [72, 140, 96, 220],
  substation: [120, 110, 150, 220],
};

export const KIND_LABELS: Record<BlockKind, string> = {
  hall: 'Hall',
  generator: 'Generator',
  battery: 'Battery',
  substation: 'Substation',
};
