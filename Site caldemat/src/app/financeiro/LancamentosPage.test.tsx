import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const api = vi.hoisted(() => ({
  listarLancamentos: vi.fn(), criarLancamento: vi.fn(), marcarPago: vi.fn(),
  excluirLancamento: vi.fn(), listarContas: vi.fn(),
}))
const cli = vi.hoisted(() => ({ listarClientes: vi.fn() }))
vi.mock('./financeiro.api', () => api)
vi.mock('../clientes/clientes.api', () => cli)
import LancamentosPage from './LancamentosPage'

const lanc = (o: any) => ({ id: 'l', tipo: 'despesa', descricao: 'x', valor: 10, vencimento: '2026-02-10', pago_em: null, ...o })

describe('LancamentosPage', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    cli.listarClientes.mockReset()
    cli.listarClientes.mockResolvedValue([])
    api.listarContas.mockResolvedValue([])
    api.listarLancamentos.mockResolvedValue([])
  })

  it('cria um lançamento de despesa', async () => {
    api.criarLancamento.mockResolvedValue({ id: 'l9' })
    render(<LancamentosPage />)
    await waitFor(() => expect(api.listarLancamentos).toHaveBeenCalled())
    fireEvent.change(screen.getByLabelText(/^tipo/i), { target: { value: 'despesa' } })
    fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: ' Conta de luz ' } })
    fireEvent.change(screen.getByLabelText(/valor/i), { target: { value: '200,00' } })
    fireEvent.change(screen.getByLabelText(/vencimento/i), { target: { value: '2026-02-10' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(api.criarLancamento).toHaveBeenCalledTimes(1))
    expect(api.criarLancamento).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'despesa', descricao: 'Conta de luz', valor: 200, vencimento: '2026-02-10' }),
    )
  })

  it('filtro "A pagar" mostra só despesas em aberto', async () => {
    api.listarLancamentos.mockResolvedValue([
      lanc({ id: 'l1', tipo: 'despesa', descricao: 'Luz', pago_em: null }),
      lanc({ id: 'l2', tipo: 'receita', descricao: 'Venda', pago_em: null }),
    ])
    render(<LancamentosPage />)
    await screen.findByText('Luz')
    fireEvent.click(screen.getByRole('button', { name: /a pagar/i }))
    expect(screen.getByText('Luz')).toBeInTheDocument()
    expect(screen.queryByText('Venda')).not.toBeInTheDocument()
  })
})
