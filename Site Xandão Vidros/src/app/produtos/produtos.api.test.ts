import { describe, it, expect, vi, beforeEach } from 'vitest'

const from = vi.fn()
vi.mock('../../lib/supabase', () => ({ supabase: { from: (...a: any[]) => from(...a) } }))

import { listarProdutos, criarProduto, editarProduto, inativarProduto } from './produtos.api'

const thenable = (result: any) => {
  const o: any = {}
  for (const k of ['select', 'eq', 'order', 'insert', 'update', 'single']) o[k] = vi.fn(() => o)
  o.then = (res: any, rej: any) => Promise.resolve(result).then(res, rej)
  return o
}
const ok = (data: any) => thenable({ data, error: null })
const fail = (m = 'boom') => thenable({ data: null, error: { message: m } })

describe('produtos.api', () => {
  beforeEach(() => from.mockReset())

  it('listarProdutos traz só ativos, ordenado por nome', async () => {
    const q = ok([{ id: 'p1', nome: 'Lona', unidade: 'm²', valor_venda: 120, ativo: true }])
    from.mockReturnValueOnce(q)
    const r = await listarProdutos()
    expect(from).toHaveBeenCalledWith('produtos')
    expect(q.eq).toHaveBeenCalledWith('ativo', true)
    expect(q.order).toHaveBeenCalledWith('nome')
    expect(r[0]).toMatchObject({ nome: 'Lona', valor_venda: 120 })
  })

  it('criarProduto insere e retorna o registro', async () => {
    const q = ok({ id: 'p9', nome: 'Chapa', unidade: 'Unidade(s)', valor_venda: 50, ativo: true })
    from.mockReturnValueOnce(q)
    const input = { nome: 'Chapa', unidade: 'Unidade(s)', valor_venda: 50, descricao: null }
    const r = await criarProduto(input)
    expect(q.insert).toHaveBeenCalledWith(input)
    expect(r).toMatchObject({ id: 'p9' })
  })

  it('editarProduto atualiza por id', async () => {
    const q = ok({ id: 'p1' })
    from.mockReturnValueOnce(q)
    await editarProduto('p1', { valor_venda: 99 })
    expect(q.update).toHaveBeenCalledWith({ valor_venda: 99 })
    expect(q.eq).toHaveBeenCalledWith('id', 'p1')
  })

  it('inativarProduto marca ativo=false', async () => {
    const q = ok(null)
    from.mockReturnValueOnce(q)
    await inativarProduto('p1')
    expect(q.update).toHaveBeenCalledWith({ ativo: false })
    expect(q.eq).toHaveBeenCalledWith('id', 'p1')
  })

  it('propaga erro do supabase', async () => {
    from.mockReturnValueOnce(fail())
    await expect(listarProdutos()).rejects.toMatchObject({ message: 'boom' })
  })
})
