import { fmtNum, rounds } from './data';
import { useStore, type CalcTarget } from './store';
import { Fig } from './Source';

const GBP = '£';
const MILLION = 'm';

export function ValueLadder() {
  const round = useStore((s) => s.round);
  const drawerOpen = useStore((s) => !!s.drawer);
  const cur = rounds[round];
  const base = rounds[0];
  if (!cur || !base) return null;
  const u = cur.data.underwrite;
  const m = cur.data.metrics;
  const bars = [
    { label: 'Farmland', v: u.farmland_baseline_gbp_m, key: 'farmland_baseline_gbp_m', rd: round, color: '#64748b' },
    { label: 'Sheds downside floor', v: u.industrial_downside_gbp_m, key: 'industrial_downside_gbp_m', rd: round, color: '#94a3b8' },
    { label: `R${base.data.round} risk-adjusted`, v: base.data.underwrite.risk_adjusted_land_value_gbp_m, key: 'risk_adjusted_land_value_gbp_m', rd: 0, color: '#fb7185' },
    { label: `R${cur.data.round} powered land`, v: u.risk_adjusted_land_value_gbp_m, key: 'risk_adjusted_land_value_gbp_m', rd: round, color: '#38bdf8' },
  ];
  const max = Math.max(...bars.map((b) => Number(b.v) || 0), 0.0001);
  const acres = Number(m.gross_site_acres) || 0;
  const perAcreK = acres > 0 ? (u.risk_adjusted_land_value_gbp_m * 1000) / acres : null;
  const perAcreCalc: CalcTarget = {
    type: 'calc',
    claim: 'Net risk-adjusted land value per acre',
    value: perAcreK === null ? '—' : `${GBP}${fmtNum(perAcreK, 0)}k per acre`,
    method: 'Risk-adjusted land value for the current round divided by gross site acres, computed in the browser from the round file.',
    citation_ids: cur.data.metric_sources?.risk_adjusted_land_value_gbp_m?.citation_ids ?? u.citation_ids ?? [],
  };
  return (
    <div className={`ladder ${drawerOpen ? 'ladder-shift' : ''}`} id="value-ladder">
      <div className="ladder-h">
        <span>Value ladder</span>
        {cur.sample ? <span className="badge-amber">sample data</span> : null}
      </div>
      {bars.map((b) => (
        <div key={b.label} className="ladder-row">
          <span>{b.label}</span>
          <span className="bar">
            <i style={{ width: `${Math.max(1, ((Number(b.v) || 0) / max) * 100)}%`, background: b.color }} />
          </span>
          <Fig v={b.v} prefix={GBP} unit={MILLION} metric={b.key} round={b.rd} digits={2} />
        </div>
      ))}
      <div className="ladder-foot">
        <div>
          <span className="metric-l">IT load</span>
          <Fig v={m.it_load_mw} unit="MW" metric="it_load_mw" />
        </div>
        <div>
          <span className="metric-l">Grid capex</span>
          <Fig v={u.grid_connection_capex_gbp_m} prefix={GBP} unit={MILLION} metric="grid_connection_capex_gbp_m" digits={2} />
        </div>
        <div>
          <span className="metric-l">Nearest home</span>
          <Fig v={m.predicted_receptor_dba} unit="dBA" metric="predicted_receptor_dba" />
        </div>
        <div>
          <span className="metric-l">Net per acre</span>
          <Fig v={perAcreK} prefix={GBP} unit="k" calc={perAcreCalc} digits={0} />
        </div>
      </div>
    </div>
  );
}
