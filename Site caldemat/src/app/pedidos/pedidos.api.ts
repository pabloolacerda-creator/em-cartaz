import { supabase } from '../../lib/supabase'
import { usuarioAtualId } from '../../lib/usuarioAtual'
import type { Pedido, PedidoItem } from '../../types'

export type ItemInput = { descricao: string; quantidade: number; valor_unitario: number }
export type PedidoInput = { cliente_id: string; obs?: string | null; itens: ItemInput[] }

function unwrap<T>(r: { data: T; error: unknown }): T {
  if (r.error) throw r.error
  return r.data
}

export async function criarPedido(p: PedidoInput): Promise<{ id: string }> {
  const ped = unwrap(
    await supabase.from('pedidos').insert({ cliente_id: p.cliente_id, obs: p.obs ?? null, usuario_id: await usuarioAtualId() }).select().single(),
  ) as Pedido
  try {
    unwrap(await supabase.from('pedido_itens').insert(p.itens.map((i) => ({ pedido_id: ped.id, ...i }))))
  } catch (e) {
    // desfaz o pedido órfão (melhor esforço)
    try {
      await supabase.from('pedidos').delete().eq('id', ped.id)
    } catch {
      /* ignora */
    }
    throw e
  }
  return { id: ped.id }
}

export async function listarPedidos(): Promise<(Pedido & { cliente_nome?: string; total: number })[]> {
  const [peds, totais] = await Promise.all([
    supabase.from('pedidos').select('*, clientes(nome)').order('data', { ascending: false }),
    supabase.from('pedidos_total').select('*'),
  ])
  const rows = unwrap(peds) as (Pedido & { clientes?: { nome: string } | null })[]
  const tot = new Map((unwrap(totais) as { pedido_id: string; total: number | string }[]).map((t) => [t.pedido_id, Number(t.total)]))
  return rows.map(({ clientes, ...p }) => ({ ...p, cliente_nome: clientes?.nome, total: tot.get(p.id) ?? 0 }))
}

export async function obterPedido(id: string): Promise<{ pedido: Pedido; itens: PedidoItem[] }> {
  const [p, i] = await Promise.all([
    supabase.from('pedidos').select('*').eq('id', id).single(),
    supabase.from('pedido_itens').select('*').eq('pedido_id', id),
  ])
  return { pedido: unwrap(p) as Pedido, itens: unwrap(i) as PedidoItem[] }
}

export async function editarPedido(id: string, p: PedidoInput): Promise<void> {
  unwrap(await supabase.from('pedidos').update({ cliente_id: p.cliente_id, obs: p.obs ?? null }).eq('id', id))
  unwrap(await supabase.from('pedido_itens').delete().eq('pedido_id', id))
  unwrap(await supabase.from('pedido_itens').insert(p.itens.map((i) => ({ pedido_id: id, ...i }))))
}
