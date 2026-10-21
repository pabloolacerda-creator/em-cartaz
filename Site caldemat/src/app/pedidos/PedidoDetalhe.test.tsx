import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const api = vi.hoisted(() => ({
  obterPedido: vi.fn(),
  aprovarPedido: vi.fn(),
  reprovarPedido: vi.fn(),
  faturarPedido: vi.fn(),
}))
vi.mock('./pedidos.api', () => api)

import PedidoDetalhe from './PedidoDetalhe'

const pedido = (status: string) => ({
  pedido: { id: 'p1', cliente_id: 'c1', data: '2026-10-18T10:20:00Z', obs: null, usuario_id: null, status, cliente_nome: 'Ana' },
  itens: [{ id: 'i1', pedido_id: 'p1', descricao: 'Tanque', quantidade: 1, valor_unitario: 12500 }],
})

function abrir() {
  return render(
    <MemoryRouter initialEntries={['/app/pedidos/p1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/app/pedidos/:id" element={<PedidoDetalhe />} />
        <Route path="/app/pedidos" element={<div>LISTA</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PedidoDetalhe', () => {
  beforeEach(() => Object.values(api).forEach((f) => f.mockReset()))

  it('emitido mostra Aprovar e Reprovar, não Faturar', async () => {
    api.obterPedido.mockResolvedValue(pedido('emitido'))
    abrir()
    expect(await screen.findByText('Emitido')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reprovar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Faturar' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Imprimir' })).toBeInTheDocument()
  })

  it('Aprovar chama a api e recarrega', async () => {
    api.obterPedido.mockResolvedValue(pedido('emitido'))
    api.aprovarPedido.mockResolvedValue(undefined)
    abrir()
    fireEvent.click(await screen.findByRole('button', { name: 'Aprovar' }))
    await waitFor(() => expect(api.aprovarPedido).toHaveBeenCalledWith('p1'))
    await waitFor(() => expect(api.obterPedido).toHaveBeenCalledTimes(2))
  })

  it('aprovado mostra Faturar e não Aprovar/Reprovar', async () => {
    api.obterPedido.mockResolvedValue(pedido('aprovado'))
    abrir()
    expect(await screen.findByText('Aprovado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Faturar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprovar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reprovar' })).toBeNull()
  })

  it('faturado não mostra ações de status (só Imprimir/Voltar)', async () => {
    api.obterPedido.mockResolvedValue(pedido('faturado'))
    abrir()
    expect(await screen.findByText('Faturado')).toBeInTheDocument()
    for (const n of ['Aprovar', 'Reprovar', 'Faturar']) {
      expect(screen.queryByRole('button', { name: n })).toBeNull()
    }
    expect(screen.getByRole('button', { name: 'Imprimir' })).toBeInTheDocument()
  })
})
