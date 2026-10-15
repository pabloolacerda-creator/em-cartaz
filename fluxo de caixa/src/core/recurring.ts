import type { Entry, FixedBill, NewEntry } from './types';

function lastDayOf(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function occurrencesToGenerate(
  fixedBills: FixedBill[], existing: Entry[], month: string,
): NewEntry[] {
  const last = lastDayOf(month);
  const out: NewEntry[] = [];
  for (const bill of fixedBills) {
    const has = existing.some(
      e => e.sourceFixedId === bill.id && e.dueDate.slice(0, 7) === month,
    );
    if (has) continue;
    const day = Math.min(bill.dueDay, last);
    const dueDate = `${month}-${String(day).padStart(2, '0')}`;
    out.push({
      kind: bill.kind, name: bill.name, description: bill.description,
      amountCents: bill.amountCents, paidCents: 0, paidDate: null,
      sourceFixedId: bill.id, dueDate, purchaseDate: dueDate,
    });
  }
  return out;
}
