import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  NOISE_LABEL,
  adaptC2Theme,
  communityRisk,
  gates,
  layoutMeetsFix,
  noiseAtHome,
  themeWeights,
} from './community';
import type {
  HomesFact,
  Layout,
  ObjectionCard,
  ObjectionsFile,
  PlanningQuote,
  S2File,
} from '../types';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const sample = (name: string) =>
  JSON.parse(readFileSync(join(root, 'data/sample', name), 'utf8'));
const out = (name: string) =>
  JSON.parse(readFileSync(join(root, 'data/out', name), 'utf8'));

const c1 = sample('C1.json') as HomesFact;
const c2 = out('C2.json') as PlanningQuote[];
const s2 = sample('S2.json') as S2File;
const objections = sample('objections.json') as ObjectionsFile;
const round0 = sample('layout_round0.json') as Layout;
const round1 = sample('layout_round1.json') as Layout;
const round2 = sample('layout_round2.json') as Layout;

describe('themeWeights', () => {
  it('counts only found rows with raised_by, retags, and lists every row id', () => {
    const { weights, counts, usedRowIds, rowIdsByTheme } = themeWeights(c2);

    // No decision / application / not-found rows (empty raised_by).
    expect(usedRowIds).not.toContain('C2-01');
    expect(usedRowIds).not.toContain('C2-02');
    expect(usedRowIds).not.toContain('C2-15');
    expect(usedRowIds).toContain('C2-04');
    expect(usedRowIds).toContain('C2-20');

    // Adapter retags — themes stay "other" in the data file.
    expect(adaptC2Theme({ id: 'C2-07', theme: 'other' })).toBe('heat');
    expect(adaptC2Theme({ id: 'C2-08', theme: 'other' })).toBe(
      'scale of development',
    );
    expect(adaptC2Theme({ id: 'C2-11', theme: 'other' })).toBe('environment');
    expect(adaptC2Theme({ id: 'C2-12', theme: 'other' })).toBe(
      'airport safeguarding',
    );
    expect(rowIdsByTheme.heat).toEqual(['C2-07']);
    expect(rowIdsByTheme['scale of development']).toEqual(['C2-08']);
    expect(rowIdsByTheme.environment).toEqual(['C2-11']);
    expect(rowIdsByTheme['airport safeguarding']).toEqual(['C2-12']);

    // No theme called "other".
    expect(weights).not.toHaveProperty('other');
    expect(Object.keys(rowIdsByTheme)).not.toContain('other');

    // Every counted row id appears under its theme.
    const listed = Object.values(rowIdsByTheme).flat().sort();
    expect(listed).toEqual([...usedRowIds].sort());

    // Refusal (C2-20) counts double within green belt.
    expect(rowIdsByTheme['green belt']).toEqual(
      expect.arrayContaining(['C2-04', 'C2-20']),
    );
    expect(counts['green belt']).toBe(3); // 1 + 2
    expect(weights['green belt']).toBeCloseTo(3 / Object.values(counts).reduce((a, b) => a + b, 0), 5);
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
