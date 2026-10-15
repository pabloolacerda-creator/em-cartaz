import type { FixedBill } from '../core/types';
import { supabase } from './supabase';
import { fixedBillToRow, rowToFixedBill, type FixedBillRow } from './mappers';

export async function listFixedBills(): Promise<FixedBill[]> {
  const { data, error } = await supabase.from('fixed_bills').select('*').order('due_day');
  if (error) throw error;
  return (data as FixedBillRow[]).map(rowToFixedBill);
}

export async function createFixedBill(input: Omit<FixedBill, 'id'>): Promise<FixedBill> {
  const { data, error } = await supabase.from('fixed_bills').insert(fixedBillToRow(input)).select().single();
  if (error) throw error;
  return rowToFixedBill(data as FixedBillRow);
}

export async function updateFixedBill(id: string, patch: Partial<Omit<FixedBill, 'id'>>): Promise<FixedBill> {
  const { data, error } = await supabase.from('fixed_bills').update(fixedBillToRow(patch)).eq('id', id).select().single();
  if (error) throw error;
  return rowToFixedBill(data as FixedBillRow);
}

export async function deleteFixedBill(id: string): Promise<void> {
  const { error } = await supabase.from('fixed_bills').delete().eq('id', id);
  if (error) throw error;
}
