import { supabase } from '../../lib/supabase'
import type { Produto } from '../../types'

export type ProdutoInput = {
  nome: string
  unidade: string
  valor_venda: number
  descricao?: string | null
  ativo?: boolean
}

function unwrap<T>(r: { data: T; error: unknown }): T {
  if (r.error) throw r.error
  return r.data
}

export async function listarProdutos(): Promise<Produto[]> {
  return unwrap(await supabase.from('produtos').select('*').eq('ativo', true).order('nome')) as Produto[]
}

export async function criarProduto(p: ProdutoInput): Promise<Produto> {
  return unwrap(await supabase.from('produtos').insert(p).select().single()) as Produto
}

export async function editarProduto(id: string, p: Partial<ProdutoInput>): Promise<Produto> {
  return unwrap(await supabase.from('produtos').update(p).eq('id', id).select().single()) as Produto
}

export async function inativarProduto(id: string): Promise<void> {
  unwrap(await supabase.from('produtos').update({ ativo: false }).eq('id', id))
}
