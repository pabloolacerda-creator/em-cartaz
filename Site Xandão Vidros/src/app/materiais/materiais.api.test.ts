import { describe, it, expect, vi, beforeEach } from 'vitest'

const from = vi.fn()
vi.mock('../../lib/supabase', () => ({ supabase: { from: (...a: any[]) => from(...a) } }))

import { listarMateriais, criarMaterial, editarMaterial, inativarMaterial } from './materiais.api'

const thenable = (result: any) => {
  const o: any = {}
  for (const k of ['select', 'eq', 'order', 'insert', 'update', 'single']) o[k] = vi.fn(() => o)
  o.then = (res: any, rej: any) => Promise.resolve(result).then(res, rej)
  return o
}

describe('materiais.api', () => {
  beforeEach(() => from.mockReset())

  it('listarMateriais filtra ativos e ordena por nome', async () => {
    const rows = [{ id: '1', nome: 'Aço', unidade: 'kg', estoque_minimo: null, ativo: true }]
    const q = thenable({ data: rows, error: null })
    from.mockReturnValue(q)
    expect(await listarMateriais()).toEqual(rows)
    expect(from).toHaveBeenCalledWith('materiais_prima')
    expect(q.eq).toHaveBeenCalledWith('ativo', true)
    expect(q.order).toHaveBeenCalledWith('nome')
  })

  it('criarMaterial insere {nome,unidade} e retorna a linha', async () => {
    const row = { id: '2', nome: 'Cobre', unidade: 'kg', estoque_minimo: null, ativo: true }
    const q = thenable({ data: row, error: null })
    from.mockReturnValue(q)
    expect(await criarMaterial({ nome: 'Cobre', unidade: 'kg' })).toEqual(row)
    expect(q.insert).toHaveBeenCalledWith({ nome: 'Cobre', unidade: 'kg' })
  })

  it('criarMaterial inclui estoque_minimo quando informado', async () => {
    const q = thenable({ data: { id: '3' }, error: null })
    from.mockReturnValue(q)
    await criarMaterial({ nome: 'Tubo', unidade: 'barra', estoque_minimo: 5 })
    expect(q.insert).toHaveBeenCalledWith({ nome: 'Tubo', unidade: 'barra', estoque_minimo: 5 })
  })

  it('editarMaterial atualiza por id', async () => {
    const q = thenable({ data: { id: '1', nome: 'X' }, error: null })
    from.mockReturnValue(q)
    expect(await editarMaterial('1', { nome: 'X' })).toEqual({ id: '1', nome: 'X' })
    expect(q.update).toHaveBeenCalledWith({ nome: 'X' })
    expect(q.eq).toHaveBeenCalledWith('id', '1')
  })

  it('inativarMaterial marca ativo=false', async () => {
    const q = thenable({ data: null, error: null })
    from.mockReturnValue(q)
    await inativarMaterial('1')
    expect(q.update).toHaveBeenCalledWith({ ativo: false })
    expect(q.eq).toHaveBeenCalledWith('id', '1')
  })

  it('lança quando supabase retorna erro', async () => {
    const err = new Error('falhou')
    from.mockReturnValue(thenable({ data: null, error: err }))
    await expect(listarMateriais()).rejects.toBe(err)
    await expect(criarMaterial({ nome: 'a', unidade: 'kg' })).rejects.toBe(err)
    await expect(inativarMaterial('1')).rejects.toBe(err)
  })
})
