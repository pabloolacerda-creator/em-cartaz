import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import PedidoForm from './PedidoForm'

const clientes = [{ id: 'c1', nome: 'Ana', ativo: true } as any]
const produtos = [
  { id: 'pr1', nome: 'Lona 440', unidade: 'm²', valor_venda: 120, ativo: true },
  { id: 'pr2', nome: 'Parafuso', unidade: 'Unidade(s)', valor_venda: 2, ativo: true },
] as any
const norm = (s: string | null) => (s ?? '').replace(/\s/g, ' ')

function setup(onSubmit = vi.fn(async () => {})) {
  render(<PedidoForm clientes={clientes} produtos={produtos} dataTexto="22/10/2026" textoBotao="Salvar pedido" onSubmit={onSubmit} />)
  return onSubmit
}

describe('PedidoForm — item de produto', () => {
  beforeEach(() => vi.clearAllMocks())

  it('produto m² mostra largura/altura e calcula o total ao vivo', () => {
    setup()
    fireEvent.change(screen.getByLabelText(/produto\/serviço/i), { target: { value: 'pr1' } })
    fireEvent.change(screen.getByLabelText(/largura/i), { target: { value: '1,5' } })
    fireEvent.change(screen.getByLabelText(/altura/i), { target: { value: '2' } })
    // 1 (qtd padrão) × 1,5 × 2 × 120 = 360
    expect(norm(screen.getByTestId('total-item-0').textContent)).toBe('R$ 360,00')
  })

  it('produto por unidade esconde medidas e calcula qtd × valor', () => {
    setup()
    fireEvent.change(screen.getByLabelText(/produto\/serviço/i), { target: { value: 'pr2' } })
    expect(screen.queryByLabelText(/largura/i)).toBeNull()
    fireEvent.change(screen.getByLabelText(/quantidade/i), { target: { value: '5' } })
    expect(norm(screen.getByTestId('total-item-0').textContent)).toBe('R$ 10,00')
  })

  it('envia o item de produto com produto_id, medidas e descrição adicional', async () => {
    const onSubmit = setup()
    fireEvent.change(screen.getByLabelText(/^cliente$/i), { target: { value: 'c1' } })
    fireEvent.change(screen.getByLabelText(/produto\/serviço/i), { target: { value: 'pr1' } })
    fireEvent.change(screen.getByLabelText(/largura/i), { target: { value: '1,5' } })
    fireEvent.change(screen.getByLabelText(/altura/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/descrição adicional/i), { target: { value: 'reforçada' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar pedido/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      cliente_id: 'c1',
      obs: null,
      prazo_entrega: null,
      forma_pagamento: null,
      itens: [
        { descricao: 'Lona 440', quantidade: 1, valor_unitario: 120, produto_id: 'pr1', largura: 1.5, altura: 2, descricao_adicional: 'reforçada', obs: null },
      ],
    })
  })
})
