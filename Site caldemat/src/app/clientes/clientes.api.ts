import { supabase } from '../../lib/supabase'
import type { Cliente } from '../../types'

export type ClienteInput = {
  nome: string
  documento?: string | null
  telefone?: string | null
  email?: string | null
  endereco?: string | null
  obs?: string | null
}

function unwrap<T>(r: { data: T; error: unknown }): T {
  if (r.error) throw r.error
  return r.data
}

export async function listarClientes(): Promise<Cliente[]> {
  return unwrap(await supabase.from('clientes').select('*').eq('ativo', true).order('nome')) as Cliente[]
}

export async function criarCliente(c: ClienteInput): Promise<Cliente> {
  return unwrap(await supabase.from('clientes').insert(c).select().single()) as Cliente
}

export async function editarCliente(id: string, c: Partial<ClienteInput>): Promise<Cliente> {
  return unwrap(await supabase.from('clientes').update(c).eq('id', id).select().single()) as Cliente
}

export async function inativarCliente(id: string): Promise<void> {
  unwrap(await supabase.from('clientes').update({ ativo: false }).eq('id', id))
}
