import type { ReactNode } from 'react';
import { CALCULATED, fmtNum, resolveCitation, rounds } from './data';
import { getState, openSource, setState, useStore, type CalcTarget } from './store';

const stop = (fn: () => void) => (e: { stopPropagation: () => void }) => {
  e.stopPropagation();
  fn();
};

/** Clickable source chip. `id` = evidence row / MSCI receipt; `metric` = calculated round figure; `calc` = figure computed in the browser. */
export function SourceChip({ id, metric, round, calc }: { id?: string; metric?: string; round?: number; calc?: CalcTarget }) {
  if (calc)
    return (
      <button className="chip chip-est" title="Computed in the browser: click for method" onClick={stop(() => openSource(calc))}>
        estimate
      </button>
    );
  if (metric) {
    const rd = round ?? getState().round;
    const src = rounds[rd]?.data.metric_sources?.[metric];
    const est = CALCULATED.has(metric) || !!src?.method;
    return (
      <button
        className={src ? 'chip chip-est' : 'chip chip-bad'}
        title={src ? 'Click for method and inputs' : 'No metric_sources entry for this figure'}
        onClick={stop(() => openSource({ type: 'metric', key: metric, round: rd }))}
      >
        {src ? (est ? 'estimate' : 'source') : 'unsourced'}
      </button>
    );
  }
  if (!id) return null;
  const c = resolveCitation(id);
  if (c.kind === 'failed') return null; // failed Red Team rows are never shown
  const cls =
    c.kind === 'unknown'
      ? 'chip chip-bad'
      : c.kind === 'row' && c.row.status === 'assumption'
        ? 'chip chip-amber'
        : c.kind === 'row' && c.row.status === 'not_found'
          ? 'chip chip-mute'
          : 'chip';
  return (
    <button className={cls} title={c.kind === 'row' ? c.row.claim : id} onClick={stop(() => openSource({ type: 'id', id }))}>
      [{id}]
    </button>
  );
}

/** A figure read from data, always rendered with its source chip. */
export function Fig(p: {
  v: number | string | boolean | null | undefined;
  unit?: string;
  prefix?: string;
  id?: string;
  metric?: string;
  round?: number;
  calc?: CalcTarget;
  digits?: number;
  status?: string;
}) {
  const missing = p.v === null || p.v === undefined || p.v === '';
  const text = typeof p.v === 'number' ? fmtNum(p.v, p.digits ?? 1) : typeof p.v === 'boolean' ? (p.v ? 'pass' : 'fail') : String(p.v);
  return (
    <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
      {missing ? (
        <span className="text-slate-500 italic">{p.status === 'not_found' ? 'not found' : '—'}</span>
      ) : (
        <span className="num">
          {p.prefix}
          {text}
        </span>
      )}
      {!missing && p.unit ? <span className="unit">{p.unit}</span> : null}
      <SourceChip id={p.id} metric={p.metric} round={p.round} calc={p.calc} />
    </span>
  );
}

function KV({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="kv">
      <div className="kv-k">{k}</div>
      <div className="kv-v">{children}</div>
    </div>
  );
}
function utc(s?: string) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}
const human = (k: string) => k.replace(/_/g, ' ');

function Inputs({ ids }: { ids?: string[] }) {
  if (!ids?.length) return <span className="text-slate-500">none listed</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {ids.map((i) => (
        <SourceChip key={i} id={i} />
      ))}
    </span>
  );
}

