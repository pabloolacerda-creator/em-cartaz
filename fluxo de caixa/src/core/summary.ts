import type { Entry } from './types';

export interface MonthSummary {
  have: number; earned: number; spent: number;
  toReceive: number; toPay: number; projected: number;
}

const inMonth = (date: string | null, month: string): boolean =>
  date !== null && date.slice(0, 7) === month;

export function monthSummary(entries: Entry[], month: string): MonthSummary {
  let earned = 0, spent = 0, toReceive = 0, toPay = 0;
  for (const x of entries) {
    if (inMonth(x.paidDate, month)) {
      if (x.kind === 'in') earned += x.paidCents; else spent += x.paidCents;
    }
    if (inMonth(x.dueDate, month)) {
      const open = x.amountCents - x.paidCents;
      if (x.kind === 'in') toReceive += open; else toPay += open;
    }
  }
  const have = earned - spent;
  return { have, earned, spent, toReceive, toPay, projected: have + toReceive - toPay };
}
