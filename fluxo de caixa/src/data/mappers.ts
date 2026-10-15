import type { Entry, FixedBill, Kind, NewEntry } from '../core/types';

export interface EntryRow {
  id: string; kind: Kind; name: string; description: string | null;
  amount_cents: number; paid_cents: number;
  purchase_date: string | null; due_date: string | null; paid_date: string | null;
  source_fixed_id: string | null;
}
export interface FixedBillRow {
  id: string; kind: Kind; name: string; description: string | null;
  amount_cents: number; due_day: number;
}

export const rowToEntry = (r: EntryRow): Entry => ({
  id: r.id, kind: r.kind, name: r.name, description: r.description ?? '',
  amountCents: r.amount_cents, paidCents: r.paid_cents,
  purchaseDate: r.purchase_date ?? '', dueDate: r.due_date ?? '',
  paidDate: r.paid_date, sourceFixedId: r.source_fixed_id,
});

/** Maps only the fields present, so it works for partial patches. user_id is DB-defaulted. */
export function entryToRow(e: Partial<NewEntry>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (e.kind !== undefined) row.kind = e.kind;
  if (e.name !== undefined) row.name = e.name;
  if (e.description !== undefined) row.description = e.description;
  if (e.amountCents !== undefined) row.amount_cents = e.amountCents;
  if (e.paidCents !== undefined) row.paid_cents = e.paidCents;
  if (e.purchaseDate !== undefined) row.purchase_date = e.purchaseDate || null;
  if (e.dueDate !== undefined) row.due_date = e.dueDate || null;
  if (e.paidDate !== undefined) row.paid_date = e.paidDate;
  if (e.sourceFixedId !== undefined) row.source_fixed_id = e.sourceFixedId;
  return row;
}

export const rowToFixedBill = (r: FixedBillRow): FixedBill => ({
  id: r.id, kind: r.kind, name: r.name, description: r.description ?? '',
  amountCents: r.amount_cents, dueDay: r.due_day,
});

export function fixedBillToRow(b: Partial<Omit<FixedBill, 'id'>>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (b.kind !== undefined) row.kind = b.kind;
  if (b.name !== undefined) row.name = b.name;
  if (b.description !== undefined) row.description = b.description;
  if (b.amountCents !== undefined) row.amount_cents = b.amountCents;
  if (b.dueDay !== undefined) row.due_day = b.dueDay;
  return row;
}
