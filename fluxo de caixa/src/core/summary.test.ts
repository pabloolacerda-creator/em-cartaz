import { describe, it, expect } from 'vitest';
import { monthSummary } from './summary';
import type { Entry } from './types';

const M = '2026-10';
let n = 0;
const e = (o: Partial<Entry>): Entry => ({
  id: String(++n), kind: 'out', name: 'x', description: '', category: '',
  amountCents: 0, paidCents: 0, purchaseDate: '2026-10-01', dueDate: '2026-10-01',
  paidDate: null, sourceFixedId: null, ...o,
});

describe('monthSummary', () => {
  it('unpaid out adds full amount to toPay, nothing to spent', () => {
    const s = monthSummary([e({ amountCents: 10000, dueDate: '2026-10-10' })], M);
    expect(s.toPay).toBe(10000);
    expect(s.spent).toBe(0);
  });
  it('fully paid in adds to earned and have', () => {
    const s = monthSummary([e({ kind: 'in', amountCents: 20000, paidCents: 20000, paidDate: '2026-10-05', dueDate: '2026-10-05' })], M);
    expect(s.earned).toBe(20000);
    expect(s.have).toBe(20000);
    expect(s.toReceive).toBe(0);
  });
  it('partially paid out splits spent and toPay', () => {
    const s = monthSummary([e({ amountCents: 89000, paidCents: 50000, paidDate: '2026-10-03', dueDate: '2026-10-20' })], M);
    expect(s.spent).toBe(50000);
    expect(s.toPay).toBe(39000);
  });
  it('entry due next month contributes nothing to October', () => {
    const s = monthSummary([
      e({ amountCents: 5000, dueDate: '2026-11-10' }),
      e({ kind: 'in', amountCents: 7000, dueDate: '2026-11-10' }),
    ], M);
    expect(s.toPay).toBe(0);
    expect(s.toReceive).toBe(0);
  });
  it('out paid in November does not count in October spent', () => {
    const s = monthSummary([e({ amountCents: 5000, paidCents: 5000, paidDate: '2026-11-02', dueDate: '2026-10-28' })], M);
    expect(s.spent).toBe(0);
  });
  it('projected = have + toReceive - toPay on mixed fixture', () => {
    const s = monthSummary([
      e({ kind: 'in', amountCents: 300000, paidCents: 100000, paidDate: '2026-10-02', dueDate: '2026-10-25' }),
      e({ kind: 'out', amountCents: 89000, paidCents: 50000, paidDate: '2026-10-03', dueDate: '2026-10-20' }),
      e({ kind: 'out', amountCents: 12000, dueDate: '2026-10-30' }),
    ], M);
    expect(s).toEqual({ earned: 100000, spent: 50000, have: 50000, toReceive: 200000, toPay: 51000, projected: 199000 });
    expect(s.projected).toBe(s.have + s.toReceive - s.toPay);
  });
  it('empty list gives zeros', () => {
    expect(monthSummary([], M)).toEqual({ have: 0, earned: 0, spent: 0, toReceive: 0, toPay: 0, projected: 0 });
  });
});
