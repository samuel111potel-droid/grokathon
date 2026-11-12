import { useEffect, useRef, type ReactNode } from 'react';
import type { EvidenceRow, ObjectionCard } from '../types/schema';
import { evidence, geoLayers, objections, rounds, thresholdRow, type EvKey } from './data';
import { highlight, replan, setLayer, setRound, setState, useStore, type Tab } from './store';
import { Fig, SourceChip } from './Source';
import { mapApi } from '../map/api';
import { areaMetricKeys } from '../map/layers';

const TABS: { id: Tab; label: string }[] = [
  { id: 'Feed', label: 'Objections' },
  { id: 'Community', label: 'Community' },
  { id: 'Environment', label: 'Environment' },
  { id: 'Power', label: 'Power' },
];
const Sample = () => <span className="badge-amber">sample data</span>;
const sampleOf = (k: EvKey) => (evidence[k].sample ? <Sample /> : null);

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="metric-l">{label}</div>
      <div className="metric-v">{children}</div>
    </div>
  );
}

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
      {rows.map((r) => (
        <div key={r.id} className={`tr ${typeof r.lat === 'number' && typeof r.lon === 'number' ? 'click' : ''}`} title={r.status === 'assumption' && r.basis ? `${r.claim} (assumption: ${r.basis})` : r.claim} onClick={() => focusRow(r)}>
          <div className="td-l">{r.claim}</div>
          <div className="td-v">
            <Fig v={r.value} unit={r.unit} id={r.id} status={r.status} verbose />
          </div>
        </div>
      ))}
    </div>
  );
}

function RoundCard() {
  const round = useStore((s) => s.round);
  const r = rounds[round]?.data;
  if (!r) return <div className="empty">No round files loaded.</div>;
  const score = Number(r.metrics.objection_risk_score) || 0;
  const hue = Math.max(0, 130 - score * 1.3);
  return (
    <div className="pcard">
      <div className="pcard-head">
        <div className="pcard-title" title={r.label}>
          {r.label}
        </div>
        <div className="rseg">
          {rounds.map((x, i) => (
            <button key={i} className={i === round ? 'on' : ''} onClick={() => setRound(i)} title={x.data.label}>
              R{x.data.round}
            </button>
          ))}
        </div>
      </div>
      <div className="pcard-sub" title={r.summary}>
        {r.summary}
      </div>
      <div className="metrics">
        <Metric label="Objection risk">
          <Fig v={score} metric="objection_risk_score" digits={0} />
        </Metric>
        <Metric label="Approval chance">
          <Fig v={r.metrics.approval_probability_pct} unit="%" metric="approval_probability_pct" digits={0} />
        </Metric>
        <Metric label="Level at nearest home">
          <Fig v={r.metrics.predicted_receptor_dba} unit="dBA" metric="predicted_receptor_dba" />
        </Metric>
        <Metric label="Night-time target">{thresholdRow ? <Fig v={thresholdRow.value} unit={thresholdRow.unit} id={thresholdRow.id} /> : <span className="unit">not found</span>}</Metric>
        <Metric label="Noise check">
          <Fig v={r.metrics.bs4142_compliant} metric="bs4142_compliant" />
        </Metric>
        <Metric label="Generators to home">
          <Fig v={r.metrics.nearest_home_to_gen_m} unit="m" metric="nearest_home_to_gen_m" digits={0} />
        </Metric>
      </div>
      <div className="gauge" title="Objection risk">
        <i style={{ width: `${Math.max(0, Math.min(100, score))}%`, backgroundColor: `hsl(${hue}deg 70% 50%)` }} />
      </div>
      <button id="replan-btn" className="cta" onClick={replan}>
        AI Re-Plan Layout →
      </button>
    </div>
  );
}

function ObjCard({ o, round }: { o: ObjectionCard; round: number }) {
  const done = typeof o.resolved_in_round === 'number' && o.resolved_in_round <= round;
  const sev = Number(o.severity) || 0;
  const col = sev >= 5 ? '#fb7185' : sev >= 3 ? '#fbbf24' : '#7c8799';
  const ids = Array.from(new Set([o.precedent_id, ...(o.receptor_ids ?? []), ...(o.citation_ids ?? [])].filter(Boolean))) as string[];
  return (
    <div className={`card ${done ? 'done' : ''}`}>
      <div className="pcard-head">
        <div className="card-t">{o.title}</div>
        <span className="sev" style={{ color: col }}>
          SEV {o.severity}
        </span>
      </div>
      <div className="card-row">
        <span>{o.affected_summary}</span>
      </div>
      <div className="card-row">
        <span className="fix">
          {o.fix}
          {o.secondary_fix ? ` + ${o.secondary_fix}` : ''}
        </span>
        {done ? <span>resolved in R{o.resolved_in_round}</span> : null}
      </div>
      <div className="card-row">
        {ids.map((id) => (
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
      {objections.sample ? (
        <div className="sub-h">
          <Sample />
        </div>
      ) : null}
      {cards.length ? cards.map((o) => <ObjCard key={o.id} o={o} round={round} />) : <div className="empty">No objection cards loaded.</div>}
      {steps.length ? (
        <>
          <div className="sub-h">Grok log</div>
          {steps.map((s) => (
            <div key={s.n} className={`step ${s.kind}`}>
              {s.text}{' '}
              {(s.cites ?? []).map((id) => (
                <SourceChip key={id} id={id} />
              ))}
            </div>
          ))}
        </>
      ) : null}
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
      </div>
      {areaMetricKeys.length ? (
        <div className="toggles">
          {areaMetricKeys.map((k) => (
            <button key={k} className={`toggle ${(cm ?? areaMetricKeys[0]) === k ? 'on' : ''}`} onClick={() => setState((s) => ({ communityMetric: k, layers: { ...s.layers, areas: true } }))}>
              {k.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      ) : null}
      <div className="sub-h">Homes and receptors {sampleOf('C1')}</div>
      <DataTable rows={evidence.C1.data} />
      {hasCat ? (
        <>
          <div className="sub-h">Ward profile {sampleOf('C3')}</div>
          <DataTable rows={by('profile', 'employment', 'election', 'councillor')} />
          <div className="sub-h">Who to engage at each stage</div>
          {STAGES.map((st) => {
            const key = st.split(' (')[0].toLowerCase();
            const rs = stake.filter((r) => (r.stage ?? '').toLowerCase().startsWith(key));
            return (
              <div key={st} className="tr" title={rs.map((r) => r.claim).join('; ')}>
                <div className="td-l">
                  <span className="unit">{st} · </span>
                  {rs.length ? rs.map((r) => (r.status === 'not_found' ? 'not found' : r.claim)).join('; ') : '—'}
                </div>
                <div className="td-v">
                  {rs.map((r) => (
                    <SourceChip key={r.id} id={r.id} />
                  ))}
                </div>
              </div>
            );
          })}
          <div className="sub-h">Infrastructure gaps</div>
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
                <a href={r.url} target="_blank" rel="noreferrer" style={{ color: '#7dd3fc' }} onClick={(e) => e.stopPropagation()}>
                  {r.claim}
                </a>
              ) : (
                r.claim
              )}
            </div>
            <div className="td-v">
              <Fig v={r.value} unit={r.unit} id={r.id} status={r.status} verbose />
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
      <RoundCard />
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? 'on' : ''} onClick={() => setState({ tab: t.id })}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="scroll">{tab === 'Feed' ? <FeedTab /> : tab === 'Community' ? <CommunityTab /> : tab === 'Environment' ? <EnvironmentTab /> : <PowerTab />}</div>
    </aside>
  );
}
