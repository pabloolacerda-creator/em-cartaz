import { describe, it, expect } from 'vitest';
import { seriesDueDates } from './series';

describe('seriesDueDates', () => {
  it('returns the single start date for count 1', () => {
    expect(seriesDueDates('2026-10-10', 'monthly', 1)).toEqual(['2026-10-10']);
  });

  it('steps monthly and clamps the day to the month length', () => {
    expect(seriesDueDates('2026-01-31', 'monthly', 3)).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
    ]);
  });

  it('steps monthly across a year boundary', () => {
    expect(seriesDueDates('2026-11-15', 'monthly', 3)).toEqual([
      '2026-11-15',
      '2026-12-15',
      '2027-01-15',
    ]);
  });

  it('steps weekly by 7 days', () => {
    expect(seriesDueDates('2026-10-10', 'weekly', 4)).toEqual([
      '2026-10-10',
      '2026-10-17',
      '2026-10-24',
      '2026-10-31',
    ]);
  });

  it('steps weekly across a month boundary', () => {
    expect(seriesDueDates('2026-10-29', 'weekly', 2)).toEqual(['2026-10-29', '2026-11-05']);
  });
});
