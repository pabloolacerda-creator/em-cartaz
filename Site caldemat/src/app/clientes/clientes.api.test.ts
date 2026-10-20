import { describe, it, expect, vi, beforeEach } from 'vitest'

const from = vi.fn()
vi.mock('../../lib/supabase', () => ({ supabase: { from: (...a: any[]) => from(...a) } }))

import { listarClientes, criarCliente, editarCliente, inativarCliente } from './clientes.api'

const thenable = (result: any) => {
  const o: any = {}
  for (const k of ['select', 'eq', 'order', 'insert', 'update', 'single']) o[k] = vi.fn(() => o)
  o.then = (res: any, rej: any) => Promise.resolve(result).then(res, rej)
  return o
}

describe('clientes.api', () => {
  beforeEach(() => from.mockReset())

  it('listarClientes filtra ativos e ordena por nome', async () => {
    const rows = [{ id: '1', nome: 'Ana', ativo: true }]
    const q = thenable({ data: rows, error: null })
    from.mockReturnValue(q)
    expect(await listarClientes()).toEqual(rows)
    expect(from).toHaveBeenCalledWith('clientes')
    expect(q.eq).toHaveBeenCalledWith('ativo', true)
    expect(q.order).toHaveBeenCalledWith('nome')
  })

  it('criarCliente insere em clientes e retorna a linha', async () => {
    const row = { id: '2', nome: 'Bia' }
    const q = thenable({ data: row, error: null })
    from.mockReturnValue(q)
    expect(await criarCliente({ nome: 'Bia', telefone: '11' })).toEqual(row)
    expect(from).toHaveBeenCalledWith('clientes')
    expect(q.insert).toHaveBeenCalledWith({ nome: 'Bia', telefone: '11' })
  })

  it('editarCliente atualiza por id', async () => {
    const q = thenable({ data: { id: '1', nome: 'X' }, error: null })
    from.mockReturnValue(q)
    expect(await editarCliente('1', { nome: 'X' })).toEqual({ id: '1', nome: 'X' })
    expect(q.update).toHaveBeenCalledWith({ nome: 'X' })
    expect(q.eq).toHaveBeenCalledWith('id', '1')
  })

  it('inativarCliente marca ativo=false', async () => {
    const q = thenable({ data: null, error: null })
    from.mockReturnValue(q)
    await inativarCliente('1')
    expect(q.update).toHaveBeenCalledWith({ ativo: false })
    expect(q.eq).toHaveBeenCalledWith('id', '1')
  })

  it('lança quando supabase retorna erro', async () => {
    const err = new Error('falhou')
    from.mockReturnValue(thenable({ data: null, error: err }))
    await expect(listarClientes()).rejects.toBe(err)
    await expect(criarCliente({ nome: 'a' })).rejects.toBe(err)
    await expect(editarCliente('1', { nome: 'a' })).rejects.toBe(err)
    await expect(inativarCliente('1')).rejects.toBe(err)
  })
})
