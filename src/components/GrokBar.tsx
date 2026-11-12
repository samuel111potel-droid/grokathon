import { useState } from 'react';
import { useStore } from './store';
import { ask, chips, placeholderScript, play, requestedMode } from '../agent/runner';

/** Floating Grok command bar: a prompt goes in, map actions and step lines come out. Not a chat window. */
export function GrokBar() {
  const g = useStore((s) => s.grok);
  const [draft, setDraft] = useState('');
  return (
    <div className="grok">
      <div className="grok-chips">
        {chips.map((c) => (
          <button key={c.prompt} disabled={g.busy} onClick={() => void play(c)}>
            {c.prompt}
          </button>
        ))}
      </div>
      {g.reply || g.status ? (
        <div className="grok-reply">
          {g.reply}
          {g.status ? <div className="grok-status">{g.status}</div> : null}
        </div>
      ) : null}
      <form
        className="grok-bar"
        onSubmit={(e) => {
          e.preventDefault();
          const p = draft.trim();
          if (!p || g.busy) return;
          setDraft('');
          ask(p);
        }}
      >
        <span className={`grok-orb ${g.busy ? 'busy' : ''}`}>G</span>
        <input id="grok-input" value={g.busy ? g.input : draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask Grok…" autoComplete="off" readOnly={g.busy} />
        <span className="grok-key">G</span>
        <span className="grok-key">Space</span>
        <span className={placeholderScript || requestedMode !== 'replay' ? 'badge-amber' : 'badge'} title="Replay plays data/agent/script.json. Live Grok is not wired in this build.">
          replay{placeholderScript ? ' · placeholder script' : ''}
        </span>
      </form>
    </div>
  );
}

/** Grok's own pointer: glides to each target and ripples before the action runs. */
export function GrokCursor() {
  const c = useStore((s) => s.cursor);
  return (
    <div className="gcursor" style={{ transform: `translate(${c.x}px, ${c.y}px)`, opacity: c.visible ? 1 : 0 }}>
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path d="M1 1 L1 14 L5 10.5 L8 17 L10.5 16 L7.5 9.5 L13 9.5 Z" fill="#38bdf8" stroke="#05070c" strokeWidth="1" />
      </svg>
      <span className="gcursor-label">Grok</span>
      {c.ripple ? <span key={c.ripple} className="gcursor-ripple" /> : null}
    </div>
  );
}
