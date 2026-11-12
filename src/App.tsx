import { useEffect, useMemo, useRef, useState } from 'react';
import { SidePanel } from './components/SidePanel';
import { MetricsStrip } from './components/MetricsStrip';
import { SiteMap, type CameraState } from './components/SiteMap';
import { SourceChip } from './components/SourceChip';
import { KIND_COLORS, KIND_LABELS } from './lib/colors';
import {
  NOISE_DISCLAIMER,
  NOISE_SCALE_STEPS,
  noiseAtHome,
} from './lib/community';
import { interpolateLayout } from './lib/interpolate';
import {
  hasLiveFile,
  loadAllFacts,
  loadC3,
  loadHomes,
  loadLayout,
  loadListedBuildings,
  loadObjections,
  loadSite,
  liveFileStemsPresent,
} from './lib/loadData';
import { minDistanceM, validateLayout } from './lib/score';
import type { BlockKind, FactRow, Layout } from './types';

const ROUNDS = 3;
const ANIM_MS = 1500;

function pickNoiseSourceDb(facts: Record<string, FactRow>): {
  db: number;
  fact?: FactRow;
} {
  // Prefer S2-09 (generator dB at stated distance) or any S2 dB row.
  const preferred = facts['S2-09'];
  if (preferred && typeof preferred.value === 'number') {
    return { db: preferred.value as number, fact: preferred };
  }
  const s2Candidates = Object.values(facts).filter(
    (f) =>
      f.id.startsWith('S2') &&
      typeof f.value === 'number' &&
      /dB|noise|generator/i.test(`${f.claim} ${f.unit}`),
  );
  if (s2Candidates[0]) {
    return { db: s2Candidates[0].value as number, fact: s2Candidates[0] };
  }
  // Sample N1 only when no live S2 file exists.
  if (
    typeof facts.N1?.value === 'number' &&
    !hasLiveFile('S2')
  ) {
    return { db: facts.N1.value, fact: facts.N1 };
  }
  return { db: 90, fact: facts.S2 };
}

function pickFact(
  facts: Record<string, FactRow>,
  ids: string[],
): FactRow | undefined {
  for (const id of ids) {
    if (facts[id]) return facts[id];
  }
  return undefined;
}

function formatValue(fact: FactRow | undefined, fallback: string): string {
  if (!fact) return fallback;
  if (fact.value == null) return fallback;
  const raw = Array.isArray(fact.value)
    ? fact.value.join('–')
    : String(fact.value);
  if (/unit not printed|field /i.test(fact.unit) || /mva/i.test(fact.unit)) {
    return `${raw} (unit not stated in source)`;
  }
  return `${raw} ${fact.unit}`.trim();
}

