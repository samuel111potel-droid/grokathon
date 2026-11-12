import { useEffect, useRef, type ReactNode } from 'react';
import type { EvidenceRow, ObjectionCard } from '../types/schema';
import { evidence, geoLayers, objections, rounds, thresholdRow, type EvKey } from './data';
import { highlight, replan, setLayer, setRound, setState, useStore, type Tab } from './store';
import { Fig, SourceChip } from './Source';
import { mapApi } from '../map/api';
import { areaMetricKeys } from '../map/layers';

const TABS: Tab[] = ['Feed', 'Community', 'Environment', 'Power'];
const Sample = () => <span className="badge-amber">sample data</span>;
const sampleOf = (k: EvKey) => (evidence[k].sample ? <Sample /> : null);

function Toggle({ id, label, color }: { id: string; label: string; color: string }) {
  const on = useStore((s) => !!s.layers[id]);
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={() => setLayer(id, !on)}>
      <span className="swatch" style={{ background: color }} />
      {label}
    </button>
  );
}

function focusRow(r: EvidenceRow) {
  if (typeof r.lon !== 'number' || typeof r.lat !== 'number') return;
  highlight([r.id]);
  void mapApi.flyTo({ center: [r.lon, r.lat], duration: 1600 });
}

function DataTable({ rows }: { rows: EvidenceRow[] }) {
  if (!rows.length) return <div className="empty">No rows loaded.</div>;
  return (
    <div>
      {rows.map((r) => {
        const pin = typeof r.lat === 'number' && typeof r.lon === 'number';
        return (
          <div key={r.id} className={`tr ${pin ? 'click' : ''}`} title={r.claim} onClick={() => focusRow(r)}>
            <div className="td-l">
              {r.status === 'assumption' ? (
                <span className="badge-amber mr-1" title={r.basis}>
                  assumption
                </span>
              ) : null}
              {r.claim}
            </div>
            <div className="td-v">
              <Fig v={r.value} unit={r.unit} id={r.id} status={r.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="tr" style={{ paddingLeft: 0, paddingRight: 0 }}>
      <div className="td-l text-slate-400">{k}</div>
      <div className="td-v">{children}</div>
    </div>
  );
}

function RoundBlock() {
  const round = useStore((s) => s.round);
  const r = rounds[round]?.data;
  if (!r)
    return (
      <div className="sec">
        <div className="empty">No round files loaded.</div>
      </div>
    );
  const score = Number(r.metrics.objection_risk_score) || 0;
  const hue = Math.max(0, 130 - score * 1.3);
  return (
    <>
      <div className="sec">
        <div className="sec-h">Test fit rounds {rounds[round].sample ? <Sample /> : null}</div>
        <div className="stepper">
          {rounds.map((x, i) => (
            <button key={i} className={i === round ? 'on' : ''} onClick={() => setRound(i)} title={x.data.summary}>
              <span className="rk">R{x.data.round}</span>
              <span className="rl">{x.data.label}</span>
            </button>
          ))}
        </div>
        <button id="replan-btn" className="cta" onClick={replan}>
          AI Re-Plan Layout →
        </button>
        <div className="mt-2 text-slate-400">{r.summary}</div>
      </div>
      <div className="sec">
        <div className="sec-h">Objection risk</div>
        <div className="flex items-baseline justify-between">
          <span className="text-[20px] leading-none">
            <Fig v={score} metric="objection_risk_score" digits={0} />
          </span>
          <span className="text-slate-400">
            Approval chance <Fig v={r.metrics.approval_probability_pct} unit="%" metric="approval_probability_pct" digits={0} />
          </span>
        </div>
        <div className="gauge mt-1 mb-1">
          <i style={{ width: `${Math.max(0, Math.min(100, score))}%`, backgroundColor: `hsl(${hue}deg 70% 50%)` }} />
        </div>
        <Row k="Predicted level at nearest home">
          <Fig v={r.metrics.predicted_receptor_dba} unit="dBA" metric="predicted_receptor_dba" />
        </Row>
        <Row k="Night-time target">
          {thresholdRow ? <Fig v={thresholdRow.value} unit={thresholdRow.unit} id={thresholdRow.id} /> : <span className="text-slate-500 italic">not found</span>}
        </Row>
        <Row k="Noise check">
          <Fig v={r.metrics.bs4142_compliant} metric="bs4142_compliant" />
        </Row>
        <Row k="Generators to nearest home">
          <Fig v={r.metrics.nearest_home_to_gen_m} unit="m" metric="nearest_home_to_gen_m" digits={0} />
        </Row>
      </div>
    </>
  );
}

function ObjCard({ o, round }: { o: ObjectionCard; round: number }) {
  const done = typeof o.resolved_in_round === 'number' && o.resolved_in_round <= round;
  const sev = Number(o.severity) || 0;
  const col = sev >= 5 ? '#f43f5e' : sev >= 3 ? '#f59e0b' : '#64748b';
  return (
    <div className={`card ${done ? 'done' : ''}`} style={{ borderLeftColor: col }}>
      <div className="flex items-center gap-2">
        <span className="sev" style={{ color: col, borderColor: col }}>
          SEV {o.severity}
        </span>
        <span className="badge">{o.theme}</span>
        {done ? <span className="badge-est">resolved R{o.resolved_in_round}</span> : null}
      </div>
      <div className="card-t mt-1">{o.title}</div>
      <div className="mt-1 text-slate-400 flex flex-wrap gap-1 items-baseline">
        <span>{o.affected_summary}</span>
        {(o.receptor_ids ?? []).map((id) => (
          <SourceChip key={id} id={id} />
        ))}
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-1">
        <span className="text-slate-500">Precedent</span>
        {o.precedent_id ? <SourceChip id={o.precedent_id} /> : <span>—</span>}
        <span className="text-slate-500 ml-2">Fix</span>
        <span className="text-emerald-300">
          {o.fix}
          {o.secondary_fix ? ` + ${o.secondary_fix}` : ''}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {(o.citation_ids ?? []).map((id) => (
          <SourceChip key={id} id={id} />
        ))}
      </div>
    </div>
  );
}

function FeedTab() {
  const round = useStore((s) => s.round);
  const steps = useStore((s) => s.steps);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [steps.length]);
  const cards = (Array.isArray(objections.data) ? objections.data : []).slice(0, 6);
  return (
    <>
      <div className="sub-h">Objections {objections.sample ? <Sample /> : null}</div>
      {cards.length ? cards.map((o) => <ObjCard key={o.id} o={o} round={round} />) : <div className="empty">No objection cards loaded.</div>}
      <div className="sub-h">Grok steps</div>
      {steps.length ? (
        steps.map((s) => (
          <div key={s.n} className={`step ${s.kind}`}>
            {s.text}{' '}
            {(s.cites ?? []).map((id) => (
              <SourceChip key={id} id={id} />
            ))}
          </div>
        ))
      ) : (
        <div className="empty">Press Space or pick a suggestion to run Grok.</div>
      )}
      <div ref={end} style={{ height: 8 }} />
    </>
  );
}

const STAGES = ['Pre-app', 'LDO compliance (Rushcliffe)', 'Grid (NGED/NESO)', 'Environmental permit (EA)', 'Construction (County highways)', 'Operation'];

function CommunityTab() {
  const cm = useStore((s) => s.communityMetric);
  const rows = evidence.C3.data;
  const hasCat = rows.some((r) => r.category);
  const by = (...c: string[]) => rows.filter((r) => c.includes(r.category ?? ''));
  const stake = by('stakeholder');
  const docs = [...by('planning_doc'), ...evidence.C2.data];
  return (
    <>
      <div className="toggles">
        <Toggle id="receptors" label="Homes" color="#fbbf24" />
        <Toggle id="heatmap" label="Home density" color="#f97316" />
        <Toggle id="precedents" label="Precedents" color="#f43f5e" />
        {geoLayers.areas.data.features.length ? <Toggle id="areas" label="Ward shading" color="#38bdf8" /> : null}
        <Toggle id="pins" label="Evidence pins" color="#94a3b8" />
      </div>
      {areaMetricKeys.length ? (
        <div className="toggles">
          {areaMetricKeys.map((k) => (
            <button
              key={k}
              className={`toggle ${(cm ?? areaMetricKeys[0]) === k ? 'on' : ''}`}
              onClick={() => setState((s) => ({ communityMetric: k, layers: { ...s.layers, areas: true } }))}
            >
              {k.replace(/_/g, ' ')}
            </button>
          ))}
          {geoLayers.areas.sample ? <Sample /> : null}
        </div>
      ) : null}
      <div className="sub-h">Homes and receptors {sampleOf('C1')}</div>
      <DataTable rows={evidence.C1.data} />
      {hasCat ? (
        <>
          <div className="sub-h">Key metrics · ward aggregates {sampleOf('C3')}</div>
          <DataTable rows={by('profile', 'employment', 'election', 'councillor')} />
          <div className="sub-h">Who to engage at each stage · public bodies only</div>
          {STAGES.map((st) => {
            const key = st.split(' (')[0].toLowerCase();
            const rs = stake.filter((r) => (r.stage ?? '').toLowerCase().startsWith(key));
            return (
              <div key={st} className="tr" title={rs.map((r) => r.claim).join('; ')}>
                <div className="td-l">
                  <span className="text-slate-500">{st} · </span>
                  {rs.length ? rs.map((r) => (r.status === 'not_found' ? 'not found' : r.claim)).join('; ') : '—'}
                </div>
                <div className="td-v flex gap-1">
                  {rs.map((r) => (
                    <SourceChip key={r.id} id={r.id} />
                  ))}
                </div>
              </div>
            );
          })}
          <div className="sub-h">Pain points · infrastructure gaps</div>
          <DataTable rows={by('infrastructure_gap')} />
        </>
      ) : (
        <>
          <div className="sub-h">Community profile {sampleOf('C3')}</div>
          <DataTable rows={rows} />
        </>
      )}
      <div className="sub-h">Planning documents and precedents {sampleOf('C2')}</div>
      {docs.length ? (
        docs.map((r) => (
          <div key={r.id} className={`tr ${typeof r.lat === 'number' ? 'click' : ''}`} title={r.claim} onClick={() => focusRow(r)}>
            <div className="td-l">
              {r.url && /^https?:\/\//.test(r.url) ? (
                <a href={r.url} target="_blank" rel="noreferrer" className="text-sky-300 hover:underline" onClick={(e) => e.stopPropagation()}>
                  {r.claim}
                </a>
              ) : (
                r.claim
              )}
            </div>
            <div className="td-v">
              <Fig v={r.value} unit={r.unit} id={r.id} status={r.status} />
            </div>
          </div>
        ))
      ) : (
        <div className="empty">No rows loaded.</div>
      )}
    </>
  );
}

function EnvironmentTab() {
  const zones = Array.from(new Set(geoLayers.flood.data.features.map((f) => f.properties?.zone))).filter((z) => z != null);
  return (
    <>
      <div className="toggles">
        <Toggle id="flood" label={zones.length ? `Flood zones ${zones.sort().join(' / ')}` : 'Flood zones'} color="#3b82f6" />
        <Toggle id="contamination" label="Contamination / ash" color="#d97706" />
        <Toggle id="ecology" label="Ecology" color="#22c55e" />
        <Toggle id="terrain" label="Terrain" color="#a8a29e" />
        {geoLayers.flood.sample || geoLayers.contamination.sample || geoLayers.ecology.sample ? <Sample /> : null}
      </div>
      <div className="sub-h">Site constraints {sampleOf('S1')}</div>
      <DataTable rows={evidence.S1.data} />
      <div className="sub-h">Rules of thumb {sampleOf('S2')}</div>
      <DataTable rows={evidence.S2.data} />
    </>
  );
}

function PowerTab() {
  return (
    <>
      <div className="toggles">
        <Toggle id="substations" label="Substations" color="#818cf8" />
        <Toggle id="route" label="HV route" color="#38bdf8" />
        <Toggle id="lines" label="Overhead lines" color="#facc15" />
        <Toggle id="fibre" label="Fibre" color="#e879f9" />
        {geoLayers.lines.sample || geoLayers.fibre.sample ? <Sample /> : null}
      </div>
      <div className="sub-h">Substations and headroom {sampleOf('P1')}</div>
      <DataTable rows={evidence.P1.data} />
      <div className="sub-h">Route, crossings and unit cost {sampleOf('P2')}</div>
      <DataTable rows={evidence.P2.data} />
    </>
  );
}

export function LeftPanel() {
  const tab = useStore((s) => s.tab);
  return (
    <aside className="panel">
      <RoundBlock />
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => setState({ tab: t })}>
            {t}
          </button>
        ))}
      </div>
      <div className="scroll">
        {tab === 'Feed' ? <FeedTab /> : tab === 'Community' ? <CommunityTab /> : tab === 'Environment' ? <EnvironmentTab /> : <PowerTab />}
      </div>
    </aside>
  );
}
