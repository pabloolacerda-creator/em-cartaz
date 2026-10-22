import { supabase } from '../../lib/supabase'
import { usuarioAtualId } from '../../lib/usuarioAtual'
import { formatNumero } from '../../lib/numero'
import type { ContaFinanceira, Lancamento, TipoLancamento } from '../../types'

function unwrap<T>(r: { data: T; error: unknown }): T {
  if (r.error) throw r.error
  return r.data
}

export type ContaInput = { nome: string; tipo: 'banco' | 'caixa'; saldo_inicial: number }

export async function listarContas(): Promise<ContaFinanceira[]> {
  const [contas, saldos] = await Promise.all([
    supabase.from('contas_financeiras').select('*').eq('ativo', true).order('nome'),
    supabase.from('saldo_contas').select('*'),
  ])
  const cs = unwrap(contas) as ContaFinanceira[]
  const mapa = new Map((unwrap(saldos) as { conta_id: string; saldo: number }[]).map((s) => [s.conta_id, Number(s.saldo)]))
  return cs.map((c) => ({ ...c, saldo: mapa.get(c.id) ?? Number(c.saldo_inicial) }))
}

export async function criarConta(c: ContaInput): Promise<ContaFinanceira> {
  return unwrap(await supabase.from('contas_financeiras').insert(c).select().single()) as ContaFinanceira
}

export async function editarConta(id: string, c: Partial<ContaInput>): Promise<ContaFinanceira> {
  return unwrap(await supabase.from('contas_financeiras').update(c).eq('id', id).select().single()) as ContaFinanceira
}

export async function inativarConta(id: string): Promise<void> {
  unwrap(await supabase.from('contas_financeiras').update({ ativo: false }).eq('id', id))
}

export type LancamentoInput = {
  tipo: TipoLancamento
  descricao: string
  valor: number
  vencimento: string
  pago_em?: string | null
  conta_id?: string | null
  categoria?: string | null
  fornecedor?: string | null
  cliente_id?: string | null
  pedido_id?: string | null
  obs?: string | null
}

export async function listarLancamentos(): Promise<Lancamento[]> {
  return unwrap(await supabase.from('lancamentos').select('*').order('vencimento', { ascending: true })) as Lancamento[]
}

export async function criarLancamento(l: LancamentoInput): Promise<Lancamento> {
  return unwrap(await supabase.from('lancamentos').insert({ ...l, usuario_id: await usuarioAtualId() }).select().single()) as Lancamento
}

export async function editarLancamento(id: string, l: Partial<LancamentoInput>): Promise<void> {
  unwrap(await supabase.from('lancamentos').update(l).eq('id', id))
}

export async function marcarPago(id: string, pago_em: string, conta_id: string | null): Promise<void> {
  unwrap(await supabase.from('lancamentos').update({ pago_em, conta_id }).eq('id', id))
}

export async function desmarcarPago(id: string): Promise<void> {
  unwrap(await supabase.from('lancamentos').update({ pago_em: null }).eq('id', id))
}

export async function excluirLancamento(id: string): Promise<void> {
  unwrap(await supabase.from('lancamentos').delete().eq('id', id))
}

// Gera a conta a receber de um pedido (uma vez só).
export async function gerarContaReceber(p: { id: string; cliente_id: string; numero?: number | null; total: number }): Promise<void> {
  const existe = unwrap(await supabase.from('lancamentos').select('id').eq('pedido_id', p.id).limit(1)) as { id: string }[]
  if (existe.length > 0) throw new Error('Este pedido já tem uma conta a receber.')
  const d = new Date()
  d.setDate(d.getDate() + 30)
  const vencimento = d.toISOString().slice(0, 10)
  unwrap(
    await supabase.from('lancamentos').insert({
      tipo: 'receita',
      descricao: `Pedido${p.numero ? ` nº ${formatNumero(p.numero)}` : ''}`,
      valor: p.total,
      vencimento,
      cliente_id: p.cliente_id,
      pedido_id: p.id,
      usuario_id: await usuarioAtualId(),
    }),
  )
}
