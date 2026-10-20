import { supabase } from './supabase'

// Id do usuário da sessão (para auditoria); null se indisponível.
export async function usuarioAtualId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser()
    return data?.user?.id ?? null
  } catch {
    return null
  }
}
