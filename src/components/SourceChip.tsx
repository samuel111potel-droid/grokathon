import { useId, useState } from 'react';
import type { FactRow } from '../types';

interface Props {
  fact: FactRow;
  compact?: boolean;
}

export function SourceChip({ fact, compact }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const isAssumption = fact.status === 'assumption';

  return (
    <span className={`source-chip-wrap${isAssumption ? ' is-assumption' : ''}`}>
      <button
        type="button"
        className={`source-chip${isAssumption ? ' assumption' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        title={fact.claim}
        onClick={() => setOpen((v) => !v)}
      >
        {isAssumption ? 'assumption' : fact.source_org}
      </button>
      {open && (
        <div id={panelId} className="source-popover" role="dialog">
          <p className="source-claim">{fact.claim}</p>
          <blockquote className="source-quote">“{fact.quote}”</blockquote>
          <div className="source-meta">
            <span>{fact.source_org}</span>
            <span>·</span>
            <span>{fact.retrieved}</span>
            <span>·</span>
            <span>{fact.status}</span>
          </div>
          <a
            className="source-link"
            href={fact.url}
            target="_blank"
            rel="noreferrer"
          >
            Open source
          </a>
          {!compact && (
            <button
              type="button"
              className="source-close"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          )}
        </div>
      )}
    </span>
  );
}
