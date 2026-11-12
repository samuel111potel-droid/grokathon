import type { PlanningApplication } from "../types";
import { SourceChip } from "./SourceChip";

interface Props {
  app: PlanningApplication;
  onClose: () => void;
}

const DECISION_LABEL: Record<PlanningApplication["decision"], string> = {
  refused: "Refused",
  approved_with_conditions: "Approved with conditions",
  approved: "Approved",
};

export function PlanningCard({ app, onClose }: Props) {
  return (
    <article className={`planning-card decision-${app.decision}`} data-testid="planning-card">
      <header>
        <h2>{app.reference}</h2>
        <button type="button" className="card-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      <p className={`decision-pill ${app.decision}`}>{DECISION_LABEL[app.decision]}</p>
      <blockquote>{app.quote}</blockquote>
      <div className="card-actions">
        <a href={app.url} target="_blank" rel="noreferrer">
          Open source
        </a>
        <SourceChip row={app} />
      </div>
    </article>
  );
}
