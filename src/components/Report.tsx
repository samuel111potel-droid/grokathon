// End report: an in-app view laid out as white landscape pages. Every figure is read from the loaded
// data files and keeps its source chip. No export pipeline (repo rule).
import { useEffect, useState, type ReactNode } from 'react';
import type { EvidenceRow } from '../types/schema';
import { anySample, evidence, EVIDENCE_KEYS, objections, rounds, thresholdRow } from './data';
import { setState, useStore } from './store';
import { Fig, SourceChip } from './Source';
import { mapApi } from '../map/api';

const GBP = '£';
const MIL = 'm';
const SITE = 'Ratcliffe-on-Soar';

function Page({ n, title, sub, long, children }: { n: number; title: string; sub: string; long?: boolean; children: ReactNode }) {
  return (
    <section className={`rp-page ${long ? 'rp-long' : ''}`}>
      <div className="rp-t">{title}</div>
      <div className="rp-st">{sub}</div>
      <div className="rp-body">{children}</div>
      <div className="rp-no">
        {anySample ? <span className="rp-sample">sample data · </span> : null}
        {n}
      </div>
    </section>
  );
}
function Kpi({ v, c }: { v: ReactNode; c: string }) {
  return (
    <div className="rp-kpi">
      <div className="rp-kpi-v">{v}</div>
      <div className="rp-kpi-c">{c}</div>
    </div>
  );
}
const cell = (r: EvidenceRow) => <Fig v={r.value} unit={r.unit} id={r.id} status={r.status} />;

