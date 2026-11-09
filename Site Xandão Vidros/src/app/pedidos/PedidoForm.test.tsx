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

  it('"Calcular chapa" calcula pela tabela e salva como item com descrição e valor', async () => {
    const onSubmit = setup()
    fireEvent.change(screen.getByLabelText(/^cliente$/i), { target: { value: 'c1' } })
    fireEvent.change(screen.getByLabelText(/produto\/serviço/i), { target: { value: '__chapa__' } })
    fireEvent.change(screen.getByLabelText(/espessura/i), { target: { value: '1/2"' } })
    fireEvent.change(screen.getByLabelText(/largura/i), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText(/comprimento/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/valor do kg/i), { target: { value: '8,50' } })
    fireEvent.change(screen.getByLabelText(/quantidade/i), { target: { value: '2' } })
    expect(screen.getByTestId('area-item-0').textContent).toBe('2,00 m² × 2 = 4,00 m²')
    expect(screen.getByTestId('peso-item-0').textContent).toBe('196,00 kg/pç')
    expect(norm(screen.getByTestId('total-item-0').textContent)).toBe('R$ 3.332,00') // 2 × (2 m² × 98 × 8,50)
    fireEvent.click(screen.getByRole('button', { name: /salvar pedido/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const item = (onSubmit.mock.calls[0] as any)[0].itens[0]
    expect(item).toMatchObject({ quantidade: 2, valor_unitario: 1666, obs: null })
    expect(item.descricao).toMatch(/^Chapa 1\/2" \(12,50 mm\) 1,00 × 2,00 m — 196,00 kg\/pç$/)
    expect(item.produto_id).toBeUndefined()
  })

  it('produto m² mostra a área calculada antes do valor', () => {
    setup()
    fireEvent.change(screen.getByLabelText(/produto\/serviço/i), { target: { value: 'pr1' } })
    fireEvent.change(screen.getByLabelText(/largura/i), { target: { value: '1,5' } })
    fireEvent.change(screen.getByLabelText(/altura/i), { target: { value: '2' } })
    expect(screen.getByTestId('area-item-0').textContent).toBe('3,00 m²')
    fireEvent.change(screen.getByLabelText(/quantidade/i), { target: { value: '2' } })
    expect(screen.getByTestId('area-item-0').textContent).toBe('3,00 m² × 2 = 6,00 m²')
  })

  it('desconto em % e em R$ reduz o total', () => {
    setup()
    fireEvent.change(screen.getByLabelText(/produto\/serviço/i), { target: { value: 'pr2' } }) // 2,00 por unidade
    fireEvent.change(screen.getByLabelText(/quantidade/i), { target: { value: '50' } }) // subtotal 100
    expect(norm(screen.getByTestId('subtotal-pedido').textContent)).toBe('R$ 100,00')
    fireEvent.change(screen.getByLabelText(/^desconto$/i), { target: { value: '10' } })
    expect(norm(screen.getByTestId('total-pedido').textContent)).toBe('R$ 90,00') // R$ 10
    fireEvent.change(screen.getByLabelText(/tipo de desconto/i), { target: { value: 'percentual' } })
    fireEvent.change(screen.getByLabelText(/^desconto$/i), { target: { value: '25' } })
    expect(norm(screen.getByTestId('total-pedido').textContent)).toBe('R$ 75,00') // 25%
  })

  it('envia o desconto escolhido', async () => {
    const onSubmit = setup()
    fireEvent.change(screen.getByLabelText(/^cliente$/i), { target: { value: 'c1' } })
    fireEvent.change(screen.getByLabelText(/produto\/serviço/i), { target: { value: 'pr2' } })
    fireEvent.change(screen.getByLabelText(/tipo de desconto/i), { target: { value: 'percentual' } })
    fireEvent.change(screen.getByLabelText(/^desconto$/i), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar pedido/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ desconto: 10, desconto_tipo: 'percentual' })))
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
      desconto: 0,
      desconto_tipo: 'valor',
      itens: [
        { descricao: 'Lona 440', quantidade: 1, valor_unitario: 120, produto_id: 'pr1', largura: 1.5, altura: 2, descricao_adicional: 'reforçada', obs: null },
      ],
    })
  })
})
