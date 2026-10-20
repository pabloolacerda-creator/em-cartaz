import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const api = vi.hoisted(() => ({
  listarMateriais: vi.fn(),
  criarMaterial: vi.fn(),
  editarMaterial: vi.fn(),
  inativarMaterial: vi.fn(),
}))
vi.mock('./materiais.api', () => api)

import MateriaisPage from './MateriaisPage'

const aco = { id: '1', nome: 'Aço', unidade: 'kg', estoque_minimo: 10, ativo: true }

describe('MateriaisPage', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
  })

  it('lista os materiais', async () => {
    api.listarMateriais.mockResolvedValue([aco])
    render(<MateriaisPage />)
    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
    expect(await screen.findByText('Aço')).toBeInTheDocument()
  })

  it('cria material e atualiza a lista', async () => {
    const cobre = { id: '2', nome: 'Cobre', unidade: 'kg', estoque_minimo: 3, ativo: true }
    api.listarMateriais.mockResolvedValueOnce([aco]).mockResolvedValueOnce([aco, cobre])
    api.criarMaterial.mockResolvedValue(cobre)
    render(<MateriaisPage />)
    await screen.findByText('Aço')
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Cobre' } })
    fireEvent.change(screen.getByLabelText(/unidade/i), { target: { value: 'kg' } })
    fireEvent.change(screen.getByLabelText(/estoque mínimo/i), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() =>
      expect(api.criarMaterial).toHaveBeenCalledWith({ nome: 'Cobre', unidade: 'kg', estoque_minimo: 3 }),
    )
    expect(await screen.findByText('Cobre')).toBeInTheDocument()
  })

  it('mostra erro quando a api falha', async () => {
    api.listarMateriais.mockRejectedValue(new Error('boom'))
    render(<MateriaisPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/boom/)
  })

  it('edita material ao clicar em Editar', async () => {
    api.listarMateriais.mockResolvedValue([aco])
    api.editarMaterial.mockResolvedValue({ ...aco, nome: 'Aço 2' })
    render(<MateriaisPage />)
    await screen.findByText('Aço')
    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    const nome = screen.getByLabelText(/nome/i)
    expect(nome).toHaveValue('Aço')
    fireEvent.change(nome, { target: { value: 'Aço 2' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() =>
      expect(api.editarMaterial).toHaveBeenCalledWith('1', { nome: 'Aço 2', unidade: 'kg', estoque_minimo: 10 }),
    )
  })

  it('inativa com confirmação', async () => {
    api.listarMateriais.mockResolvedValue([aco])
    api.inativarMaterial.mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<MateriaisPage />)
    await screen.findByText('Aço')
    fireEvent.click(screen.getByRole('button', { name: /inativar/i }))
    await waitFor(() => expect(api.inativarMaterial).toHaveBeenCalledWith('1'))
  })
})
