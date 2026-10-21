import { supabase } from '../../lib/supabase'
import { usuarioAtualId } from '../../lib/usuarioAtual'
import type { Movimentacao } from '../../types'

export type Saldo = { material_id: string; nome: string; unidade: string; saldo: number }
export type MovimentacaoInput = {
  material_id: string
  tipo: 'entrada' | 'saida'
  quantidade: number
  unidade?: string | null
  obs?: string | null
}

function unwrap<T>(r: { data: T; error: unknown }): T {
  if (r.error) throw r.error
  return r.data
}

export async function listarSaldos(): Promise<Saldo[]> {
  return unwrap(await supabase.from('saldo_estoque').select('*').order('nome')) as Saldo[]
}

// Não bloqueia saída maior que o saldo: o aviso é responsabilidade da UI.
export async function registrarMovimentacao(m: MovimentacaoInput): Promise<Movimentacao> {
  return unwrap(await supabase.from('movimentacoes_estoque').insert({ ...m, usuario_id: await usuarioAtualId() }).select().single()) as Movimentacao
}

export async function historicoPorMaterial(material_id: string): Promise<Movimentacao[]> {
  return unwrap(
    await supabase
      .from('movimentacoes_estoque')
      .select('*')
      .eq('material_id', material_id)
      .order('data', { ascending: false }),
  ) as Movimentacao[]
}
