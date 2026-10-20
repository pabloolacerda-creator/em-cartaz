import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const m = vi.hoisted(() => ({ entrar: vi.fn() }))
vi.mock('../lib/auth', () => ({ entrar: m.entrar }))

import Login from './Login'

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/app/login']}>
      <Routes>
        <Route path="/app/login" element={<Login />} />
        <Route path="/app" element={<div>PAINEL</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function preencher(u: string, s: string) {
  fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: u } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: s } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

beforeEach(() => vi.resetAllMocks())

describe('Login', () => {
  it('renderiza campos e botão', () => {
    renderLogin()
    expect(screen.getByLabelText('Usuário')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('envia valores digitados para entrar', async () => {
    m.entrar.mockResolvedValue({})
    renderLogin()
    preencher('joao', 'segredo')
    await waitFor(() => expect(m.entrar).toHaveBeenCalledWith('joao', 'segredo'))
  })

  it('erro mostra mensagem genérica, sem apontar o campo', async () => {
    m.entrar.mockResolvedValue({ erro: 'Usuário ou senha inválidos' })
    renderLogin()
    preencher('joao', 'errada')
    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Usuário ou senha inválidos')
    expect(screen.queryByText(/não existe|não encontrado|senha incorreta/i)).toBeNull()
    expect(screen.queryByText('PAINEL')).toBeNull()
  })

  it('sucesso navega para /app', async () => {
    m.entrar.mockResolvedValue({})
    renderLogin()
    preencher('joao', 'segredo')
    expect(await screen.findByText('PAINEL')).toBeInTheDocument()
  })
})
