import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  NOISE_LABEL,
  communityRisk,
  gates,
  layoutMeetsFix,
  noiseAtHome,
  themeWeights,
} from './community';
import type {
  C2File,
  HomesFact,
  Layout,
  ObjectionCard,
  ObjectionsFile,
  S2File,
} from '../types';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const sample = (name: string) =>
  JSON.parse(readFileSync(join(root, 'data/sample', name), 'utf8'));

const c1 = sample('C1.json') as HomesFact;
const c2 = sample('C2.json') as C2File;
const s2 = sample('S2.json') as S2File;
const objections = sample('objections.json') as ObjectionsFile;
const round0 = sample('layout_round0.json') as Layout;
const round1 = sample('layout_round1.json') as Layout;
const round2 = sample('layout_round2.json') as Layout;

describe('themeWeights', () => {
  it('weights themes by share of quotes and doubles refusals', () => {
    const { weights, counts, usedRowIds } = themeWeights(c2);
    // Quotes: noise refus(2) + noise cond(1) + visual refus(2) + traffic(1) + flood(1) = 7
    expect(counts.noise).toBe(3);
    expect(counts.visual).toBe(2);
    expect(counts.traffic).toBe(1);
    expect(counts.flood).toBe(1);
    expect(weights.noise).toBeCloseTo(3 / 7, 5);
    expect(weights.visual).toBeCloseTo(2 / 7, 5);
    expect(usedRowIds).toContain('C2');
    expect(usedRowIds).toContain('C2-01');
  });
});

describe('gates', () => {
  it('fails stand-off and flood on round 0, passes both on round 2', () => {
    const g0 = gates(round0, c1, s2);
    const g2 = gates(round2, c1, s2);

    const st0 = g0.gates.find((g) => g.id === 'generator_standoff')!;
    const fl0 = g0.gates.find((g) => g.id === 'flood_zone')!;
    const st2 = g2.gates.find((g) => g.id === 'generator_standoff')!;
    const fl2 = g2.gates.find((g) => g.id === 'flood_zone')!;

    expect(st0.status).toBe('fail');
    expect(fl0.status).toBe('fail');
    expect(st2.status).toBe('pass');
    expect(fl2.status).toBe('pass');
    expect(g0.usedRowIds).toContain('S2');
    expect(g0.usedRowIds).toContain('C1');
    expect(g0.usedRowIds).toContain('S2-FZ2');
  });
});

describe('layoutMeetsFix / communityRisk', () => {
  it('resolves generator-move cards once plant is on the far edge', () => {
    const moveCard = objections.cards.find((c) => c.id === 'OBJ1')!;
    expect(layoutMeetsFix(moveCard, round0)).toBe(false);
    expect(layoutMeetsFix(moveCard, round2)).toBe(true);

    const keep = objections.cards.find((c) => c.id === 'OBJ4')!;
    expect(layoutMeetsFix(keep, round0)).toBe(true);
    expect(layoutMeetsFix(keep, round2)).toBe(true);
  });

  it('score falls between round 0 and round 2 on the sample files', () => {
    const { weights } = themeWeights(c2);
    const r0 = communityRisk(objections.cards, round0, weights);
    const r1 = communityRisk(objections.cards, round1, weights);
    const r2 = communityRisk(objections.cards, round2, weights);

    expect(r0.score).toBeGreaterThanOrEqual(0);
    expect(r0.score).toBeLessThanOrEqual(100);
    expect(r2.score).toBeGreaterThanOrEqual(0);
    expect(r2.score).toBeLessThanOrEqual(100);
    expect(r0.score).toBeGreaterThan(r2.score);
    expect(r1.score).toBeLessThanOrEqual(r0.score);
    expect(r1.score).toBeGreaterThanOrEqual(r2.score);
    expect(r0.usedRowIds.length).toBeGreaterThan(0);
  });

  it('drops a card from the score once its fix is met', () => {
    const weights = { noise: 1 };
    const cards: ObjectionCard[] = [
      {
        id: 'A',
        theme: 'noise',
        who_affected: 'homes',
        fix: 'move generators away from homes',
        row_ids: ['C2-01'],
        severity: 5,
      },
    ];
    const before = communityRisk(cards, round0, weights);
    const after = communityRisk(cards, round2, weights);
    expect(before.score).toBe(100);
    expect(after.score).toBe(0);
    expect(after.resolvedCardIds).toEqual(['A']);
  });
});

describe('noiseAtHome', () => {
  it('falls 6 dB per doubling and labels the estimate', () => {
    const home = { lon: c1.homes[0].lon, lat: c1.homes[0].lat };
    const gens = round0.filter((b) => b.kind === 'generator');
    const near = noiseAtHome(gens, home, s2.source_db);
    const farHome = { lon: home.lon + 0.01, lat: home.lat };
    const far = noiseAtHome(gens, farHome, s2.source_db);

    expect(near.label).toBe(NOISE_LABEL);
    expect(near.db).toBeGreaterThan(far.db);
    expect(near.usedRowIds).toContain('S2-NOISE');
    expect(near.contributions.length).toBe(gens.length);

    // Single source at 2× reference distance → −6 dB from source level.
    const one = [
      {
        id: 'G',
        kind: 'generator' as const,
        height_m: 8,
        polygon: [
          [-1.255, 52.865],
          [-1.2549, 52.865],
          [-1.2549, 52.8651],
          [-1.255, 52.8651],
          [-1.255, 52.865],
        ] as [number, number][],
      },
    ];
    // Place home ~20 m east of centroid (2× 10 m ref) → ~74 dB from 80 dB.
    const at20 = noiseAtHome(
      one,
      { lon: -1.2547, lat: 52.86505 },
      {
        generator: { row_id: 'S2-NOISE', level_db: 80, ref_distance_m: 10 },
      },
    );
    expect(at20.contributions[0].db).toBeLessThan(80);
    expect(at20.contributions[0].db).toBeGreaterThan(60);
  });
});
