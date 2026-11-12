import { useState } from 'react';
import type {
  C3FactFile,
  FactRow,
  ObjectionCard,
  OfferFact,
} from '../types';
import { SourceChip } from './SourceChip';

type Tab = 'objections' | 'community';

interface Props {
  cards: ObjectionCard[];
  facts: Record<string, FactRow>;
  c3: C3FactFile;
  round: number;
}

export function SidePanel({ cards, facts, c3, round }: Props) {
  const [tab, setTab] = useState<Tab>('objections');

  return (
    <aside className="side-panel" aria-label="Objections and community">
      <div className="side-tabs" role="tablist" aria-label="Side panel">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'objections'}
          className={tab === 'objections' ? 'active' : ''}
          onClick={() => setTab('objections')}
        >
          Objections
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'community'}
          className={tab === 'community' ? 'active' : ''}
          onClick={() => setTab('community')}
        >
          Community
        </button>
      </div>

      {tab === 'objections' ? (
        <div className="objections" role="tabpanel">
          <header className="objections-header">
            <h2>Objections</h2>
            <p>Round {round} of 2 — re-plan moves plant away from homes.</p>
          </header>
          <ul className="objection-list">
            {cards.map((card) => {
              const precedent = facts[card.precedent_id];
              const offerFact = facts[card.offer_id] as OfferFact | undefined;
              const whoFact = facts.C1;
              const fixFact = facts[card.row_ids.find((id) => id !== card.precedent_id && id !== card.offer_id) ?? ''] ?? facts.OBJ;
              return (
                <li key={card.id} className="objection-card">
                  <div className="objection-top">
                    <span className="severity" data-level={card.severity}>
                      Severity {card.severity}
                    </span>
                  </div>
                  <h3>
                    {card.theme}
                    <SourceChip fact={facts.OBJ} />
                  </h3>
                  <p className="who">
                    <span className="label">Who</span> {card.who_affected}{' '}
                    {whoFact && <SourceChip fact={whoFact} />}
                  </p>
                  <p className="precedent">
                    <span className="label">Precedent</span>{' '}
                    {precedent ? (
                      <>
                        “{precedent.quote}” <SourceChip fact={precedent} />
                      </>
                    ) : (
                      '—'
                    )}
                  </p>
                  <p className="fix">
                    <span className="label">Fix</span> {card.fix}{' '}
                    {fixFact && <SourceChip fact={fixFact} />}
                  </p>
                  <p className="offer">
                    <span className="label">Offer</span>{' '}
                    {offerFact ? (
                      <>
                        {offerFact.offer} <SourceChip fact={offerFact} />
                      </>
                    ) : (
                      '—'
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="community-tab" role="tabpanel">
          <header className="objections-header">
            <h2>Community</h2>
            <p>Gotham ward facts from C3 — each row carries its source.</p>
          </header>
          <table className="ward-table">
            <thead>
              <tr>
                <th>Fact</th>
                <th>Value</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {c3.facts.map((row) => (
                <tr key={row.id}>
                  <td>{row.claim}</td>
                  <td>
                    {row.value ?? '—'}
                    {row.unit ? ` ${row.unit}` : ''}
                  </td>
                  <td>
                    <SourceChip fact={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="community-note">
            File {c3.id}
            <SourceChip fact={c3} />
          </p>
        </div>
      )}
    </aside>
  );
}
