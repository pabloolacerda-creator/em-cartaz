import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const api = vi.hoisted(() => ({ listarLancamentos: vi.fn(), listarContas: vi.fn() }))
vi.mock('./financeiro.api', () => api)
import FinanceiroPainel from './FinanceiroPainel'

const renderPainel = () => render(<MemoryRouter>{<FinanceiroPainel />}</MemoryRouter>)

const norm = () => (document.body.textContent ?? '').replace(/\s/g, ' ')

describe('FinanceiroPainel', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    api.listarContas.mockResolvedValue([])
    api.listarLancamentos.mockResolvedValue([])
  })

  it('mostra saldo, a pagar e a receber', async () => {
    api.listarContas.mockResolvedValue([{ id: 'c1', nome: 'B', tipo: 'banco', saldo_inicial: 0, ativo: true, saldo: 1000 }])
    api.listarLancamentos.mockResolvedValue([
      { id: 'l1', tipo: 'despesa', descricao: 'Luz', valor: 400, vencimento: '2026-12-10', pago_em: null },
      { id: 'l2', tipo: 'receita', descricao: 'Venda', valor: 700, vencimento: '2026-12-20', pago_em: null },
    ])
    renderPainel()
    await waitFor(() => expect(api.listarContas).toHaveBeenCalled())
    await screen.findByText(/saldo em bancos e caixas/i)
    expect(norm()).toContain('R$ 1.000,00')
    expect(norm()).toContain('R$ 400,00')
    expect(norm()).toContain('R$ 700,00')
  })

  it('exibe alerta de saldo negativo previsto', async () => {
    const venc = new Date().toISOString().slice(0, 10)
    api.listarContas.mockResolvedValue([{ id: 'c1', nome: 'B', tipo: 'banco', saldo_inicial: 0, ativo: true, saldo: 100 }])
    api.listarLancamentos.mockResolvedValue([
      { id: 'l1', tipo: 'despesa', descricao: 'Grande', valor: 5000, vencimento: venc, pago_em: null },
    ])
    renderPainel()
    expect(await screen.findByText(/saldo previsto negativo/i)).toBeInTheDocument()
  })
})
