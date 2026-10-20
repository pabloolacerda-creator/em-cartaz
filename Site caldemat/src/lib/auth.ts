import { supabase } from './supabase'
import type { Perfil } from '../types'

export const ERRO_LOGIN = 'Usuário ou senha inválidos'

export function usuarioParaEmail(usuario: string): string {
  return `${usuario.trim().toLowerCase()}@caldemat.local`
}

export async function entrar(usuario: string, senha: string): Promise<{ erro?: string }> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: usuarioParaEmail(usuario),
      password: senha,
    })
    return error ? { erro: ERRO_LOGIN } : {}
  } catch {
    return { erro: ERRO_LOGIN }
  }
}

export async function sair(): Promise<void> {
  await supabase.auth.signOut()
}

export async function getPerfilAtual(): Promise<Perfil | null> {
  const { data } = await supabase.auth.getUser()
  const user = data?.user
  if (!user) return null
  const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).maybeSingle()
  return (perfil as Perfil | null) ?? null
}
