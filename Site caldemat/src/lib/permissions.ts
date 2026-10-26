import type { Modulo, Perfil } from '../types'

export function podeAcessar(perfil: Perfil, modulo: Modulo): boolean {
  if (!perfil.ativo) return false
  if (perfil.is_admin) return true
  switch (modulo) {
    case 'materia_prima': return perfil.pode_materia_prima
    case 'estoque': return perfil.pode_estoque
    case 'clientes': return perfil.pode_clientes
    case 'pedidos': return perfil.pode_pedidos
    case 'produtos': return perfil.pode_produtos
    case 'financeiro': return perfil.pode_financeiro
    case 'leads': return perfil.pode_leads
    default: return false
  }
}
