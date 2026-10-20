import { describe, it, expect, vi, beforeEach } from 'vitest'

const from = vi.fn()
vi.mock('../../lib/supabase', () => ({ supabase: { from: (...a: any[]) => from(...a) } }))

import { listarSaldos, registrarMovimentacao, historicoPorMaterial } from './estoque.api'

const thenable = (result: any) => {
  const o: any = {}
  for (const k of ['select', 'eq', 'order', 'insert', 'single']) o[k] = vi.fn(() => o)
  o.then = (res: any, rej: any) => Promise.resolve(result).then(res, rej)
  return o
}

describe('estoque.api', () => {
  beforeEach(() => from.mockReset())

  it('listarSaldos lê a view saldo_estoque ordenada por nome', async () => {
    const rows = [{ material_id: '1', nome: 'Aço', unidade: 'kg', saldo: 5 }]
    const q = thenable({ data: rows, error: null })
    from.mockReturnValue(q)
    expect(await listarSaldos()).toEqual(rows)
    expect(from).toHaveBeenCalledWith('saldo_estoque')
    expect(q.order).toHaveBeenCalledWith('nome')
  })

  it('registrarMovimentacao insere o payload e retorna a linha', async () => {
    const row = { id: 'm1', material_id: '1', tipo: 'entrada', quantidade: 10, data: 'x', obs: null, usuario_id: null }
    const q = thenable({ data: row, error: null })
    from.mockReturnValue(q)
    const m = { material_id: '1', tipo: 'entrada' as const, quantidade: 10, obs: 'nota 1' }
    expect(await registrarMovimentacao(m)).toEqual(row)
    expect(from).toHaveBeenCalledWith('movimentacoes_estoque')
    expect(q.insert).toHaveBeenCalledWith(m)
  })

  it('saída maior que o saldo NÃO é rejeitada pela api (só insere)', async () => {
    const row = { id: 'm2', material_id: '1', tipo: 'saida', quantidade: 9999, data: 'x', obs: null, usuario_id: null }
    const q = thenable({ data: row, error: null })
    from.mockReturnValue(q)
    await expect(registrarMovimentacao({ material_id: '1', tipo: 'saida', quantidade: 9999 })).resolves.toEqual(row)
    expect(q.insert).toHaveBeenCalledTimes(1)
    expect(from).toHaveBeenCalledTimes(1) // sem consulta prévia de saldo
  })

  it('historicoPorMaterial filtra por material e ordena por data desc', async () => {
    const q = thenable({ data: [], error: null })
    from.mockReturnValue(q)
    await historicoPorMaterial('1')
    expect(from).toHaveBeenCalledWith('movimentacoes_estoque')
    expect(q.eq).toHaveBeenCalledWith('material_id', '1')
    expect(q.order).toHaveBeenCalledWith('data', { ascending: false })
  })

  it('lança quando o supabase retorna erro', async () => {
    from.mockReturnValue(thenable({ data: null, error: new Error('boom') }))
    await expect(listarSaldos()).rejects.toThrow('boom')
    await expect(registrarMovimentacao({ material_id: '1', tipo: 'entrada', quantidade: 1 })).rejects.toThrow('boom')
    await expect(historicoPorMaterial('1')).rejects.toThrow('boom')
  })
})
