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
const fin = vi.hoisted(() => ({ gerarContaReceber: vi.fn() }))
vi.mock('../financeiro/financeiro.api', () => fin)

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

  it('Gerar conta a receber chama a api com os dados do pedido', async () => {
    fin.gerarContaReceber.mockResolvedValue(undefined)
    api.obterPedido.mockResolvedValue({
      pedido: { id: 'p1', cliente_id: 'c1', data: '2026-10-18T10:20:00Z', obs: null, usuario_id: null, status: 'emitido', numero: 7, cliente_nome: 'Ana' },
      itens: [{ id: 'i1', pedido_id: 'p1', descricao: 'Tanque', quantidade: 1, valor_unitario: 100 }],
    })
    abrir()
    fireEvent.click(await screen.findByRole('button', { name: /gerar conta a receber/i }))
    await waitFor(() => expect(fin.gerarContaReceber).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1', cliente_id: 'c1', numero: 7, total: 100 })))
    expect(await screen.findByText(/conta a receber gerada/i)).toBeInTheDocument()
  })

  it('mostra número do pedido e da fatura e um item de produto com medidas', async () => {
    api.obterPedido.mockResolvedValue({
      pedido: {
        id: 'p1', cliente_id: 'c1', data: '2026-10-18T10:20:00Z', obs: null, usuario_id: null,
        status: 'faturado', numero: 123, fatura_numero: 45, cliente_nome: 'Ana', faturado_em: '2026-10-19T09:00:00Z',
      },
      itens: [{
        id: 'i1', pedido_id: 'p1', descricao: 'Lona 440', quantidade: 2, valor_unitario: 120,
        produto_id: 'pr1', unidade: 'm²', largura: 1.5, altura: 2, descricao_adicional: 'reforçada', valor_total: 720,
      }],
    })
    abrir()
    expect(await screen.findByText(/000123/)).toBeInTheDocument()
    expect(screen.getByText(/000045/)).toBeInTheDocument()
    expect(screen.getByText('reforçada')).toBeInTheDocument()
    // total do item usa valor_total (720), não quantidade × valor_unitário
    expect(screen.getAllByText(/720,00/).length).toBeGreaterThan(0)
  })

  it('mostra os 3 blocos, obs do item e o cabeçalho de impressão da empresa', async () => {
    api.obterPedido.mockResolvedValue({
      pedido: {
        id: 'p1', cliente_id: 'c1', data: '2026-10-18T10:20:00Z', obs: 'Entregar na obra', usuario_id: null,
        status: 'emitido', cliente_nome: 'Ana', cliente_documento: '12.345.678/0001-90',
        cliente_endereco: 'Rua X, 10', cliente_telefone: '(65) 99999-0000', cliente_email: 'ana@ex.com',
        prazo_entrega: '30 dias', forma_pagamento: 'Pix à vista',
      },
      itens: [{ id: 'i1', pedido_id: 'p1', descricao: 'Tanque', quantidade: 1, valor_unitario: 12500, obs: 'Inox 304' }],
    })
    abrir()
    // Bloco 3
    expect(await screen.findByText('30 dias')).toBeInTheDocument()
    expect(screen.getByText('Pix à vista')).toBeInTheDocument()
    // Bloco 1 (dados do cliente)
    expect(screen.getByText('12.345.678/0001-90')).toBeInTheDocument()
    // Bloco 2 (obs por item)
    expect(screen.getByText('Inox 304')).toBeInTheDocument()
    // Cabeçalho de impressão: papel timbrado (imagem)
    expect(screen.getAllByRole('img').some((i) => (i.getAttribute('src') ?? '').includes('timbrado'))).toBe(true)
  })
})
