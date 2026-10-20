import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'

const api = vi.hoisted(() => ({ listarPedidos: vi.fn(), criarPedido: vi.fn() }))
const cli = vi.hoisted(() => ({ listarClientes: vi.fn() }))
vi.mock('./pedidos.api', () => api)
vi.mock('../clientes/clientes.api', () => cli)

import PedidosPage from './PedidosPage'

const ana = { id: 'c1', nome: 'Ana', ativo: true }
const bia = { id: 'c2', nome: 'Bia', ativo: true }
const ped = (o: any = {}) => ({ id: 'p1', cliente_id: 'c1', data: '2026-03-05', obs: null, usuario_id: null, cliente_nome: 'Ana', total: 1234.56, ...o })
// normaliza espaços (inclui NBSP) para comparar "R$ 1.234,56"
const norm = (s: string | null) => (s ?? '').replace(/\s/g, ' ')

async function pronto() {
  render(<PedidosPage />)
  await screen.findByRole('option', { name: 'Ana' })
}
const setItem = (i: number, d: string, q: string, v: string) => {
  fireEvent.change(screen.getAllByLabelText(/descrição/i)[i], { target: { value: d } })
  fireEvent.change(screen.getAllByLabelText(/quantidade/i)[i], { target: { value: q } })
  fireEvent.change(screen.getAllByLabelText(/valor unitário/i)[i], { target: { value: v } })
}

describe('PedidosPage', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    cli.listarClientes.mockReset()
    cli.listarClientes.mockResolvedValue([ana, bia])
    api.listarPedidos.mockResolvedValue([])
  })

  it('lista pedidos com cliente, data e total formatado em R$', async () => {
    api.listarPedidos.mockResolvedValue([ped()])
    render(<PedidosPage />)
    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
    const row = (await screen.findByText('05/03/2026')).closest('tr')!
    expect(within(row).getByText('Ana')).toBeInTheDocument()
    expect(norm(row.textContent)).toContain('R$ 1.234,56')
  })

  it('total do item e total do pedido ao vivo (soma sem erro de centavo)', async () => {
    await pronto()
    setItem(0, 'Cimento', '2', '1.234,56') // 2469,12
    expect(norm(screen.getByTestId('total-item-0').textContent)).toBe('R$ 2.469,12')
    expect(norm(screen.getByTestId('total-pedido').textContent)).toBe('R$ 2.469,12')
    fireEvent.click(screen.getByRole('button', { name: /adicionar item/i }))
    setItem(1, 'Prego', '3', '0,10') // 3 x 0,10 = 0,30 (ponto flutuante ingênuo erra)
    expect(norm(screen.getByTestId('total-item-1').textContent)).toBe('R$ 0,30')
    expect(norm(screen.getByTestId('total-pedido').textContent)).toBe('R$ 2.469,42')
    setItem(0, 'Cimento', '3', '1.234,56') // atualiza ao editar
    expect(norm(screen.getByTestId('total-pedido').textContent)).toBe('R$ 3.703,98')
  })

  it('salva com valor_unitario numérico (1.234,56 -> 1234.56) e vários itens', async () => {
    api.criarPedido.mockResolvedValue({ id: 'p9' })
    await pronto()
    fireEvent.change(screen.getByLabelText(/^cliente$/i), { target: { value: 'c2' } })
    setItem(0, '  Cimento ', '2', '1.234,56')
    fireEvent.click(screen.getByRole('button', { name: /adicionar item/i }))
    setItem(1, 'Areia', '1', '10')
    fireEvent.click(screen.getByRole('button', { name: /salvar pedido/i }))
    await waitFor(() => expect(api.criarPedido).toHaveBeenCalledTimes(1))
    expect(api.criarPedido).toHaveBeenCalledWith({
      cliente_id: 'c2',
      obs: null,
      itens: [
        { descricao: 'Cimento', quantidade: 2, valor_unitario: 1234.56 },
        { descricao: 'Areia', quantidade: 1, valor_unitario: 10 },
      ],
    })
    await waitFor(() => expect(api.listarPedidos).toHaveBeenCalledTimes(2))
  })

  it('valor inválido ("abc") não vai NaN no payload e mostra erro', async () => {
    await pronto()
    fireEvent.change(screen.getByLabelText(/^cliente$/i), { target: { value: 'c1' } })
    setItem(0, 'Cimento', '2', 'abc')
    expect(screen.getByTestId('total-pedido').textContent).not.toMatch(/NaN/)
    fireEvent.click(screen.getByRole('button', { name: /salvar pedido/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/valor/i)
    expect(api.criarPedido).not.toHaveBeenCalled()
  })

  it('exige cliente, descrição e quantidade > 0', async () => {
    await pronto()
    setItem(0, 'X', '1', '1')
    fireEvent.click(screen.getByRole('button', { name: /salvar pedido/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/cliente/i)
    fireEvent.change(screen.getByLabelText(/^cliente$/i), { target: { value: 'c1' } })
    setItem(0, '   ', '1', '1')
    fireEvent.click(screen.getByRole('button', { name: /salvar pedido/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/descrição/i)
    setItem(0, 'X', '0', '1')
    fireEvent.click(screen.getByRole('button', { name: /salvar pedido/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/quantidade/i)
    expect(api.criarPedido).not.toHaveBeenCalled()
  })

  it('filtra a lista por cliente e por data', async () => {
    api.listarPedidos.mockResolvedValue([ped(), ped({ id: 'p2', cliente_nome: 'Bia', data: '2026-04-10', total: 5 })])
    render(<PedidosPage />)
    await screen.findByText('05/03/2026')
    fireEvent.change(screen.getByLabelText(/buscar/i), { target: { value: 'bia' } })
    expect(screen.queryByText('05/03/2026')).not.toBeInTheDocument()
    expect(screen.getByText('10/04/2026')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/buscar/i), { target: { value: '05/03' } })
    expect(screen.getByText('05/03/2026')).toBeInTheDocument()
    expect(screen.queryByText('10/04/2026')).not.toBeInTheDocument()
  })

  it('não mostra mensagem de vazio quando há erro de carga', async () => {
    api.listarPedidos.mockRejectedValue(new Error('boom'))
    render(<PedidosPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/boom/)
    expect(screen.queryByText(/nenhum pedido/i)).not.toBeInTheDocument()
  })

  it('erro ao salvar é exibido e botão volta a habilitar', async () => {
    api.criarPedido.mockRejectedValue(new Error('falhou'))
    await pronto()
    fireEvent.change(screen.getByLabelText(/^cliente$/i), { target: { value: 'c1' } })
    setItem(0, 'X', '1', '1,00')
    fireEvent.click(screen.getByRole('button', { name: /salvar pedido/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/falhou/)
    expect(screen.getByRole('button', { name: /salvar pedido/i })).toBeEnabled()
  })
})
