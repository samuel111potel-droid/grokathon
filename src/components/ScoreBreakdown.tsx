import type { GateResult } from '../lib/community';

interface Props {
  score: number;
  weights: Record<string, number>;
  /** Row ids counted under each theme (shown beside the weight). */
  rowIdsByTheme?: Record<string, string[]>;
  gates: GateResult[];
  activeCardIds: string[];
  resolvedCardIds: string[];
  usedRowIds: string[];
}

export function ScoreBreakdown({
  score,
  weights,
  rowIdsByTheme = {},
  gates,
  activeCardIds,
  resolvedCardIds,
  usedRowIds,
}: Props) {
  const themes = Object.entries(weights).sort((a, b) => b[1] - a[1]);

  return (
    <section className="score-breakdown" aria-label="How the community score is made">
      <header className="score-breakdown-head">
        <h2>Community risk</h2>
        <div className="score-breakdown-score">
          <span className="score-number">{score}</span>
          <span className="score-denom">/ 100</span>
        </div>
      </header>
      <p className="score-breakdown-note">
        Active cards {activeCardIds.length}; resolved {resolvedCardIds.length}.
        Rows used: {usedRowIds.join(', ') || '—'}.
      </p>

      <div className="score-tables">
        <table className="score-table">
          <caption>Theme weights (C2 · found + raised_by · refusals ×2)</caption>
          <thead>
            <tr>
              <th scope="col">Theme</th>
              <th scope="col">Weight</th>
              <th scope="col">Row ids</th>
            </tr>
          </thead>
          <tbody>
            {themes.map(([theme, w]) => (
              <tr key={theme}>
                <td>{theme}</td>
                <td>{(w * 100).toFixed(1)}%</td>
                <td className="score-row-ids">
                  {(rowIdsByTheme[theme] ?? []).join(', ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="score-table">
          <caption>Hard gates</caption>
          <thead>
            <tr>
              <th scope="col">Gate</th>
              <th scope="col">Status</th>
              <th scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            {gates.map((g) => (
              <tr key={g.id}>
                <td>{g.label}</td>
                <td>
                  <span className={`gate-pill gate-${g.status}`}>{g.status}</span>
                </td>
                <td>{g.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
