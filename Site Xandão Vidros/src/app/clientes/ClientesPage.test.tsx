import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const api = vi.hoisted(() => ({
  listarClientes: vi.fn(),
  criarCliente: vi.fn(),
  editarCliente: vi.fn(),
  inativarCliente: vi.fn(),
}))
vi.mock('./clientes.api', () => api)

import ClientesPage from './ClientesPage'

const ana = { id: '1', nome: 'Ana', documento: '123', telefone: '1199', email: null, endereco: null, obs: null, ativo: true }

describe('ClientesPage', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    vi.restoreAllMocks()
  })

  it('lista os clientes', async () => {
    api.listarClientes.mockResolvedValue([ana])
    render(<ClientesPage />)
    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
    expect(await screen.findByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('1199')).toBeInTheDocument()
  })

  it('cria cliente com payload aparado e atualiza a lista', async () => {
    const bia = { ...ana, id: '2', nome: 'Bia' }
    api.listarClientes.mockResolvedValueOnce([ana]).mockResolvedValueOnce([ana, bia])
    api.criarCliente.mockResolvedValue(bia)
    render(<ClientesPage />)
    await screen.findByText('Ana')
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: '  Bia  ' } })
    fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '11 9' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(api.criarCliente).toHaveBeenCalledTimes(1))
    expect(api.criarCliente).toHaveBeenCalledWith({
      nome: 'Bia', documento: null, telefone: '11 9', email: null, endereco: null, obs: null,
    })
    expect(await screen.findByText('Bia')).toBeInTheDocument()
  })

  it('rejeita nome só com espaços', async () => {
    api.listarClientes.mockResolvedValue([ana])
    render(<ClientesPage />)
    await screen.findByText('Ana')
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/nome/i)
    expect(api.criarCliente).not.toHaveBeenCalled()
  })

  it('não mostra mensagem de vazio quando há erro', async () => {
    api.listarClientes.mockRejectedValue(new Error('boom'))
    render(<ClientesPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/boom/)
    expect(screen.queryByText(/nenhum cliente/i)).not.toBeInTheDocument()
  })

  it('edita cliente com prefill', async () => {
    api.listarClientes.mockResolvedValue([ana])
    api.editarCliente.mockResolvedValue(ana)
    render(<ClientesPage />)
    await screen.findByText('Ana')
    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    const nome = screen.getByLabelText(/nome/i)
    expect(nome).toHaveValue('Ana')
    expect(screen.getByLabelText(/telefone/i)).toHaveValue('1199')
    fireEvent.change(nome, { target: { value: 'Ana 2' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() =>
      expect(api.editarCliente).toHaveBeenCalledWith('1', {
        nome: 'Ana 2', documento: '123', telefone: '1199', email: null, endereco: null, obs: null,
      }),
    )
  })

  it('inativa quando confirma', async () => {
    api.listarClientes.mockResolvedValue([ana])
    api.inativarCliente.mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<ClientesPage />)
    await screen.findByText('Ana')
    fireEvent.click(screen.getByRole('button', { name: /inativar/i }))
    await waitFor(() => expect(api.inativarCliente).toHaveBeenCalledWith('1'))
  })

  it('não inativa quando cancela a confirmação', async () => {
    api.listarClientes.mockResolvedValue([ana])
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<ClientesPage />)
    await screen.findByText('Ana')
    fireEvent.click(screen.getByRole('button', { name: /inativar/i }))
    expect(api.inativarCliente).not.toHaveBeenCalled()
  })
})
