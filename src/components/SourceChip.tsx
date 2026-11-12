import { useEffect, useId, useRef, useState } from "react";
import type { FactRow } from "../types";

interface Props {
  row: FactRow;
  label?: string;
}

export function SourceChip({ row, label }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const isAssumption = row.status === "assumption";
  const isComputed = row.status === "computed";
  const chipLabel =
    label ??
    (isComputed ? "computed" : isAssumption ? "assumption" : row.source_org || row.id);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      className={`source-chip-wrap${isAssumption ? " is-assumption" : ""}${isComputed ? " is-computed" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className={`source-chip${isAssumption ? " assumption" : ""}${isComputed ? " computed" : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {chipLabel}
      </button>
      {open ? (
        <div className="source-popover" id={panelId} role="dialog" aria-label={`Source ${row.id}`}>
          <p className="source-id">{row.id}</p>
          <p className="source-claim">{row.claim}</p>
          <blockquote>{row.quote}</blockquote>
          <p className="source-meta">
            {row.source_org}
            {row.retrieved ? ` · ${row.retrieved}` : ""}
            {isAssumption ? " · assumption" : ""}
            {isComputed ? " · computed" : ""}
          </p>
          {row.url ? (
            <a className="source-link" href={row.url} target="_blank" rel="noreferrer">
              Open source
            </a>
          ) : null}
        </div>
      ) : null}
    </span>
  );
}
