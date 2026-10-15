import { describe, it, expect } from 'vitest';
import { occurrencesToGenerate } from './recurring';
import type { Entry, FixedBill } from './types';

const bill = (id: string, dueDay: number): FixedBill => ({
  id, kind: 'out', name: 'Aluguel', description: 'mensal', amountCents: 100000, dueDay,
});

describe('occurrencesToGenerate', () => {
  it('emits one entry for a bill with no occurrence', () => {
    const r = occurrencesToGenerate([bill('f1', 10)], [], '2026-10');
    expect(r).toEqual([{
      kind: 'out', name: 'Aluguel', description: 'mensal', amountCents: 100000,
      paidCents: 0, paidDate: null, sourceFixedId: 'f1',
      dueDate: '2026-10-10', purchaseDate: '2026-10-10',
    }]);
  });

  it('is idempotent', () => {
    const gen = occurrencesToGenerate([bill('f1', 10)], [], '2026-10');
    const existing: Entry[] = gen.map((e, i) => ({ ...e, id: `e${i}` }));
    expect(occurrencesToGenerate([bill('f1', 10)], existing, '2026-10')).toEqual([]);
  });

  it('clamps day overflow', () => {
    expect(occurrencesToGenerate([bill('f1', 31)], [], '2026-11')[0].dueDate).toBe('2026-11-30');
    expect(occurrencesToGenerate([bill('f1', 31)], [], '2026-02')[0].dueDate).toBe('2026-02-28');
  });

  it('emits only the missing bill', () => {
    const gen = occurrencesToGenerate([bill('f1', 5)], [], '2026-10');
    const existing: Entry[] = gen.map((e, i) => ({ ...e, id: `e${i}` }));
    const r = occurrencesToGenerate([bill('f1', 5), bill('f2', 7)], existing, '2026-10');
    expect(r.map(e => e.sourceFixedId)).toEqual(['f2']);
  });
});
