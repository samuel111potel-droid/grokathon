import { describe, expect, it } from 'vitest';
import {
  adaptFlatRows,
  inIdRange,
  rowSuffix,
} from './loadData';
import type { FactRow } from '../types';

function row(
  partial: Partial<FactRow> & Pick<FactRow, 'id'>,
): FactRow {
  return {
    claim: partial.claim ?? partial.id,
    value: partial.value ?? 1,
    unit: partial.unit ?? '',
    lat: 52.86,
    lon: -1.25,
    source_org: 'test',
    url: 'https://example.com',
    quote: 'q',
    retrieved: '2026-11-12',
    status: partial.status ?? 'found',
    check: partial.check ?? 'pass',
    ...partial,
  };
}

describe('flat row adapter', () => {
  it('parses id suffixes and ranges', () => {
    expect(rowSuffix('C1-04')).toBe(4);
    expect(rowSuffix('C2-14')).toBe(14);
    expect(inIdRange('C1-04', 'C1', 4, 23)).toBe(true);
    expect(inIdRange('C1-03', 'C1', 4, 23)).toBe(false);
    expect(inIdRange('C1-32', 'C1', 32, 59)).toBe(true);
  });

  it('skips not_found and drops C1-60/61', () => {
    const out = adaptFlatRows([
      row({ id: 'C1-04' }),
      row({ id: 'C1-05', status: 'not_found' }),
      row({ id: 'C1-60' }),
      row({ id: 'C1-61' }),
      row({ id: 'C1-10', check: 'fail' }),
      row({ id: 'C2-04', check: 'fail' }),
    ]);
    const ids = out.map((r) => r.id);
    expect(ids).toContain('C1-04');
    expect(ids).toContain('C1-10'); // C1 fail kept as computed
    expect(ids).not.toContain('C1-05');
    expect(ids).not.toContain('C1-60');
    expect(ids).not.toContain('C1-61');
    expect(ids).not.toContain('C2-04'); // non-C1 fail dropped
  });
});
