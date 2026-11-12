import type { FactRow, P1File } from "../types";
import { SourceChip } from "./SourceChip";

interface Props {
  p1: P1File;
}

export function PowerPanel({ p1 }: Props) {
  const rows = p1.rows ?? [];
  const substation =
    rows.find((r) => r.id === "P1-01") ??
    rows.find((r) => (r.unit === "kV" && (r.value ?? 0) >= 400));
  const application =
    rows.find((r) => r.id === (p1.application_id || "P1-17")) ??
    rows.find((r) => r.id === "P1-17");
  const queue = rows.filter(
    (r) =>
      r.id.startsWith("P1-Q") ||
      (r.id !== substation?.id &&
        r.id !== application?.id &&
        r.id !== "P1" &&
        Boolean((r as FactRow & { date?: string | null }).date)),
  );

  return (
    <section className="power-panel" aria-label="Power panel">
      <h2>Power</h2>
      {substation ? (
        <p className="power-line">
          <strong>{substation.value ?? p1.substation_kv ?? 400} kV</strong> substation on site
          <SourceChip row={substation} />
        </p>
      ) : null}
      {application ? (
        <p className="power-line">
          <strong>{application.value ?? p1.value} MW</strong> application
          <SourceChip row={application} label={application.id} />
        </p>
      ) : null}
      <h3>Queue</h3>
      <ul className="queue-list">
        {queue.map((row) => {
          const date = (row as FactRow & { date?: string | null }).date;
          return (
            <li key={row.id}>
              <span className="queue-mw">{row.value ?? "—"} MW</span>
              <span className="queue-date">{date || "date n/a"}</span>
              <span className="queue-name">{row.claim}</span>
              <SourceChip row={row} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