export function SourceDrawer() {
  const t = useStore((s) => s.drawer);
  let body: ReactNode = null;
  if (t?.type === 'calc') {
    body = (
      <>
        <div className="drawer-id">
          <span className="badge-est">estimate</span> computed in the browser
        </div>
        <div className="drawer-claim">{t.claim}</div>
        <div className="drawer-value num">{t.value}</div>
        <KV k="Method">{t.method}</KV>
        <KV k="Inputs">
          <Inputs ids={t.citation_ids} />
        </KV>
      </>
    );
  } else if (t?.type === 'metric') {
    const r = rounds[t.round]?.data;
    const v = r ? ((r.metrics as any)[t.key] ?? (r.underwrite as any)[t.key]) : undefined;
    const src = r?.metric_sources?.[t.key];
    body = (
      <>
        <div className="drawer-id">
          {CALCULATED.has(t.key) || src?.method ? <span className="badge-est">estimate</span> : <span className="badge">figure</span>} {r?.label}
          {rounds[t.round]?.sample ? <span className="badge-amber ml-2">sample data</span> : null}
        </div>
        <div className="drawer-claim">{human(t.key)}</div>
        <div className="drawer-value num">{typeof v === 'boolean' ? (v ? 'pass' : 'fail') : typeof v === 'number' ? fmtNum(v, 2) : '—'}</div>
        {src ? (
          <>
            <KV k="Method">{src.method || 'No method text; see inputs.'}</KV>
            <KV k="Inputs">
              <Inputs ids={src.citation_ids} />
            </KV>
          </>
        ) : (
          <div className="drawer-warn">No metric_sources entry for this figure in the round file. It cannot be traced yet.</div>
        )}
      </>
    );
  } else if (t?.type === 'id') {
    const c = resolveCitation(t.id);
    if (c.kind === 'row') {
      const r = c.row;
      body = (
        <>
          <div className="drawer-id">
            <span className="num">{r.id}</span>
            {c.sample ? <span className="badge-amber ml-2">sample data</span> : null}
          </div>
          <div className="drawer-claim">{r.claim}</div>
          <div className="drawer-value">
            <span className="num">
              {r.value === null || r.value === undefined || r.value === ''
                ? r.status === 'not_found'
                  ? 'not found'
                  : '—'
                : typeof r.value === 'number'
                  ? fmtNum(r.value, 2)
                  : String(r.value)}
            </span>{' '}
            <span className="unit">{r.unit}</span>
          </div>
          {r.status === 'assumption' ? (
            <div className="drawer-assume">
              <span className="badge-amber">assumption</span>
              <div className="mt-1">{r.basis || 'No basis recorded.'}</div>
            </div>
          ) : null}
          {r.status === 'not_found' ? <div className="drawer-warn">Not found. No figure is shown rather than a guess.</div> : null}
          {r.quote ? <blockquote className="drawer-quote">“{r.quote}”</blockquote> : null}
          <KV k="Source">{r.source_org || '—'}</KV>
          <KV k="Retrieved">{utc(r.retrieved)}</KV>
          <KV k="Red Team">
            {r.check === 'pass' ? <span className="stamp-pass">PASS</span> : <span className="text-slate-500">not checked</span>}
          </KV>
          {r.verdict ? <KV k="Verdict">{r.verdict}</KV> : null}
          {r.url && /^https?:\/\//.test(r.url) ? (
            <a className="drawer-link" href={r.url} target="_blank" rel="noreferrer">
              Open source page ↗
            </a>
          ) : null}
        </>
      );
    } else if (c.kind === 'receipt') {
      const m = c.receipt;
      body = (
        <>
          <div className="drawer-id">
            <span className="num">{m.id}</span> <span className="badge">MSCI receipt</span>
            {c.sample ? <span className="badge-amber ml-2">sample data</span> : null}
          </div>
          <div className="drawer-claim">{m.query_summary}</div>
          <KV k="Tool">{m.tool}</KV>
          <KV k="Retrieved">{utc(m.retrieved)}</KV>
          <KV k="SHA-256">
            <span className="num break-all text-[10px]">{m.sha256}</span>
          </KV>
          {m.display_note ? <div className="drawer-assume">{m.display_note}</div> : null}
        </>
      );
    } else if (c.kind === 'm1') {
      const it = c.item;
      body = (
        <>
          <div className="drawer-id">
            <span className="num">{it.id}</span> <span className="badge">aggregated benchmark</span>
            {c.sample ? <span className="badge-amber ml-2">sample data</span> : null}
          </div>
          <div className="drawer-claim">{it.label ?? it.claim}</div>
          <div className="drawer-value">
            <span className="num">{typeof it.value === 'number' ? fmtNum(it.value, 2) : String(it.value ?? '—')}</span> <span className="unit">{it.unit}</span>
          </div>
          {it.basis ? <div className="drawer-assume">{it.basis}</div> : null}
          {it.receipt_id ? (
            <KV k="Receipt">
              <SourceChip id={it.receipt_id} />
            </KV>
          ) : null}
        </>
      );
    } else {
      body = <div className="drawer-warn">No usable source row for {t.id}. It is unknown or failed the Red Team check, so nothing is shown.</div>;
    }
  }
  return (
    <aside className={`drawer ${t ? 'drawer-open' : ''}`} id="source-drawer">
      <div className="drawer-head">
        <span>Source proof</span>
        <button className="drawer-x" onClick={() => setState({ drawer: null })} aria-label="Close">
          ×
        </button>
      </div>
      <div className="drawer-body">{body}</div>
    </aside>
  );
}
