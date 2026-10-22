import { describe, it, expect, vi, beforeEach } from 'vitest'

const from = vi.fn()
const invoke = vi.fn()
vi.mock('../../lib/supabase', () => ({
  supabase: { from: (...a: any[]) => from(...a), functions: { invoke: (...a: any[]) => invoke(...a) } },
}))

import { listarFuncionarios, criarFuncionario, resetarSenha, inativarFuncionario } from './funcionarios.api'
import { ERRO_ULTIMO_ADMIN } from '../../lib/adminGuard'

const thenable = (result: any) => {
  const o: any = {}
  for (const k of ['select', 'order']) o[k] = vi.fn(() => o)
  o.then = (res: any, rej: any) => Promise.resolve(result).then(res, rej)
  return o
}

const perms = { pode_materia_prima: true, pode_estoque: false, pode_clientes: false, pode_pedidos: true, pode_produtos: false }

describe('funcionarios.api', () => {
  beforeEach(() => {
    from.mockReset()
    invoke.mockReset()
  })

  it('listarFuncionarios lê perfis ordenados por nome', async () => {
    const q = thenable({ data: [{ id: '1' }], error: null })
    from.mockReturnValue(q)
    expect(await listarFuncionarios()).toEqual([{ id: '1' }])
    expect(from).toHaveBeenCalledWith('perfis')
    expect(q.order).toHaveBeenCalledWith('nome')
  })

  it('criarFuncionario invoca admin-users com acao criar', async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null })
    await criarFuncionario({ usuario: 'ana', senha: 'segredo1', nome: 'Ana', permissoes: perms, is_admin: false })
    expect(invoke).toHaveBeenCalledWith('admin-users', {
      body: { acao: 'criar', usuario: 'ana', senha: 'segredo1', nome: 'Ana', permissoes: perms, is_admin: false },
    })
  })

  it('resetarSenha e inativarFuncionario enviam o payload certo', async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null })
    await resetarSenha('u1', 'nova123')
    expect(invoke).toHaveBeenCalledWith('admin-users', { body: { acao: 'resetar_senha', id: 'u1', nova_senha: 'nova123' } })
    await inativarFuncionario('u1')
    expect(invoke).toHaveBeenCalledWith('admin-users', { body: { acao: 'inativar', id: 'u1' } })
  })

  it('lança em erro de invoke', async () => {
    invoke.mockResolvedValue({ data: null, error: new Error('falhou') })
    await expect(inativarFuncionario('u1')).rejects.toThrow('falhou')
  })

  it('traduz erro ultimo_admin (payload de erro)', async () => {
    invoke.mockResolvedValue({ data: { erro: 'ultimo_admin' }, error: null })
    await expect(inativarFuncionario('u1')).rejects.toThrow(ERRO_ULTIMO_ADMIN)
  })

  it('traduz ultimo_admin vindo do corpo HTTP 409', async () => {
    const context = { json: async () => ({ erro: 'ultimo_admin' }) }
    invoke.mockResolvedValue({ data: null, error: Object.assign(new Error('non-2xx'), { context }) })
    await expect(inativarFuncionario('u1')).rejects.toThrow(ERRO_ULTIMO_ADMIN)
  })
})
