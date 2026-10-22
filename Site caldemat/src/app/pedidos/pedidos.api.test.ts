import { describe, it, expect, vi, beforeEach } from 'vitest'

const from = vi.fn()
const getUser = vi.fn()
vi.mock('../../lib/supabase', () => ({ supabase: { from: (...a: any[]) => from(...a), auth: { getUser: (...a: any[]) => getUser(...a) } } }))

import { criarPedido, listarPedidos, obterPedido, editarPedido, aprovarPedido, reprovarPedido, faturarPedido } from './pedidos.api'

const thenable = (result: any) => {
  const o: any = {}
  for (const k of ['select', 'eq', 'order', 'insert', 'update', 'delete', 'single']) o[k] = vi.fn(() => o)
  o.then = (res: any, rej: any) => Promise.resolve(result).then(res, rej)
  return o
}
const ok = (data: any) => thenable({ data, error: null })
const fail = (m = 'boom') => thenable({ data: null, error: { message: m } })

const itens = [
  { descricao: 'Cimento', quantidade: 2, valor_unitario: 1234.56 },
  { descricao: 'Areia', quantidade: 1, valor_unitario: 10 },
]

describe('pedidos.api', () => {
  beforeEach(() => {
    from.mockReset()
    getUser.mockReset()
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
  })

  it('criarPedido insere o pedido e depois os itens com o novo pedido_id (valor numérico)', async () => {
    const qp = ok({ id: 'p1' })
    const qi = ok(null)
    from.mockReturnValueOnce(qp).mockReturnValueOnce(qi)
    expect(await criarPedido({ cliente_id: 'c1', obs: null, itens })).toEqual({ id: 'p1' })
    expect(from).toHaveBeenNthCalledWith(1, 'pedidos')
    expect(qp.insert).toHaveBeenCalledWith({ cliente_id: 'c1', obs: null, usuario_id: 'u1' })
    expect(from).toHaveBeenNthCalledWith(2, 'pedido_itens')
    expect(qi.insert).toHaveBeenCalledWith([
      { pedido_id: 'p1', descricao: 'Cimento', quantidade: 2, valor_unitario: 1234.56 },
      { pedido_id: 'p1', descricao: 'Areia', quantidade: 1, valor_unitario: 10 },
    ])
    expect(typeof (qi.insert.mock.calls[0][0] as any)[0].valor_unitario).toBe('number')
  })

  it('criarPedido lança erro do supabase e desfaz o pedido se os itens falham', async () => {
    from.mockReturnValueOnce(fail('x'))
    await expect(criarPedido({ cliente_id: 'c1', itens })).rejects.toMatchObject({ message: 'x' })
    from.mockReset()
    const qdel = ok(null)
    from.mockReturnValueOnce(ok({ id: 'p1' })).mockReturnValueOnce(fail('itens')).mockReturnValueOnce(qdel)
    await expect(criarPedido({ cliente_id: 'c1', itens })).rejects.toMatchObject({ message: 'itens' })
    expect(from).toHaveBeenNthCalledWith(3, 'pedidos')
    expect(qdel.delete).toHaveBeenCalled()
    expect(qdel.eq).toHaveBeenCalledWith('id', 'p1')
  })

  it('listarPedidos junta total e nome do cliente, ordenado por data desc', async () => {
    const qp = ok([
      { id: 'p1', cliente_id: 'c1', data: '2026-01-02', obs: null, usuario_id: null, clientes: { nome: 'Ana' } },
      { id: 'p2', cliente_id: 'c2', data: '2026-01-01', obs: null, usuario_id: null, clientes: null },
    ])
    const qt = ok([{ pedido_id: 'p1', total: '2479.12' }])
    from.mockReturnValueOnce(qp).mockReturnValueOnce(qt)
    const r = await listarPedidos()
    expect(from).toHaveBeenNthCalledWith(1, 'pedidos')
    expect(from).toHaveBeenNthCalledWith(2, 'pedidos_total')
    expect(qp.order).toHaveBeenCalledWith('data', { ascending: false })
    expect(r[0]).toMatchObject({ id: 'p1', cliente_nome: 'Ana', total: 2479.12 })
    expect(r[1]).toMatchObject({ id: 'p2', total: 0 })
  })

  it('listarPedidos lança erro do supabase', async () => {
    from.mockReturnValueOnce(fail()).mockReturnValueOnce(ok([]))
    await expect(listarPedidos()).rejects.toMatchObject({ message: 'boom' })
  })

  it('obterPedido retorna pedido e itens', async () => {
    const ped = { id: 'p1', cliente_id: 'c1', data: 'd', obs: null, usuario_id: null }
    const its = [{ id: 'i1', pedido_id: 'p1', descricao: 'A', quantidade: 1, valor_unitario: 2 }]
    from.mockReturnValueOnce(ok(ped)).mockReturnValueOnce(ok(its))
    expect(await obterPedido('p1')).toEqual({ pedido: ped, itens: its })
    from.mockReset()
    from.mockReturnValueOnce(fail()).mockReturnValueOnce(ok([]))
    await expect(obterPedido('p1')).rejects.toBeTruthy()
  })

  it('editarPedido atualiza, apaga itens antigos e insere os novos', async () => {
    const qu = ok(null), qd = ok(null), qi = ok(null)
    from.mockReturnValueOnce(qu).mockReturnValueOnce(qd).mockReturnValueOnce(qi)
    await editarPedido('p1', { cliente_id: 'c1', obs: 'x', itens })
    expect(qu.update).toHaveBeenCalledWith({ cliente_id: 'c1', obs: 'x' })
    expect(qu.eq).toHaveBeenCalledWith('id', 'p1')
    expect(from).toHaveBeenNthCalledWith(2, 'pedido_itens')
    expect(qd.delete).toHaveBeenCalled()
    expect(qd.eq).toHaveBeenCalledWith('pedido_id', 'p1')
    expect(qi.insert).toHaveBeenCalledWith(itens.map((i) => ({ pedido_id: 'p1', ...i })))
  })

  it('editarPedido lança erro do supabase', async () => {
    from.mockReturnValueOnce(fail('e'))
    await expect(editarPedido('p1', { cliente_id: 'c1', itens })).rejects.toMatchObject({ message: 'e' })
  })

  it('aprovarPedido e reprovarPedido mudam o status', async () => {
    const qa = ok(null)
    from.mockReturnValueOnce(qa)
    await aprovarPedido('p1')
    expect(from).toHaveBeenCalledWith('pedidos')
    expect(qa.update).toHaveBeenCalledWith({ status: 'aprovado' })
    expect(qa.eq).toHaveBeenCalledWith('id', 'p1')

    from.mockReset()
    const qr = ok(null)
    from.mockReturnValueOnce(qr)
    await reprovarPedido('p2')
    expect(qr.update).toHaveBeenCalledWith({ status: 'reprovado' })
    expect(qr.eq).toHaveBeenCalledWith('id', 'p2')
  })

  it('faturarPedido marca faturado com data', async () => {
    const q = ok(null)
    from.mockReturnValueOnce(q)
    await faturarPedido('p1')
    const arg = q.update.mock.calls[0][0] as { status: string; faturado_em: string }
    expect(arg.status).toBe('faturado')
    expect(typeof arg.faturado_em).toBe('string')
    expect(q.eq).toHaveBeenCalledWith('id', 'p1')
  })

  it('aprovarPedido lança erro do supabase', async () => {
    from.mockReturnValueOnce(fail('e'))
    await expect(aprovarPedido('p1')).rejects.toMatchObject({ message: 'e' })
  })

  it('criarPedido inclui prazo_entrega, forma_pagamento e obs do item quando informados', async () => {
    const qp = ok({ id: 'p1' })
    const qi = ok(null)
    from.mockReturnValueOnce(qp).mockReturnValueOnce(qi)
    await criarPedido({
      cliente_id: 'c1',
      obs: 'geral',
      prazo_entrega: '30 dias',
      forma_pagamento: 'Pix',
      itens: [{ descricao: 'Tanque', quantidade: 1, valor_unitario: 100, obs: 'inox 304' }],
    })
    expect(qp.insert).toHaveBeenCalledWith({
      cliente_id: 'c1',
      obs: 'geral',
      usuario_id: 'u1',
      prazo_entrega: '30 dias',
      forma_pagamento: 'Pix',
    })
    expect(qi.insert).toHaveBeenCalledWith([
      { pedido_id: 'p1', descricao: 'Tanque', quantidade: 1, valor_unitario: 100, obs: 'inox 304' },
    ])
  })

  it('criarPedido envia os campos de item de produto (produto_id, medidas, descrição adicional)', async () => {
    const qp = ok({ id: 'p1' })
    const qi = ok(null)
    from.mockReturnValueOnce(qp).mockReturnValueOnce(qi)
    await criarPedido({
      cliente_id: 'c1',
      itens: [
        { descricao: 'Lona 440', quantidade: 2, valor_unitario: 120, produto_id: 'prod1', largura: 1.5, altura: 2, descricao_adicional: 'reforçada' },
      ],
    })
    expect(qi.insert).toHaveBeenCalledWith([
      { pedido_id: 'p1', descricao: 'Lona 440', quantidade: 2, valor_unitario: 120, produto_id: 'prod1', largura: 1.5, altura: 2, descricao_adicional: 'reforçada' },
    ])
  })

  it('obterPedido/listarPedidos expõem o número nativo do pedido', async () => {
    const ped = { id: 'p1', cliente_id: 'c1', data: 'd', obs: null, usuario_id: null, numero: 7, fatura_numero: 3 }
    from.mockReturnValueOnce(ok(ped)).mockReturnValueOnce(ok([]))
    const { pedido } = await obterPedido('p1')
    expect(pedido.numero).toBe(7)
    expect(pedido.fatura_numero).toBe(3)
  })

  it('obterPedido traz os dados do cliente (documento, endereço, contato)', async () => {
    const ped = {
      id: 'p1', cliente_id: 'c1', data: 'd', obs: null, usuario_id: null,
      clientes: { nome: 'Ana', documento: '12.345.678/0001-90', endereco: 'Rua X, 10', telefone: '(65) 99', email: 'ana@ex.com' },
    }
    from.mockReturnValueOnce(ok(ped)).mockReturnValueOnce(ok([]))
    const { pedido } = await obterPedido('p1')
    expect(pedido.cliente_nome).toBe('Ana')
    expect(pedido.cliente_documento).toBe('12.345.678/0001-90')
    expect(pedido.cliente_endereco).toBe('Rua X, 10')
    expect(pedido.cliente_telefone).toBe('(65) 99')
    expect(pedido.cliente_email).toBe('ana@ex.com')
  })
})
