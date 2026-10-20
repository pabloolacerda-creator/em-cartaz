import { describe, it, expect } from 'vitest'
import { podeRemoverOuRebaixarAdmin, ERRO_ULTIMO_ADMIN } from './adminGuard'

describe('podeRemoverOuRebaixarAdmin', () => {
  it('bloqueia remover/rebaixar o último admin ativo', () => {
    expect(podeRemoverOuRebaixarAdmin({ alvoEhAdmin: true, totalAdminsAtivos: 1 })).toBe(false)
    expect(podeRemoverOuRebaixarAdmin({ alvoEhAdmin: true, totalAdminsAtivos: 0 })).toBe(false)
  })
  it('alvo não-admin sempre pode', () => {
    expect(podeRemoverOuRebaixarAdmin({ alvoEhAdmin: false, totalAdminsAtivos: 1 })).toBe(true)
    expect(podeRemoverOuRebaixarAdmin({ alvoEhAdmin: false, totalAdminsAtivos: 0 })).toBe(true)
  })
  it('admin pode quando há 2 ou mais admins ativos', () => {
    expect(podeRemoverOuRebaixarAdmin({ alvoEhAdmin: true, totalAdminsAtivos: 2 })).toBe(true)
    expect(podeRemoverOuRebaixarAdmin({ alvoEhAdmin: true, totalAdminsAtivos: 5 })).toBe(true)
  })
  it('expõe a mensagem de erro', () => {
    expect(ERRO_ULTIMO_ADMIN).toBe('Não é possível remover ou rebaixar o último administrador ativo.')
  })
})
