import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { Perfil } from '../types'

const m = vi.hoisted(() => ({ getPerfilAtual: vi.fn(), sair: vi.fn() }))
vi.mock('../lib/auth', () => ({ getPerfilAtual: m.getPerfilAtual, sair: m.sair }))

import RequireAuth from './RequireAuth'
import Dashboard from './Dashboard'

const base: Perfil = {
  id: '1', nome: 'Fulano', is_admin: false, pode_materia_prima: false,
  pode_estoque: false, pode_clientes: false, pode_pedidos: false, pode_produtos: false, pode_financeiro: false, pode_leads: false, ativo: true,
}

function renderDash(perfil: Perfil) {
  m.getPerfilAtual.mockResolvedValue(perfil)
  return render(
    <MemoryRouter initialEntries={['/app']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/app" element={<RequireAuth><Dashboard /></RequireAuth>}>
          <Route index element={<div>HOME</div>} />
        </Route>
        <Route path="/app/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => vi.resetAllMocks())

describe('Dashboard nav por permissão', () => {
  it('perfil só-estoque vê apenas Estoque', async () => {
    renderDash({ ...base, pode_estoque: true })
    expect(await screen.findByRole('link', { name: 'Estoque' })).toHaveAttribute('href', '/app/estoque')
    for (const n of ['Pedidos', 'Clientes', 'Matéria-Prima', 'Funcionários']) {
      expect(screen.queryByRole('link', { name: n })).not.toBeInTheDocument()
    }
    expect(screen.getByText('HOME')).toBeInTheDocument()
  })

  it('admin vê Cadastro, Estoque e Pedidos (sem sublinks no menu)', async () => {
    renderDash({ ...base, is_admin: true })
    for (const n of ['Cadastro', 'Estoque', 'Pedidos']) {
      expect(await screen.findByRole('link', { name: n })).toBeInTheDocument()
    }
    // Os cadastros só aparecem na página Cadastro, não na barra.
    for (const n of ['Matéria-Prima', 'Clientes', 'Funcionários']) {
      expect(screen.queryByRole('link', { name: n })).not.toBeInTheDocument()
    }
  })

  it('mostra a logo da Xandão Vidros', async () => {
    renderDash({ ...base, pode_estoque: true })
    expect(await screen.findByAltText('Xandão Vidros')).toBeInTheDocument()
  })

  it('Sair chama sair()', async () => {
    m.sair.mockResolvedValue(undefined)
    renderDash({ ...base, pode_estoque: true })
    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }))
    expect(m.sair).toHaveBeenCalled()
    expect(await screen.findByText('LOGIN')).toBeInTheDocument()
  })
})