export function Report() {
  const open = useStore((s) => s.report);
  const [hero, setHero] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    const m = mapApi.map;
    if (!m) return;
    try {
      // Grab the current 3D view for the cover (the canvas is only readable inside a render event).
      m.once('render', () => {
        try {
          setHero(m.getCanvas().toDataURL('image/jpeg', 0.86));
        } catch {
          /* cover falls back to a plain band */
        }
      });
      m.triggerRepaint();
    } catch {
      /* no map: cover falls back to a plain band */
    }
  }, [open]);
  if (!open || !rounds.length) return null;

  const li = rounds.length - 1;
  const first = rounds[0].data;
  const last = rounds[li].data;
  const objs = (Array.isArray(objections.data) ? objections.data : []).slice(0, 6);
  const sub = evidence.P1.data.find((r) => typeof r.value === 'number' && (r.value as number) > 0);
  const routeRow = evidence.P2.data.find((r) => /km/i.test(r.unit ?? '') && typeof r.value === 'number');
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const allRows = EVIDENCE_KEYS.flatMap((k) => evidence[k].data);

  return (
    <div className="rp">
      <button className="rp-close" onClick={() => setState({ report: false })}>
        Close report
      </button>

      <section className="rp-page">
        <div className="rp-c1">Test fit and underwrite for</div>
        <div className="rp-c2">{SITE}</div>
        <div className="rp-c3">
          <Fig v={last.metrics.it_load_mw} unit="MW IT" metric="it_load_mw" round={li} /> data centre test fit on the former {SITE} Power Station, Rushcliffe, Nottinghamshire
        </div>
        <div className="rp-c4">
          ConsentLoop DC | {today} | Working draft{anySample ? ' | sample data, not for decisions' : ''}
        </div>
        <div className="rp-note">Massing from the live map view. {last.label}.</div>
        {hero ? <img className="rp-hero" src={hero} alt="" /> : <div className="rp-hero" />}
      </section>

      <Page n={1} title="Executive summary" sub={last.label}>
        <div className="rp-kpis">
          <Kpi v={<Fig v={last.metrics.it_load_mw} unit="MW IT" metric="it_load_mw" round={li} />} c="Test fit capacity in the final round" />
          <Kpi
            v={
              <>
                <Fig v={first.metrics.objection_risk_score} metric="objection_risk_score" round={0} digits={0} /> → <Fig v={last.metrics.objection_risk_score} metric="objection_risk_score" round={li} digits={0} />
              </>
            }
            c="Objection risk score, first round to final round"
          />
          <Kpi v={<Fig v={last.metrics.approval_probability_pct} unit="%" metric="approval_probability_pct" round={li} digits={0} />} c="Modelled approval chance in the final round" />
          <Kpi v={<Fig v={last.underwrite.risk_adjusted_land_value_gbp_m} prefix={GBP} unit={MIL} metric="risk_adjusted_land_value_gbp_m" round={li} />} c="Risk-adjusted land value in the final round" />
        </div>
        <div className="rp-cols">
          <p>
            <b>Scheme: </b>
            {last.summary}
          </p>
          <p>
            <b>What changed: </b>
            {last.applied_fixes?.length ? `${last.applied_fixes.join('; ')}.` : 'No fixes applied.'}
          </p>
          <p>
            <b>Community: </b>
            {objs.length
              ? objs.slice(0, 2).map((o) => (
                  <span key={o.id}>
                    {o.affected_summary}{' '}
                    {(o.receptor_ids ?? []).map((id) => (
                      <SourceChip key={id} id={id} />
                    ))}
                    .{' '}
                  </span>
                ))
              : 'No objection cards loaded.'}
          </p>
          <p>
            <b>Noise: </b>Predicted level at the nearest home moves from <Fig v={first.metrics.predicted_receptor_dba} unit="dBA" metric="predicted_receptor_dba" round={0} /> in the first round to{' '}
            <Fig v={last.metrics.predicted_receptor_dba} unit="dBA" metric="predicted_receptor_dba" round={li} /> in the final round, against a night-time target of{' '}
            {thresholdRow ? <Fig v={thresholdRow.value} unit={thresholdRow.unit} id={thresholdRow.id} /> : 'not found'}. Noise check: <Fig v={first.metrics.bs4142_compliant} metric="bs4142_compliant" round={0} />, then{' '}
            <Fig v={last.metrics.bs4142_compliant} metric="bs4142_compliant" round={li} />.
          </p>
          <p>
            <b>Power: </b>
            {sub ? (
              <>
                {sub.claim}: {cell(sub)}.{' '}
              </>
            ) : (
              'No substation row with headroom loaded. '
            )}
            {routeRow ? (
              <>
                {routeRow.claim}: {cell(routeRow)}.
              </>
            ) : null}
          </p>
          <p>
            <b>Underwrite: </b>Farmland baseline <Fig v={last.underwrite.farmland_baseline_gbp_m} prefix={GBP} unit={MIL} metric="farmland_baseline_gbp_m" round={li} digits={2} />; industrial downside floor{' '}
            <Fig v={last.underwrite.industrial_downside_gbp_m} prefix={GBP} unit={MIL} metric="industrial_downside_gbp_m" round={li} digits={2} />; first-round risk-adjusted value{' '}
            <Fig v={first.underwrite.risk_adjusted_land_value_gbp_m} prefix={GBP} unit={MIL} metric="risk_adjusted_land_value_gbp_m" round={0} />; final-round risk-adjusted value{' '}
            <Fig v={last.underwrite.risk_adjusted_land_value_gbp_m} prefix={GBP} unit={MIL} metric="risk_adjusted_land_value_gbp_m" round={li} />, after grid capex of{' '}
            <Fig v={last.underwrite.grid_connection_capex_gbp_m} prefix={GBP} unit={MIL} metric="grid_connection_capex_gbp_m" round={li} digits={2} /> and mitigation of{' '}
            <Fig v={last.underwrite.mitigation_and_s106_capex_gbp_m} prefix={GBP} unit={MIL} metric="mitigation_and_s106_capex_gbp_m" round={li} digits={2} />.
          </p>
        </div>
      </Page>

      <Page n={2} title="Community risk register" sub="Likely objections, precedent and the fix that answers each">
        <table className="rp-table">
          <thead>
            <tr>
              <th>Objection</th>
              <th>Theme</th>
              <th>Severity</th>
              <th>Who is affected</th>
              <th>Precedent</th>
              <th>Fix</th>
              <th>Resolved</th>
            </tr>
          </thead>
          <tbody>
            {objs.map((o) => (
              <tr key={o.id}>
                <td className="k">{o.title}</td>
                <td>{o.theme}</td>
                <td>{o.severity}</td>
                <td>
                  {o.affected_summary}{' '}
                  {(o.citation_ids ?? []).map((id) => (
                    <SourceChip key={id} id={id} />
                  ))}
                </td>
                <td>{o.precedent_id ? <SourceChip id={o.precedent_id} /> : '—'}</td>
                <td>
                  {o.fix}
                  {o.secondary_fix ? `; ${o.secondary_fix}` : ''}
                </td>
                <td>{typeof o.resolved_in_round === 'number' ? (rounds[o.resolved_in_round]?.data.label ?? `Round ${o.resolved_in_round}`) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Page>

      <Page n={3} title="Noise and value by layout" sub="Each round of the test fit, from the round files">
        <table className="rp-table">
          <thead>
            <tr>
              <th>Round</th>
              <th>IT load</th>
              <th>Generators to nearest home</th>
              <th>Level at nearest home</th>
              <th>Noise check</th>
              <th>Objection risk</th>
              <th>Approval chance</th>
              <th>Gross powered land</th>
              <th>Grid capex</th>
              <th>Mitigation</th>
              <th>Risk-adjusted value</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r, i) => (
              <tr key={i}>
                <td className="k">{r.data.label}</td>
                <td>
                  <Fig v={r.data.metrics.it_load_mw} unit="MW" metric="it_load_mw" round={i} />
                </td>
                <td>
                  <Fig v={r.data.metrics.nearest_home_to_gen_m} unit="m" metric="nearest_home_to_gen_m" round={i} digits={0} />
                </td>
                <td>
                  <Fig v={r.data.metrics.predicted_receptor_dba} unit="dBA" metric="predicted_receptor_dba" round={i} />
                </td>
                <td>
                  <Fig v={r.data.metrics.bs4142_compliant} metric="bs4142_compliant" round={i} />
                </td>
                <td>
                  <Fig v={r.data.metrics.objection_risk_score} metric="objection_risk_score" round={i} digits={0} />
                </td>
                <td>
                  <Fig v={r.data.metrics.approval_probability_pct} unit="%" metric="approval_probability_pct" round={i} digits={0} />
                </td>
                <td>
                  <Fig v={r.data.underwrite.gross_powered_land_gbp_m} prefix={GBP} unit={MIL} metric="gross_powered_land_gbp_m" round={i} />
                </td>
                <td>
                  <Fig v={r.data.underwrite.grid_connection_capex_gbp_m} prefix={GBP} unit={MIL} metric="grid_connection_capex_gbp_m" round={i} digits={2} />
                </td>
                <td>
                  <Fig v={r.data.underwrite.mitigation_and_s106_capex_gbp_m} prefix={GBP} unit={MIL} metric="mitigation_and_s106_capex_gbp_m" round={i} digits={2} />
                </td>
                <td className="k">
                  <Fig v={r.data.underwrite.risk_adjusted_land_value_gbp_m} prefix={GBP} unit={MIL} metric="risk_adjusted_land_value_gbp_m" round={i} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rp-note">Calculated figures are estimates; each chip opens the method and its sourced inputs.</p>
      </Page>

      <Page n={4} title="Power" sub="Substations, headroom, route and unit cost">
        <table className="rp-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Value</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {[...evidence.P1.data, ...evidence.P2.data].map((r) => (
              <tr key={r.id}>
                <td>{r.claim}</td>
                <td>{cell(r)}</td>
                <td>{r.status === 'assumption' ? 'Assumption' : r.status === 'not_found' ? 'Not found' : r.source_org}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Page>

      <Page n={5} title="Sources" sub="Every row behind this report, with its status" long>
        <table className="rp-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Claim</th>
              <th>Source</th>
              <th>Status</th>
              <th>Red Team</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((r) => (
              <tr key={r.id}>
                <td>
                  <SourceChip id={r.id} />
                </td>
                <td>{r.claim}</td>
                <td>{r.source_org || '—'}</td>
                <td>{r.status.replace('_', ' ')}</td>
                <td>{r.check === 'pass' ? 'pass' : 'not checked'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Page>
    </div>
  );
}
