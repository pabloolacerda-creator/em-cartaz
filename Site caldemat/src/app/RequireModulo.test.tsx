import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { Perfil } from '../types'

const m = vi.hoisted(() => ({ getPerfilAtual: vi.fn() }))
vi.mock('../lib/auth', () => ({ getPerfilAtual: m.getPerfilAtual, sair: vi.fn() }))

import RequireAuth from './RequireAuth'
import RequireModulo from './RequireModulo'

const base: Perfil = {
  id: '1', nome: 'Fulano', is_admin: false, pode_materia_prima: false,
  pode_estoque: false, pode_clientes: false, pode_pedidos: false, ativo: true,
}

function renderPedidos(perfil: Perfil) {
  m.getPerfilAtual.mockResolvedValue(perfil)
  return render(
    <MemoryRouter initialEntries={['/app/pedidos']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/app" element={<RequireAuth />}>
          <Route path="pedidos" element={<RequireModulo modulo="pedidos"><div>FORM PEDIDOS</div></RequireModulo>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => vi.resetAllMocks())

describe('RequireModulo', () => {
  it('sem pode_pedidos mostra Sem permissão e não a página', async () => {
    renderPedidos(base)
    expect(await screen.findByText(/sem permissão/i)).toBeInTheDocument()
    expect(screen.queryByText('FORM PEDIDOS')).toBeNull()
  })
  it('com pode_pedidos mostra a página', async () => {
    renderPedidos({ ...base, pode_pedidos: true })
    expect(await screen.findByText('FORM PEDIDOS')).toBeInTheDocument()
    expect(screen.queryByText(/sem permissão/i)).toBeNull()
  })
})
