import type { Modulo, Perfil } from '../types'

export function podeAcessar(perfil: Perfil, modulo: Modulo): boolean {
  if (!perfil.ativo) return false
  if (perfil.is_admin) return true
  switch (modulo) {
    case 'materia_prima': return perfil.pode_materia_prima
    case 'estoque': return perfil.pode_estoque
    case 'clientes': return perfil.pode_clientes
    case 'pedidos': return perfil.pode_pedidos
    default: return false
  }
}
