import type { Entry, NewEntry } from '../core/types';
import { supabase } from './supabase';
import { entryToRow, rowToEntry, type EntryRow } from './mappers';

export async function listEntries(): Promise<Entry[]> {
  const { data, error } = await supabase.from('entries').select('*').order('due_date');
  if (error) throw error;
  return (data as EntryRow[]).map(rowToEntry);
}

export async function createEntry(input: NewEntry): Promise<Entry> {
  const { data, error } = await supabase.from('entries').insert(entryToRow(input)).select().single();
  if (error) throw error;
  return rowToEntry(data as EntryRow);
}

export async function updateEntry(id: string, patch: Partial<NewEntry>): Promise<Entry> {
  const { data, error } = await supabase.from('entries').update(entryToRow(patch)).eq('id', id).select().single();
  if (error) throw error;
  return rowToEntry(data as EntryRow);
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('entries').delete().eq('id', id);
  if (error) throw error;
}

export function markPaid(id: string, paidCents: number, paidDate: string): Promise<Entry> {
  return updateEntry(id, { paidCents, paidDate });
}
