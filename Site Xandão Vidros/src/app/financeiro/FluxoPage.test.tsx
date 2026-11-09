import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const api = vi.hoisted(() => ({ listarLancamentos: vi.fn() }))
vi.mock('./financeiro.api', () => api)
import FluxoPage from './FluxoPage'

const norm = (s: string | null) => (s ?? '').replace(/\s/g, ' ')

describe('FluxoPage', () => {
  beforeEach(() => {
    api.listarLancamentos.mockReset()
    api.listarLancamentos.mockResolvedValue([])
  })

  it('mostra as entradas/saídas realizadas por mês', async () => {
    const mes = new Date().toISOString().slice(0, 7)
    api.listarLancamentos.mockResolvedValue([
      { id: 'l1', tipo: 'receita', descricao: 'Venda', valor: 500, vencimento: `${mes}-05`, pago_em: `${mes}-06` },
      { id: 'l2', tipo: 'despesa', descricao: 'Luz', valor: 200, vencimento: `${mes}-05`, pago_em: `${mes}-07` },
    ])
    render(<FluxoPage />)
    await waitFor(() => expect(api.listarLancamentos).toHaveBeenCalled())
    await screen.findByText(/realizado/i)
    // os valores do mês corrente aparecem na tela
    expect(norm(document.body.textContent)).toContain('R$ 500,00')
    expect(norm(document.body.textContent)).toContain('R$ 200,00')
  })
})
