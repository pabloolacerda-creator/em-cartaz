// Regra pura, sem imports: usada pela página E pela Edge Function (Deno).
export const ERRO_ULTIMO_ADMIN = 'Não é possível remover ou rebaixar o último administrador ativo.'

export function podeRemoverOuRebaixarAdmin(args: { alvoEhAdmin: boolean; totalAdminsAtivos: number }): boolean {
  return !(args.alvoEhAdmin && args.totalAdminsAtivos <= 1)
}
