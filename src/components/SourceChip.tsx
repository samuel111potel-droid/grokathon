import { useId, useState } from 'react';
import type { FactRow } from '../types';

interface Props {
  fact: FactRow;
  compact?: boolean;
  /**
   * Force chip label. Use "computed" for C1 rows whose values are derived
   * from sourced coordinates even when check is "fail".
   */
  variant?: 'auto' | 'computed' | 'assumption';
}

export function SourceChip({ fact, compact, variant = 'auto' }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const isComputed =
    variant === 'computed' ||
    (variant === 'auto' &&
      fact.id.startsWith('C1-') &&
      fact.check === 'fail');
  const isAssumption =
    variant === 'assumption' ||
    (!isComputed && fact.status === 'assumption');

  const label = isComputed
    ? 'computed'
    : isAssumption
      ? 'assumption'
      : fact.source_org || fact.id;

  return (
    <span
      className={`source-chip-wrap${isAssumption ? ' is-assumption' : ''}${
        isComputed ? ' is-computed' : ''
      }`}
    >
      <button
        type="button"
        className={`source-chip${isAssumption ? ' assumption' : ''}${
          isComputed ? ' computed' : ''
        }`}
        aria-expanded={open}
        aria-controls={panelId}
        title={fact.claim}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open && (
        <div id={panelId} className="source-popover" role="dialog">
          <p className="source-claim">{fact.claim}</p>
          {fact.quote ? (
            <blockquote className="source-quote">“{fact.quote}”</blockquote>
          ) : null}
          <div className="source-meta">
            <span>{fact.source_org}</span>
            <span>·</span>
            <span>{fact.retrieved}</span>
            <span>·</span>
            <span>{fact.status}</span>
            {isComputed && (
              <>
                <span>·</span>
                <span>computed from coordinates</span>
              </>
            )}
          </div>
          {fact.url ? (
            <a
              className="source-link"
              href={fact.url}
              target="_blank"
              rel="noreferrer"
            >
              Open source
            </a>
          ) : null}
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
