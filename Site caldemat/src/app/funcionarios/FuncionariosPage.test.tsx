import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const api = vi.hoisted(() => ({
  listarFuncionarios: vi.fn(),
  criarFuncionario: vi.fn(),
  resetarSenha: vi.fn(),
  inativarFuncionario: vi.fn(),
  ativarFuncionario: vi.fn(),
}))
vi.mock('./funcionarios.api', () => api)
const perfilMock = vi.hoisted(() => ({ atual: { is_admin: true } as any }))
vi.mock('../RequireAuth', () => ({ usePerfil: () => perfilMock.atual }))

import FuncionariosPage from './FuncionariosPage'

const base = { pode_materia_prima: false, pode_estoque: false, pode_clientes: false, pode_pedidos: false, pode_produtos: false, ativo: true }
const admin = { ...base, id: 'a1', nome: 'Admin Unico', is_admin: true }
const joao = { ...base, id: 'j1', nome: 'Joao', is_admin: false }

describe('FuncionariosPage', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    perfilMock.atual = { is_admin: true }
    vi.restoreAllMocks()
  })

  it('não-admin não vê gestão e não carrega dados', () => {
    perfilMock.atual = { is_admin: false }
    render(<FuncionariosPage />)
    expect(screen.getByText(/sem permissão/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cadastrar/i })).toBeNull()
    expect(api.listarFuncionarios).not.toHaveBeenCalled()
  })

  it('admin vê formulário com um checkbox por módulo + administrador', async () => {
    api.listarFuncionarios.mockResolvedValue([admin, joao])
    render(<FuncionariosPage />)
    await screen.findByText('Joao')
    for (const n of [/matéria-prima/i, /estoque/i, /clientes/i, /pedidos/i, /produtos\/serviços/i, /administrador/i]) {
      expect(screen.getByRole('checkbox', { name: n })).toBeInTheDocument()
    }
  })

  it('cadastra com payload aparado e permissões', async () => {
    api.listarFuncionarios.mockResolvedValue([admin, joao])
    api.criarFuncionario.mockResolvedValue(undefined)
    render(<FuncionariosPage />)
    await screen.findByText('Joao')
    fireEvent.change(screen.getByLabelText(/usuário/i), { target: { value: ' Maria ' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'segredo1' } })
    fireEvent.change(screen.getByLabelText(/^nome/i), { target: { value: ' Maria S ' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /pedidos/i }))
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }))
    await waitFor(() => expect(api.criarFuncionario).toHaveBeenCalledTimes(1))
    expect(api.criarFuncionario).toHaveBeenCalledWith({
      usuario: 'Maria', senha: 'segredo1', nome: 'Maria S', is_admin: false,
      permissoes: { pode_materia_prima: false, pode_estoque: false, pode_clientes: false, pode_pedidos: true, pode_produtos: false },
    })
  })

  it('Inativar do último admin ativo fica bloqueado e mostra o aviso', async () => {
    api.listarFuncionarios.mockResolvedValue([admin, joao])
    render(<FuncionariosPage />)
    await screen.findByText('Joao')
    const botoes = screen.getAllByRole('button', { name: /inativar/i })
    expect(botoes[0]).toBeDisabled()
    expect(botoes[1]).not.toBeDisabled()
    expect(screen.getByText(/último administrador ativo/i)).toBeInTheDocument()
  })

  it('com 2 admins ativos, Inativar admin é permitido', async () => {
    api.listarFuncionarios.mockResolvedValue([admin, { ...admin, id: 'a2', nome: 'Outro' }])
    render(<FuncionariosPage />)
    await screen.findByText('Outro')
    screen.getAllByRole('button', { name: /inativar/i }).forEach((b) => expect(b).not.toBeDisabled())
  })

  it('funcionário inativo aparece marcado e Ativar chama a api e recarrega', async () => {
    const inativo = { ...joao, id: 'j2', nome: 'Zeca', ativo: false }
    api.listarFuncionarios.mockResolvedValue([admin, inativo])
    api.ativarFuncionario.mockResolvedValue(undefined)
    render(<FuncionariosPage />)
    await screen.findByText('Zeca')
    expect(screen.getByText('Inativo')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ativar' }))
    await waitFor(() => expect(api.ativarFuncionario).toHaveBeenCalledWith('j2'))
    await waitFor(() => expect(api.listarFuncionarios).toHaveBeenCalledTimes(2))
  })

  it('mostra erro e esconde "vazio" quando listar falha', async () => {
    api.listarFuncionarios.mockRejectedValue(new Error('boom'))
    render(<FuncionariosPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('boom')
    expect(screen.queryByText(/nenhum funcionário/i)).toBeNull()
  })
})
