import { describe, it, expect } from 'vitest'
import { podeAcessar } from './permissions'
import type { Perfil, Modulo } from '../types'

const base: Perfil = {
  id: 'u1', nome: 'Teste', is_admin: false,
  pode_materia_prima: false, pode_estoque: false, pode_clientes: false, pode_pedidos: false,
  pode_produtos: false,
  pode_financeiro: false,
  pode_leads: false,
  ativo: true,
}
const todos: Modulo[] = ['materia_prima', 'estoque', 'clientes', 'pedidos', 'produtos', 'financeiro', 'leads', 'funcionarios']

describe('podeAcessar', () => {
  it('admin acessa todos os módulos', () => {
    for (const m of todos) expect(podeAcessar({ ...base, is_admin: true }, m)).toBe(true)
  })
  it('perfil só com pode_estoque acessa apenas estoque', () => {
    const p = { ...base, pode_estoque: true }
    for (const m of todos) expect(podeAcessar(p, m)).toBe(m === 'estoque')
  })
  it('cada flag libera seu módulo', () => {
    expect(podeAcessar({ ...base, pode_materia_prima: true }, 'materia_prima')).toBe(true)
    expect(podeAcessar({ ...base, pode_clientes: true }, 'clientes')).toBe(true)
    expect(podeAcessar({ ...base, pode_pedidos: true }, 'pedidos')).toBe(true)
    expect(podeAcessar({ ...base, pode_produtos: true }, 'produtos')).toBe(true)
    expect(podeAcessar({ ...base, pode_financeiro: true }, 'financeiro')).toBe(true)
    expect(podeAcessar({ ...base, pode_leads: true }, 'leads')).toBe(true)
  })
  it('funcionarios só para admin', () => {
    const p = { ...base, pode_materia_prima: true, pode_estoque: true, pode_clientes: true, pode_pedidos: true }
    expect(podeAcessar(p, 'funcionarios')).toBe(false)
  })
  it('perfil inativo não acessa nada, nem admin', () => {
    const p = { ...base, ativo: false, is_admin: true, pode_estoque: true }
    for (const m of todos) expect(podeAcessar(p, m)).toBe(false)
  })
})
