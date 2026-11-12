import { useState } from 'react';
import type { C3FactFile, FactRow, ObjectionCard } from '../types';
import { SourceChip } from './SourceChip';

type Tab = 'objections' | 'community';

interface Props {
  cards: ObjectionCard[];
  facts: Record<string, FactRow>;
  c3: C3FactFile;
  round: number;
  liveOnly: boolean;
}

export function SidePanel({ cards, facts, c3, round, liveOnly }: Props) {
  const [tab, setTab] = useState<Tab>('objections');
  const fundingGaps = c3.funding_gaps?.length
    ? c3.funding_gaps
    : (c3.offers ?? []).map((o) => o as FactRow);
  const wardFacts = c3.facts ?? [];

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
            <p>
              {liveOnly
                ? `Live C2 precedents · round ${round}`
                : `Round ${round} of 2 — waiting for live C2 rows.`}
            </p>
          </header>
          {cards.length === 0 ? (
            <p className="empty-panel">
              No live objection cards yet. Place C2.json in data/live/ (rows
              C2-04 … C2-14).
            </p>
          ) : (
            <ul className="objection-list">
              {cards.map((card) => {
                const fact = facts[card.id] ?? facts[card.precedent_id];
                return (
                  <li key={card.id} className="objection-card">
                    <div className="objection-top">
                      <span className="severity">{card.id}</span>
                      {fact && <SourceChip fact={fact} />}
                    </div>
                    <h3>{card.theme}</h3>
                    <p className="who">
                      <span className="label">Who</span>{' '}
                      {card.who_raised ?? card.who_affected}{' '}
                      {fact && <SourceChip fact={fact} />}
                    </p>
                    <p className="precedent">
                      <span className="label">Quote</span>{' '}
                      {card.quote ? (
                        <>
                          “{card.quote}” {fact && <SourceChip fact={fact} />}
                        </>
                      ) : (
                        '—'
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="community-tab" role="tabpanel">
          <header className="objections-header">
            <h2>Community</h2>
            <p>C3 ward facts — each row carries its source.</p>
          </header>
          {wardFacts.length === 0 ? (
            <p className="empty-panel">
              No live C3 rows yet. Place C3.json in data/live/.
            </p>
          ) : (
            <table className="ward-table">
              <thead>
                <tr>
                  <th>Fact</th>
                  <th>Value</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {wardFacts.map((row) => (
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
          )}

          <h3 className="funding-title">What a developer could fund</h3>
          <p className="funding-sub">Stated gaps C3-32, C3-33, C3-35</p>
          {fundingGaps.length === 0 ? (
            <p className="empty-panel">Gaps C3-32 / C3-33 / C3-35 not in live C3.</p>
          ) : (
            <ul className="funding-list">
              {fundingGaps.map((gap) => (
                <li key={gap.id}>
                  <span className="funding-id">{gap.id}</span>
                  <span>{gap.claim}</span>
                  <SourceChip fact={gap} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}