export default function App() {
  const site = useMemo(() => loadSite(), []);
  const homesFact = useMemo(() => loadHomes(), []);
  const listedBuildings = useMemo(() => loadListedBuildings(), []);
  const objections = useMemo(() => loadObjections(), []);
  const c3 = useMemo(() => loadC3(), []);
  const liveStems = useMemo(() => liveFileStemsPresent(), []);
  const liveOnly = liveStems.length > 0;

  const facts = useMemo(() => {
    const ids = objections.cards.flatMap((c) => c.row_ids);
    return loadAllFacts([
      ...ids,
      'P1',
      'P2',
      'S1',
      'S2',
      'C1',
      'C2',
      'C3',
      'SITE',
    ]);
  }, [objections.cards]);

  const layouts = useMemo(
    () => [0, 1, 2].map((r) => loadLayout(r)) as [Layout, Layout, Layout],
    [],
  );

  const homes = useMemo(
    () =>
      homesFact.homes.map((h) => ({
        id: h.id,
        lon: h.lon,
        lat: h.lat,
        fact: h,
      })),
    [homesFact],
  );

  const { db: sourceDb, fact: noiseFact } = useMemo(
    () => pickNoiseSourceDb(facts),
    [facts],
  );

  const [round, setRound] = useState(0);
  const [displayLayout, setDisplayLayout] = useState<Layout>(layouts[0]);
  const [animating, setAnimating] = useState(false);
  const animRef = useRef<number | null>(null);

  const [viewState, setViewState] = useState<CameraState>({
    longitude: site.center.lon,
    latitude: site.center.lat,
    zoom: 14.2,
    pitch: 45,
    bearing: -20,
  });

  useEffect(() => {
    for (let i = 0; i < ROUNDS; i++) {
      const v = validateLayout(layouts[i], { ring: site.ring });
      if (!v.ok) {
        console.warn(`layout_round${i} validation`, v.errors);
      }
    }
  }, [layouts, site.ring]);

  useEffect(() => {
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  function replan() {
    if (animating) return;
    if (round >= ROUNDS - 1) {
      runAnimation(layouts[round], layouts[0], 0);
      return;
    }
    const next = round + 1;
    runAnimation(layouts[round], layouts[next], next);
  }

  function runAnimation(from: Layout, to: Layout, nextRound: number) {
    setAnimating(true);
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ANIM_MS);
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      setDisplayLayout(interpolateLayout(from, to, eased));
      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayLayout(to);
        setRound(nextRound);
        setAnimating(false);
        animRef.current = null;
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }

  const scoredLayout = displayLayout;
  const nearest = minDistanceM(scoredLayout, homes);
  const headroomFact = pickFact(facts, ['P1-03', 'P1-04', 'P1-07', 'P1']);
  const objectionsShown = objections.cards.length;

  const meanNoise =
    homes.length === 0
      ? 0
      : homes.reduce(
          (sum, h) =>
            sum +
            noiseAtHome(scoredLayout, h, sourceDb, { refDistanceM: 7 }).db,
          0,
        ) / homes.length;

  const metrics: {
    label: string;
    display: string;
    fact?: FactRow;
  }[] = [
    {
      label: 'Objections shown',
      display: String(objectionsShown),
    },
    ...(headroomFact
      ? [
          {
            label: 'Nearest substation headroom',
            display: formatValue(headroomFact, '—'),
            fact: headroomFact,
          },
        ]
      : []),
    {
      label: 'computed, generator centre to nearest home',
      display: Number.isFinite(nearest) ? `${Math.round(nearest)} m` : '—',
    },
  ];

  return (
    <div className="app">
      <header className="hero">
        <div className="brand">Ratcliffe Re-plan</div>
        <p className="tagline">
          Data centre layout on the Ratcliffe-on-Soar site — objections answered
          by moving plant away from homes.
        </p>
        <div className="hero-actions">
          <button
            type="button"
            className="replan"
            onClick={replan}
            disabled={animating}
          >
            {round >= ROUNDS - 1 && !animating ? 'Reset to round 0' : 'Re-plan'}
          </button>
          <span className="round-pill">
            Showing round {round}
            {animating ? ' → …' : ''}
            {' · '}
            mean home noise {meanNoise.toFixed(1)} dB
            {liveOnly
              ? ` · live: ${liveStems.join(', ')}`
              : ' · waiting for data/live'}
          </span>
        </div>
        <ul className="legend">
          {(Object.keys(KIND_COLORS) as BlockKind[]).map((kind) => {
            const [r, g, b] = KIND_COLORS[kind];
            return (
              <li key={kind}>
                <span
                  className="swatch"
                  style={{ background: `rgba(${r},${g},${b},0.9)` }}
                />
                {KIND_LABELS[kind]}
              </li>
            );
          })}
          <li>
            <span className="swatch site" />
            Site
          </li>
          <li>
            <span className="swatch listed" />
            Listed (C1-32…59)
          </li>
        </ul>
        <div className="noise-legend" aria-label="Home noise scale in dB">
          <span className="noise-legend-title">
            Home noise (dB)
            {noiseFact && <SourceChip fact={noiseFact} />}
          </span>
          <ol className="noise-steps">
            {NOISE_SCALE_STEPS.map((step) => {
              const [r, g, b] = step.color;
              return (
                <li key={step.label}>
                  <span
                    className="swatch"
                    style={{ background: `rgba(${r},${g},${b},0.95)` }}
                  />
                  {step.label}
                </li>
              );
            })}
          </ol>
          <p className="noise-disclaimer">{NOISE_DISCLAIMER}</p>
        </div>
      </header>

      <main className="workspace">
        <SiteMap
          id="left"
          label="Round 0: original plan"
          layout={layouts[0]}
          siteRing={site.ring}
          homes={homes}
          listedBuildings={listedBuildings}
          sourceDb={sourceDb}
          viewState={viewState}
          onViewStateChange={setViewState}
        />
        <SidePanel
          cards={objections.cards}
          facts={facts}
          c3={c3}
          round={round}
          liveOnly={hasLiveFile('C2')}
        />
        <SiteMap
          id="right"
          label={`Round ${round} — current plan`}
          layout={displayLayout}
          siteRing={site.ring}
          homes={homes}
          listedBuildings={listedBuildings}
          sourceDb={sourceDb}
          viewState={viewState}
          onViewStateChange={setViewState}
        />
      </main>

      <MetricsStrip metrics={metrics} />
    </div>
  );
}
