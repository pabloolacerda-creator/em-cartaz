import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const api = vi.hoisted(() => ({ obterPedido: vi.fn(), editarPedido: vi.fn() }))
const cli = vi.hoisted(() => ({ listarClientes: vi.fn() }))
vi.mock('./pedidos.api', () => api)
vi.mock('../clientes/clientes.api', () => cli)

import PedidoEditar from './PedidoEditar'

const ana = { id: 'c1', nome: 'Ana', documento: '12.345', endereco: 'Rua X', telefone: '65 99', ativo: true }
const bia = { id: 'c2', nome: 'Bia', ativo: true }

function abrir() {
  return render(
    <MemoryRouter initialEntries={['/app/pedidos/p1/editar']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/app/pedidos/:id/editar" element={<PedidoEditar />} />
        <Route path="/app/pedidos/:id" element={<div>DETALHE</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PedidoEditar', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    cli.listarClientes.mockReset()
    cli.listarClientes.mockResolvedValue([ana, bia])
    api.obterPedido.mockResolvedValue({
      pedido: { id: 'p1', cliente_id: 'c1', data: '2026-03-05', obs: 'nota', usuario_id: null, status: 'emitido', prazo_entrega: '10 dias', forma_pagamento: 'Boleto' },
      itens: [{ id: 'i1', pedido_id: 'p1', descricao: 'Tanque', quantidade: 2, valor_unitario: 1500, obs: 'inox' }],
    })
    api.editarPedido.mockResolvedValue(undefined)
  })

  it('prefill com os dados do pedido e salva as alterações chamando editarPedido', async () => {
    abrir()
    // prefill: item e bloco 3
    const desc = (await screen.findAllByLabelText(/descrição/i))[0] as HTMLInputElement
    expect(desc.value).toBe('Tanque')
    expect((screen.getByLabelText(/prazo de entrega/i) as HTMLInputElement).value).toBe('10 dias')
    expect((screen.getByLabelText(/formas de pagamento/i) as HTMLInputElement).value).toBe('Boleto')

    // altera a descrição e salva
    fireEvent.change(desc, { target: { value: 'Tanque aéreo' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(api.editarPedido).toHaveBeenCalledTimes(1))
    expect(api.editarPedido).toHaveBeenCalledWith('p1', {
      cliente_id: 'c1',
      obs: 'nota',
      prazo_entrega: '10 dias',
      forma_pagamento: 'Boleto',
      itens: [{ descricao: 'Tanque aéreo', quantidade: 2, valor_unitario: 1500, obs: 'inox' }],
    })
    // volta para a tela de detalhe
    expect(await screen.findByText('DETALHE')).toBeInTheDocument()
  })
})
