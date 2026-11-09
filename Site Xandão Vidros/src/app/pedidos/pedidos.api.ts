import { supabase } from '../../lib/supabase'
import { usuarioAtualId } from '../../lib/usuarioAtual'
import type { Pedido, PedidoItem } from '../../types'

export type ItemInput = {
  descricao: string
  quantidade: number
  valor_unitario: number
  obs?: string | null
  // Item de produto/serviço: o banco reaplica preço/unidade e calcula valor_total.
  produto_id?: string | null
  largura?: number | null
  altura?: number | null
  descricao_adicional?: string | null
}
export type PedidoInput = {
  cliente_id: string
  obs?: string | null
  prazo_entrega?: string | null
  forma_pagamento?: string | null
  desconto?: number
  desconto_tipo?: 'valor' | 'percentual'
  itens: ItemInput[]
}

function unwrap<T>(r: { data: T; error: unknown }): T {
  if (r.error) throw r.error
  return r.data
}

// Inclui no payload só os campos adicionais realmente informados.
function camposAdicionais(p: Pick<PedidoInput, 'prazo_entrega' | 'forma_pagamento' | 'desconto' | 'desconto_tipo'>) {
  return {
    ...(p.prazo_entrega !== undefined ? { prazo_entrega: p.prazo_entrega } : {}),
    ...(p.forma_pagamento !== undefined ? { forma_pagamento: p.forma_pagamento } : {}),
    ...(p.desconto !== undefined ? { desconto: p.desconto } : {}),
    ...(p.desconto_tipo !== undefined ? { desconto_tipo: p.desconto_tipo } : {}),
  }
}

// Grava a observação interna de produção (usada na Ordem de Serviço).
export async function salvarObsProducao(id: string, obs: string | null): Promise<void> {
  unwrap(await supabase.from('pedidos').update({ obs_producao: obs }).eq('id', id))
}

// Garante (uma vez) o número da OS do pedido e devolve.
export async function gerarOS(id: string): Promise<number> {
  const { data, error } = await supabase.rpc('gerar_os', { p_id: id })
  if (error) throw error
  return Number(data)
}

export async function criarPedido(p: PedidoInput): Promise<{ id: string }> {
  const ped = unwrap(
    await supabase
      .from('pedidos')
      .insert({ cliente_id: p.cliente_id, obs: p.obs ?? null, usuario_id: await usuarioAtualId(), ...camposAdicionais(p) })
      .select()
      .single(),
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

export async function listarPedidos(): Promise<(Pedido & { cliente_nome?: string; total: number; descricoes: string })[]> {
  const [peds, totais] = await Promise.all([
    supabase.from('pedidos').select('*, clientes(nome), pedido_itens(descricao)').order('data', { ascending: false }),
    supabase.from('pedidos_total').select('*'),
  ])
  const rows = unwrap(peds) as (Pedido & { clientes?: { nome: string } | null; pedido_itens?: { descricao: string }[] })[]
  const tot = new Map((unwrap(totais) as { pedido_id: string; total: number | string }[]).map((t) => [t.pedido_id, Number(t.total)]))
  return rows.map(({ clientes, pedido_itens, ...p }) => ({
    ...p,
    cliente_nome: clientes?.nome,
    descricoes: (pedido_itens ?? []).map((i) => i.descricao).join(' | '),
    total: tot.get(p.id) ?? 0,
  }))
}

// Nomes dos usuários (para o filtro "Emitido por"), via função protegida no banco.
export async function listarUsuariosNomes(): Promise<{ id: string; nome: string }[]> {
  const { data, error } = await supabase.rpc('usuarios_nomes')
  if (error) throw error
  return (data ?? []) as { id: string; nome: string }[]
}

type ClienteJoin = { nome: string; documento?: string | null; endereco?: string | null; telefone?: string | null; email?: string | null }

export async function obterPedido(id: string): Promise<{ pedido: Pedido; itens: PedidoItem[] }> {
  const [p, i] = await Promise.all([
    supabase.from('pedidos').select('*, clientes(nome, documento, telefone, email, endereco)').eq('id', id).single(),
    supabase.from('pedido_itens').select('*').eq('pedido_id', id),
  ])
  const { clientes, ...pedido } = unwrap(p) as Pedido & { clientes?: ClienteJoin | null }
  return {
    pedido: {
      ...pedido,
      cliente_nome: clientes?.nome,
      cliente_documento: clientes?.documento,
      cliente_endereco: clientes?.endereco,
      cliente_telefone: clientes?.telefone,
      cliente_email: clientes?.email,
    },
    itens: unwrap(i) as PedidoItem[],
  }
}

export async function editarPedido(id: string, p: PedidoInput): Promise<void> {
  unwrap(await supabase.from('pedidos').update({ cliente_id: p.cliente_id, obs: p.obs ?? null, ...camposAdicionais(p) }).eq('id', id))
  unwrap(await supabase.from('pedido_itens').delete().eq('pedido_id', id))
  unwrap(await supabase.from('pedido_itens').insert(p.itens.map((i) => ({ pedido_id: id, ...i }))))
}

// Ciclo de status: emitido → aprovado/reprovado → faturado.
export async function aprovarPedido(id: string): Promise<void> {
  unwrap(await supabase.from('pedidos').update({ status: 'aprovado' }).eq('id', id))
}

export async function reprovarPedido(id: string): Promise<void> {
  unwrap(await supabase.from('pedidos').update({ status: 'reprovado' }).eq('id', id))
}

export async function faturarPedido(id: string): Promise<void> {
  unwrap(await supabase.from('pedidos').update({ status: 'faturado', faturado_em: new Date().toISOString() }).eq('id', id))
}
