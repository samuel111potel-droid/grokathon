import type { FactRow } from '../types';
import { SourceChip } from './SourceChip';

interface Metric {
  label: string;
  display: string;
  fact?: FactRow;
}

interface Props {
  metrics: Metric[];
}

export function MetricsStrip({ metrics }: Props) {
  return (
    <section className="metrics" aria-label="Layout scores">
      {metrics.map((m) => (
        <div key={m.label} className="metric">
          <div className="metric-label">{m.label}</div>
          <div className="metric-row">
            <span className="metric-value">{m.display}</span>
            {m.fact ? <SourceChip fact={m.fact} /> : null}
          </div>
        </div>
      ))}
    </section>
  );
}
