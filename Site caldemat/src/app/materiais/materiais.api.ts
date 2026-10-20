import { supabase } from '../../lib/supabase'
import type { Material } from '../../types'

export type MaterialInput = { nome: string; unidade: string; estoque_minimo?: number | null }

function unwrap<T>(r: { data: T; error: unknown }): T {
  if (r.error) throw r.error
  return r.data
}

export async function listarMateriais(): Promise<Material[]> {
  return unwrap(await supabase.from('materiais_prima').select('*').eq('ativo', true).order('nome')) as Material[]
}

export async function criarMaterial(m: MaterialInput): Promise<Material> {
  return unwrap(await supabase.from('materiais_prima').insert(m).select().single()) as Material
}

export async function editarMaterial(id: string, m: Partial<MaterialInput>): Promise<Material> {
  return unwrap(await supabase.from('materiais_prima').update(m).eq('id', id).select().single()) as Material
}

export async function inativarMaterial(id: string): Promise<void> {
  unwrap(await supabase.from('materiais_prima').update({ ativo: false }).eq('id', id))
}
