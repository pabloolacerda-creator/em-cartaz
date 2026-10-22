import { describe, it, expect, vi, beforeEach } from 'vitest'

const from = vi.fn()
const getUser = vi.fn()
vi.mock('../../lib/supabase', () => ({ supabase: { from: (...a: any[]) => from(...a), auth: { getUser: (...a: any[]) => getUser(...a) } } }))

import { listarContas, criarConta, listarLancamentos, criarLancamento, marcarPago, gerarContaReceber } from './financeiro.api'

const thenable = (result: any) => {
  const o: any = {}
  for (const k of ['select', 'eq', 'order', 'insert', 'update', 'delete', 'single', 'limit']) o[k] = vi.fn(() => o)
  o.then = (res: any, rej: any) => Promise.resolve(result).then(res, rej)
  return o
}
const ok = (data: any) => thenable({ data, error: null })

describe('financeiro.api', () => {
  beforeEach(() => {
    from.mockReset()
    getUser.mockReset()
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
  })

  it('listarContas junta o saldo da view saldo_contas', async () => {
    const qc = ok([{ id: 'c1', nome: 'Banco X', tipo: 'banco', saldo_inicial: 100, ativo: true }])
    const qs = ok([{ conta_id: 'c1', saldo: 350 }])
    from.mockReturnValueOnce(qc).mockReturnValueOnce(qs)
    const r = await listarContas()
    expect(r[0]).toMatchObject({ id: 'c1', nome: 'Banco X', saldo: 350 })
  })

  it('criarConta insere a conta', async () => {
    const q = ok({ id: 'c9' })
    from.mockReturnValueOnce(q)
    await criarConta({ nome: 'Caixa', tipo: 'caixa', saldo_inicial: 0 })
    expect(q.insert).toHaveBeenCalledWith({ nome: 'Caixa', tipo: 'caixa', saldo_inicial: 0 })
  })

  it('listarLancamentos ordena por vencimento', async () => {
    const q = ok([{ id: 'l1', tipo: 'receita', descricao: 'X', valor: 10, vencimento: '2026-01-01' }])
    from.mockReturnValueOnce(q)
    await listarLancamentos()
    expect(from).toHaveBeenCalledWith('lancamentos')
    expect(q.order).toHaveBeenCalledWith('vencimento', { ascending: true })
  })

  it('criarLancamento grava com usuario_id', async () => {
    const q = ok({ id: 'l9' })
    from.mockReturnValueOnce(q)
    await criarLancamento({ tipo: 'despesa', descricao: 'Luz', valor: 200, vencimento: '2026-02-10' })
    expect(q.insert).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'despesa', descricao: 'Luz', valor: 200, vencimento: '2026-02-10', usuario_id: 'u1' }))
  })

  it('marcarPago grava data e conta', async () => {
    const q = ok(null)
    from.mockReturnValueOnce(q)
    await marcarPago('l1', '2026-02-05', 'c1')
    expect(q.update).toHaveBeenCalledWith({ pago_em: '2026-02-05', conta_id: 'c1' })
    expect(q.eq).toHaveBeenCalledWith('id', 'l1')
  })

  it('gerarContaReceber cria receita quando não existe, e recusa duplicado', async () => {
    const qcheck = ok([])
    const qins = ok(null)
    from.mockReturnValueOnce(qcheck).mockReturnValueOnce(qins)
    await gerarContaReceber({ id: 'p1', cliente_id: 'cl1', numero: 7, total: 1500 })
    expect(qins.insert).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'receita', valor: 1500, cliente_id: 'cl1', pedido_id: 'p1', usuario_id: 'u1' }))

    from.mockReset()
    from.mockReturnValueOnce(ok([{ id: 'l1' }]))
    await expect(gerarContaReceber({ id: 'p1', cliente_id: 'cl1', numero: 7, total: 1500 })).rejects.toThrow(/já tem/i)
  })
})
