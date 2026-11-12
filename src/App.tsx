import { useEffect, useMemo, useRef, useState } from 'react';
import { ObjectionCards } from './components/ObjectionCards';
import { MetricsStrip } from './components/MetricsStrip';
import { SiteMap, type CameraState } from './components/SiteMap';
import { KIND_COLORS, KIND_LABELS } from './lib/colors';
import { interpolateLayout } from './lib/interpolate';
import {
  loadAllFacts,
  loadHomes,
  loadLayout,
  loadObjections,
  loadSite,
} from './lib/loadData';
import {
  minDistanceM,
  objectionRisk,
  validateLayout,
} from './lib/score';
import type { BlockKind, Layout } from './types';

const ROUNDS = 3;
const ANIM_MS = 1500;

export default function App() {
  const site = useMemo(() => loadSite(), []);
  const homesFact = useMemo(() => loadHomes(), []);
  const objections = useMemo(() => loadObjections(), []);
  const facts = useMemo(() => {
    const ids = objections.cards.flatMap((c) => c.row_ids);
    return loadAllFacts([...ids, 'P1', 'S1', 'S2', 'C1', 'C2', 'SITE']);
  }, [objections.cards]);

  const layouts = useMemo(
    () => [0, 1, 2].map((r) => loadLayout(r)) as [Layout, Layout, Layout],
    [],
  );

  const homes = useMemo(
    () => homesFact.homes.map((h) => ({ lon: h.lon, lat: h.lat })),
    [homesFact],
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
      // Reset to round 0 with animation from current
      const from = layouts[round];
      const to = layouts[0];
      runAnimation(from, to, 0);
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
      // ease in-out
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
  const risk = objectionRisk(
    objections.cards,
    scoredLayout,
    homes,
    facts.C2.value ?? 400,
  );
  const nearest = minDistanceM(scoredLayout, homes);
  const hasIt =
    scoredLayout.some((b) => b.kind === 'hall') &&
    scoredLayout.some((b) => b.kind === 'substation');
  const itLoad = hasIt ? (facts.P1.value ?? 0) : 0;

  const metrics = [
    {
      label: 'Objection risk',
      display: risk.toFixed(1),
      fact: facts.S1,
    },
    {
      label: 'IT load kept',
      display: `${itLoad} ${facts.P1.unit}`,
      fact: facts.P1,
    },
    {
      label: 'Nearest generator → home',
      display: Number.isFinite(nearest) ? `${Math.round(nearest)} m` : '—',
      fact: facts.S2,
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
            <span className="swatch home" />
            Homes
          </li>
        </ul>
      </header>

      <main className="workspace">
        <SiteMap
          id="left"
          label="Round 0 — generators nearest homes"
          layout={layouts[0]}
          siteRing={site.ring}
          homes={homes}
          viewState={viewState}
          onViewStateChange={setViewState}
        />
        <ObjectionCards
          cards={objections.cards}
          facts={facts}
          round={round}
        />
        <SiteMap
          id="right"
          label={`Round ${round} — current plan`}
          layout={displayLayout}
          siteRing={site.ring}
          homes={homes}
          viewState={viewState}
          onViewStateChange={setViewState}
        />
      </main>

      <MetricsStrip metrics={metrics} />
    </div>
  );
}
