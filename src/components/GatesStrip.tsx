import type { GateEvaluation } from "../lib/layoutMetrics";
import { SourceChip } from "./SourceChip";

interface Props {
  gates: GateEvaluation[];
  round: number;
}

export function GatesStrip({ gates, round }: Props) {
  return (
    <section className="gates-strip" aria-label={`Gates for round ${round}`}>
      <h2>Gates · round {round}</h2>
      <ul>
        {gates.map((gate) => (
          <li key={gate.id} className={gate.pass ? "pass" : "fail"}>
            <span className={`gate-flag ${gate.pass ? "pass" : "fail"}`}>
              {gate.pass ? "pass" : "fail"}
            </span>
            <div className="gate-body">
              <span className="gate-label">{gate.label}</span>
              <strong className="gate-value">{gate.display}</strong>
            </div>
            <SourceChip row={gate.row} />
          </li>
        ))}
      </ul>
    </section>
  );
}
