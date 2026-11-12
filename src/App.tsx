import { useMemo, useState } from "react";
import { CommunityMap } from "./components/CommunityMap";
import { CountLine } from "./components/CountLine";
import { FiguresFooter } from "./components/FiguresFooter";
import { GatesStrip } from "./components/GatesStrip";
import { Legend } from "./components/Legend";
import { ObjectionCards } from "./components/ObjectionCards";
import { PowerPanel } from "./components/PowerPanel";
import { SourceChip } from "./components/SourceChip";
import { evaluateGates } from "./lib/layoutMetrics";
import { loadAppData } from "./lib/loadData";

const ROUND_LABELS = [
  "Round 0 · halls 40 m, generators on SW edge",
  "Round 1 · halls 30 m",
  "Round 2 · generators opposite side, heights step down NNE",
];

export default function App() {
  const data = useMemo(() => loadAppData(), []);
  const [round, setRound] = useState(0);
  const layout = data.layouts[round];

  const gates = useMemo(
    () => evaluateGates(layout, data.c1.homes, data.s1.rows),
    [layout, data.c1.homes, data.s1.rows],
  );

  const figureStats = useMemo(() => {
    const rows = [
      ...data.c1.counts,
      ...gates.map((g) => g.row),
      data.p1.rows.find((r) => r.id === "P1-01"),
      data.p1.rows.find((r) => r.id === "P1-17"),
      ...data.p1.rows.filter((r) => r.id.startsWith("P1-Q")),
    ].filter(Boolean);

    const unique = new Map(rows.map((r) => [r!.id, r!]));
    const list = [...unique.values()];
    const withSource = list.filter((r) => Boolean(r.url)).length;
    const assumptionOrComputed = list.filter(
      (r) => r.status === "assumption" || r.status === "computed",
    ).length;
    return {
      onScreen: list.length,
      withSource,
      assumptionOrComputed,
    };
  }, [data, gates]);

  const replan = () => setRound((r) => (r + 1) % 3);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Grokathon · Ratcliffe-on-Soar · data/{data.sourceDir}</p>
          <h1>Community layer</h1>
        </div>
        <div className="header-meta">
          <span className="data-source">data/{data.sourceDir}</span>
          <SourceChip row={data.c1} />
          <SourceChip row={data.c2} />
          <button type="button" className="replan" onClick={replan}>
            Re-plan
          </button>
          <div className="round-stepper" role="tablist" aria-label="Layout rounds">
            {[0, 1, 2].map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={round === r}
                className={round === r ? "active" : ""}
                onClick={() => setRound(r)}
              >
                R{r}
              </button>
            ))}
          </div>
        </div>
      </header>

      <p className="round-label">{ROUND_LABELS[round]}</p>
      <CountLine counts={data.c1.counts} />
      <GatesStrip gates={gates} round={round} />

      <div className="workspace">
        <aside className="side-panel">
          <ObjectionCards
            cards={data.objections.cards}
            factIndex={data.factIndex}
            round={round}
          />
          <PowerPanel p1={data.p1} />
        </aside>

        <div className="stage">
          <CommunityMap
            data={{ site: data.site, c1: data.c1, c2: data.c2 }}
            layout={layout}
          />
          <Legend />
        </div>
      </div>

      <FiguresFooter {...figureStats} />
    </div>
  );
}
