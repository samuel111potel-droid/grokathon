import type { FactRow, ObjectionCard } from "../types";
import { SourceChip } from "./SourceChip";

interface Props {
  cards: ObjectionCard[];
  factIndex: Record<string, FactRow>;
  round: number;
}

export function ObjectionCards({ cards, factIndex, round }: Props) {
  return (
    <section className="objection-panel" aria-label="Objection cards">
      <h2>Objections</h2>
      <div className="objection-list">
        {cards.map((card) => {
          const resolved =
            typeof card.resolved_in_round === "number" &&
            round >= card.resolved_in_round;
          const sourceId = card.row_ids.find((id) => factIndex[id]) ?? card.row_ids[0];
          const source =
            (sourceId && factIndex[sourceId]) ||
            ({
              id: sourceId || card.id,
              claim: card.theme,
              value: null,
              unit: "",
              lat: 0,
              lon: 0,
              source_org: "Objection",
              url: "https://www.rushcliffe.gov.uk/",
              quote: card.quote,
              retrieved: "2026-11-12",
              status: "assumption",
              check: "pass",
            } satisfies FactRow);

          return (
            <article
              key={card.id}
              className={`objection-card${resolved ? " resolved" : ""}`}
              data-testid={`objection-${card.id}`}
            >
              <header>
                <h3>{card.theme}</h3>
                <span className="severity">sev {card.severity}</span>
              </header>
              <p className="who">
                <strong>Who raised it:</strong>{" "}
                {card.who_raised || card.who_affected || "Community / consultees"}
              </p>
              <blockquote>{card.quote}</blockquote>
              <p className="response">
                <strong>Design response:</strong> {card.design_response}
              </p>
              <div className="card-actions">
                <SourceChip row={source} />
                {resolved ? <span className="resolved-pill">Addressed</span> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
