import type { FactRow, ObjectionCard } from '../types';
import { SourceChip } from './SourceChip';

interface Props {
  cards: ObjectionCard[];
  facts: Record<string, FactRow>;
  round: number;
}

export function ObjectionCards({ cards, facts, round }: Props) {
  return (
    <aside className="objections" aria-label="Community objections">
      <header className="objections-header">
        <h2>Objections</h2>
        <p>Round {round} of 2 — re-plan moves plant away from homes.</p>
      </header>
      <ul className="objection-list">
        {cards.map((card) => {
          const primaryId = card.row_ids[0];
          const fact = facts[primaryId] ?? facts.OBJ;
          return (
            <li key={card.id} className="objection-card">
              <div className="objection-top">
                <span className="severity" data-level={card.severity}>
                  Severity {card.severity}
                </span>
                {fact && <SourceChip fact={fact} />}
              </div>
              <h3>{card.theme}</h3>
              <p className="who">
                <span className="label">Who</span> {card.who_affected}
              </p>
              <p className="fix">
                <span className="label">Fix</span> {card.fix}
              </p>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
