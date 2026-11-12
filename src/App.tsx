import { useMemo } from "react";
import { CommunityMap } from "./components/CommunityMap";
import { CountLine } from "./components/CountLine";
import { Legend } from "./components/Legend";
import { SourceChip } from "./components/SourceChip";
import { loadCommunityData } from "./lib/loadData";

export default function App() {
  const data = useMemo(() => loadCommunityData(), []);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Grokathon · Ratcliffe-on-Soar</p>
          <h1>Community layer</h1>
        </div>
        <div className="header-meta">
          <span className="data-source">data/{data.sourceDir}</span>
          <SourceChip row={data.c1} label={data.c1.status === "assumption" ? "assumption" : "C1"} />
          <SourceChip row={data.c2} label={data.c2.status === "assumption" ? "assumption" : "C2"} />
        </div>
      </header>

      <CountLine counts={data.c1.counts} />

      <div className="stage">
        <CommunityMap data={data} />
        <Legend />
      </div>
    </div>
  );
}
