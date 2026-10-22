import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'

const api = vi.hoisted(() => ({
  listarProdutos: vi.fn(),
  criarProduto: vi.fn(),
  editarProduto: vi.fn(),
  inativarProduto: vi.fn(),
}))
vi.mock('./produtos.api', () => api)

import ProdutosPage from './ProdutosPage'

const prod = (o: any = {}) => ({ id: 'p1', nome: 'Lona 440', unidade: 'm²', valor_venda: 120, ativo: true, ...o })
const norm = (s: string | null) => (s ?? '').replace(/\s/g, ' ')

describe('ProdutosPage', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    api.listarProdutos.mockResolvedValue([])
  })

  it('lista produtos com valor de venda em R$', async () => {
    api.listarProdutos.mockResolvedValue([prod()])
    render(<ProdutosPage />)
    const row = (await screen.findByText('Lona 440')).closest('tr')!
    expect(within(row).getByText('m²')).toBeInTheDocument()
    expect(norm(row.textContent)).toContain('R$ 120,00')
  })

  it('cadastra com nome, unidade, valor de venda numérico e descrição nula', async () => {
    api.criarProduto.mockResolvedValue(prod({ id: 'p9' }))
    render(<ProdutosPage />)
    await waitFor(() => expect(api.listarProdutos).toHaveBeenCalled())
    fireEvent.change(screen.getByLabelText(/nome do produto/i), { target: { value: ' Lona 440 ' } })
    fireEvent.change(screen.getByLabelText(/^unidade/i), { target: { value: 'm²' } })
    fireEvent.change(screen.getByLabelText(/valor de venda/i), { target: { value: '120,00' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(api.criarProduto).toHaveBeenCalledTimes(1))
    expect(api.criarProduto).toHaveBeenCalledWith({ nome: 'Lona 440', unidade: 'm²', valor_venda: 120, descricao: null })
  })

  it('exige nome e valor de venda válido', async () => {
    render(<ProdutosPage />)
    await waitFor(() => expect(api.listarProdutos).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/nome/i)
    fireEvent.change(screen.getByLabelText(/nome do produto/i), { target: { value: 'X' } })
    fireEvent.change(screen.getByLabelText(/valor de venda/i), { target: { value: 'abc' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/valor/i)
    expect(api.criarProduto).not.toHaveBeenCalled()
  })

  it('filtra a lista por nome', async () => {
    api.listarProdutos.mockResolvedValue([prod(), prod({ id: 'p2', nome: 'Chapa 3mm', unidade: 'Unidade(s)' })])
    render(<ProdutosPage />)
    await screen.findByText('Lona 440')
    fireEvent.change(screen.getByLabelText(/buscar/i), { target: { value: 'chapa' } })
    expect(screen.queryByText('Lona 440')).not.toBeInTheDocument()
    expect(screen.getByText('Chapa 3mm')).toBeInTheDocument()
  })
})
