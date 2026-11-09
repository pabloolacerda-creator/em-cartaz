import { supabase } from '../../lib/supabase'
import { ERRO_ULTIMO_ADMIN } from '../../lib/adminGuard'
import type { Perfil } from '../../types'

export type Permissoes = {
  pode_materia_prima: boolean
  pode_estoque: boolean
  pode_clientes: boolean
  pode_pedidos: boolean
  pode_produtos: boolean
  pode_financeiro: boolean
}

export type NovoFuncionario = {
  usuario: string
  senha: string
  nome: string
  permissoes: Permissoes
  is_admin?: boolean
  // Dados cadastrais (opcionais) — enviados ao backend quando preenchidos.
  cpf?: string
  telefone?: string
  cargo?: string
  data_admissao?: string
  email?: string
}

export async function listarFuncionarios(): Promise<Perfil[]> {
  const { data, error } = await supabase.from('perfis').select('*').order('nome')
  if (error) throw error
  return data as Perfil[]
}

const textoErro = (codigo: unknown) => (codigo === 'ultimo_admin' ? ERRO_ULTIMO_ADMIN : String(codigo))

async function chamar(body: Record<string, unknown>): Promise<void> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body })
  if (error) {
    // Respostas não-2xx (ex.: 409 ultimo_admin) chegam em error.context (Response).
    try {
      const corpo = await (error as { context?: { json?: () => Promise<{ erro?: unknown }> } }).context?.json?.()
      if (corpo?.erro) throw new Error(textoErro(corpo.erro))
    } catch (e) {
      if (e instanceof Error && e !== error && e.message !== (error as Error).message) throw e
    }
    throw error
  }
  if (data && typeof data === 'object' && 'erro' in data && (data as { erro?: unknown }).erro) {
    throw new Error(textoErro((data as { erro: unknown }).erro))
  }
}

export const criarFuncionario = (a: NovoFuncionario) => chamar({ acao: 'criar', ...a })
export const resetarSenha = (id: string, nova: string) => chamar({ acao: 'resetar_senha', id, nova_senha: nova })
export const inativarFuncionario = (id: string) => chamar({ acao: 'inativar', id })
export const ativarFuncionario = (id: string) => chamar({ acao: 'ativar', id })
