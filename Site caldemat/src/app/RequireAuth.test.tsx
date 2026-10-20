import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { Perfil } from '../types'

const m = vi.hoisted(() => ({ getPerfilAtual: vi.fn() }))
vi.mock('../lib/auth', () => ({ getPerfilAtual: m.getPerfilAtual }))

import RequireAuth, { usePerfil } from './RequireAuth'

const perfil: Perfil = {
  id: '1', nome: 'Maria', is_admin: false, pode_materia_prima: false,
  pode_estoque: true, pode_clientes: false, pode_pedidos: false, ativo: true,
}

function Filho() {
  return <div>OLA {usePerfil().nome}</div>
}

function renderAuth() {
  return render(
    <MemoryRouter initialEntries={['/app']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/app" element={<RequireAuth><Filho /></RequireAuth>} />
        <Route path="/app/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => vi.resetAllMocks())

describe('RequireAuth', () => {
  it('sem sessão redireciona para /app/login', async () => {
    m.getPerfilAtual.mockResolvedValue(null)
    renderAuth()
    expect(await screen.findByText('LOGIN')).toBeInTheDocument()
  })

  it('autenticado renderiza filhos e usePerfil retorna o perfil', async () => {
    m.getPerfilAtual.mockResolvedValue(perfil)
    renderAuth()
    expect(await screen.findByText('OLA Maria')).toBeInTheDocument()
  })

  it('usePerfil fora do provider lança erro', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Filho />)).toThrow(/RequireAuth/)
    spy.mockRestore()
  })
})
