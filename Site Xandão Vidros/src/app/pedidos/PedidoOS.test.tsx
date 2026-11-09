import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const api = vi.hoisted(() => ({ obterPedido: vi.fn(), gerarOS: vi.fn(), salvarObsProducao: vi.fn() }))
vi.mock('./pedidos.api', () => api)

import PedidoOS from './PedidoOS'

const dados = {
  pedido: {
    id: 'p1', cliente_id: 'c1', data: '2026-10-20T10:00:00Z', obs: null, usuario_id: null, status: 'aprovado',
    numero: 12, cliente_nome: 'Ana', prazo_entrega: '15 dias', obs_producao: 'usar solda MIG', desconto: 0,
  },
  itens: [
    { id: 'i1', pedido_id: 'p1', descricao: 'Lona 440', quantidade: 2, valor_unitario: 120, unidade: 'm²', largura: 1.5, altura: 2, valor_total: 720, descricao_adicional: 'reforçada' },
  ],
}

function abrir() {
  return render(
    <MemoryRouter initialEntries={['/app/pedidos/p1/os']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/app/pedidos/:id/os" element={<PedidoOS />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PedidoOS', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    api.obterPedido.mockResolvedValue(dados)
    api.gerarOS.mockResolvedValue(3)
    api.salvarObsProducao.mockResolvedValue(undefined)
  })

  it('gera o número da OS e mostra os itens SEM valores', async () => {
    abrir()
    expect(await screen.findByRole('heading', { name: /ordem de serviço nº 000003/i })).toBeInTheDocument()
    expect(api.gerarOS).toHaveBeenCalledWith('p1')
    expect(screen.getByText('Lona 440')).toBeInTheDocument()
    expect(screen.getByText(/pedido nº 000012/i)).toBeInTheDocument()
    expect(screen.getByText('15 dias')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/R\$/) // nenhum valor na OS
  })

  it('obs de produção vem preenchida e é salva', async () => {
    abrir()
    const campo = (await screen.findByLabelText(/obs de produção/i)) as HTMLTextAreaElement
    expect(campo.value).toBe('usar solda MIG')
    fireEvent.change(campo, { target: { value: 'usar solda MIG; dobrar bordas' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar obs/i }))
    await waitFor(() => expect(api.salvarObsProducao).toHaveBeenCalledWith('p1', 'usar solda MIG; dobrar bordas'))
  })

  it('Imprimir OS salva a obs e chama a impressão', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    abrir()
    fireEvent.click(await screen.findByRole('button', { name: /imprimir os/i }))
    await waitFor(() => expect(api.salvarObsProducao).toHaveBeenCalled())
    await waitFor(() => expect(print).toHaveBeenCalled())
    print.mockRestore()
  })
})
