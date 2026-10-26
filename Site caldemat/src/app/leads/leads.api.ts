import { supabase } from '../../lib/supabase'
import type { Lead, StatusLead } from '../../types'

export type LeadInput = {
  nome: string
  whatsapp: string
  documento?: string | null
  capacidade_litros?: number | null
  bacia_contencao?: boolean | null
  cidade?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  obs?: string | null
}

function unwrap<T>(r: { data: T; error: unknown }): T {
  if (r.error) throw r.error
  return r.data
}

// Inserção pública (anon): NÃO encadear .select() — anon não tem policy de select.
export async function criarLead(l: LeadInput): Promise<void> {
  unwrap(await supabase.from('leads').insert(l))
}

export async function listarLeads(): Promise<Lead[]> {
  return unwrap(await supabase.from('leads').select('*').order('criado_em', { ascending: false })) as Lead[]
}

export async function atualizarStatusLead(id: string, status: StatusLead): Promise<void> {
  unwrap(await supabase.from('leads').update({ status }).eq('id', id))
}

export function lerUtms(search: string): {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
} {
  const p = new URLSearchParams(search)
  const g = (k: string) => p.get(k) ?? null
  return { utm_source: g('utm_source'), utm_medium: g('utm_medium'), utm_campaign: g('utm_campaign') }
}
