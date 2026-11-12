import type { FactRow } from "../types";
import { SourceChip } from "./SourceChip";

interface Props {
  counts: FactRow[];
}

export function CountLine({ counts }: Props) {
  const within150 = counts.find((c) => c.id === "C1-150") ?? counts[0];
  const within300 = counts.find((c) => c.id === "C1-300") ?? counts[1];

  if (!within150 || !within300) return null;

  return (
    <p className="count-line" data-testid="count-line">
      <span className="count-part">
        <strong>{within150.value ?? 0}</strong> buildings within 150 m
        <SourceChip row={within150} />
      </span>
      <span className="count-sep" aria-hidden>
        ,
      </span>
      <span className="count-part">
        <strong>{within300.value ?? 0}</strong> within 300 m
        <SourceChip row={within300} />
      </span>
    </p>
  );
}
