import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const api = vi.hoisted(() => ({ listarContas: vi.fn(), criarConta: vi.fn(), editarConta: vi.fn(), inativarConta: vi.fn() }))
vi.mock('./financeiro.api', () => api)
import ContasPage from './ContasPage'

const norm = (s: string | null) => (s ?? '').replace(/\s/g, ' ')

describe('ContasPage', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    api.listarContas.mockResolvedValue([])
  })

  it('lista contas com saldo em R$', async () => {
    api.listarContas.mockResolvedValue([{ id: 'c1', nome: 'Banco X', tipo: 'banco', saldo_inicial: 0, ativo: true, saldo: 1250.5 }])
    render(<ContasPage />)
    const row = (await screen.findByText('Banco X')).closest('tr')!
    expect(norm(row.textContent)).toContain('R$ 1.250,50')
  })

  it('cria conta com nome, tipo e saldo inicial numérico', async () => {
    api.criarConta.mockResolvedValue({ id: 'c9' })
    render(<ContasPage />)
    await waitFor(() => expect(api.listarContas).toHaveBeenCalled())
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: ' Caixa Loja ' } })
    fireEvent.change(screen.getByLabelText(/tipo/i), { target: { value: 'caixa' } })
    fireEvent.change(screen.getByLabelText(/saldo inicial/i), { target: { value: '500,00' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(api.criarConta).toHaveBeenCalledWith({ nome: 'Caixa Loja', tipo: 'caixa', saldo_inicial: 500 }))
  })
})
