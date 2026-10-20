import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'

const api = vi.hoisted(() => ({
  listarSaldos: vi.fn(),
  registrarMovimentacao: vi.fn(),
  historicoPorMaterial: vi.fn(),
}))
const mat = vi.hoisted(() => ({ listarMateriais: vi.fn() }))
vi.mock('./estoque.api', () => api)
vi.mock('../materiais/materiais.api', () => mat)

import EstoquePage from './EstoquePage'

const aco = { id: '1', nome: 'Aço', unidade: 'kg', estoque_minimo: null, ativo: true }
const cobre = { id: '2', nome: 'Cobre', unidade: 'kg', estoque_minimo: null, ativo: true }
const saldos = [
  { material_id: '1', nome: 'Aço', unidade: 'kg', saldo: 10 },
  { material_id: '2', nome: 'Cobre', unidade: 'kg', saldo: -3 },
]

function preencher(material: string, tipo: string, qtd: string) {
  fireEvent.change(screen.getByLabelText('Material'), { target: { value: material } })
  fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: tipo } })
  fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: qtd } })
}

describe('EstoquePage', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    mat.listarMateriais.mockReset()
    mat.listarMateriais.mockResolvedValue([aco, cobre])
    api.listarSaldos.mockResolvedValue(saldos)
    api.historicoPorMaterial.mockResolvedValue([])
  })
  afterEach(() => vi.restoreAllMocks())

  it('renderiza saldos e destaca saldo negativo', async () => {
    render(<EstoquePage />)
    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
    const linhaAco = (await screen.findByRole('cell', { name: 'Aço' })).closest('tr')!
    const linhaCobre = screen.getByRole('cell', { name: 'Cobre' }).closest('tr')!
    expect(linhaCobre.className).toMatch(/red/)
    expect(linhaAco.className).not.toMatch(/red/)
  })

  it('mostra erro e esconde mensagem de vazio', async () => {
    api.listarSaldos.mockRejectedValue(new Error('boom'))
    render(<EstoquePage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/boom/)
    expect(screen.queryByText(/nenhum/i)).not.toBeInTheDocument()
  })

  it('registra entrada e atualiza a lista', async () => {
    api.listarSaldos.mockReset()
    api.listarSaldos.mockResolvedValueOnce(saldos).mockResolvedValueOnce([{ ...saldos[0], saldo: 15 }, saldos[1]])
    api.registrarMovimentacao.mockResolvedValue({})
    render(<EstoquePage />)
    await screen.findByRole('cell', { name: 'Aço' })
    preencher('1', 'entrada', '5')
    fireEvent.change(screen.getByLabelText(/obs/i), { target: { value: '  nota  ' } })
    fireEvent.click(screen.getByRole('button', { name: /registrar/i }))
    await waitFor(() =>
      expect(api.registrarMovimentacao).toHaveBeenCalledWith({ material_id: '1', tipo: 'entrada', quantidade: 5, obs: 'nota' }),
    )
    expect(await screen.findByRole('cell', { name: '15' })).toBeInTheDocument()
  })

  it('exige material e quantidade > 0', async () => {
    render(<EstoquePage />)
    await screen.findByRole('cell', { name: 'Aço' })
    fireEvent.click(screen.getByRole('button', { name: /registrar/i }))
    preencher('1', 'entrada', '0')
    fireEvent.click(screen.getByRole('button', { name: /registrar/i }))
    expect(api.registrarMovimentacao).not.toHaveBeenCalled()
  })

  it('saída maior que o saldo mostra aviso NÃO bloqueante e registra ao confirmar', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    api.registrarMovimentacao.mockResolvedValue({})
    render(<EstoquePage />)
    await screen.findByRole('cell', { name: 'Aço' })
    preencher('1', 'saida', '50') // saldo 10
    expect(screen.getByText(/atenção: o saldo ficará negativo/i)).toBeInTheDocument()
    const botao = screen.getByRole('button', { name: /registrar/i })
    expect(botao).toBeEnabled()
    fireEvent.click(botao)
    expect(confirm).toHaveBeenCalled()
    await waitFor(() =>
      expect(api.registrarMovimentacao).toHaveBeenCalledWith({ material_id: '1', tipo: 'saida', quantidade: 50, obs: null }),
    )
  })

  it('saída dentro do saldo não mostra aviso nem pede confirmação', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    api.registrarMovimentacao.mockResolvedValue({})
    render(<EstoquePage />)
    await screen.findByRole('cell', { name: 'Aço' })
    preencher('1', 'saida', '4')
    expect(screen.queryByText(/saldo ficará negativo/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /registrar/i }))
    await waitFor(() => expect(api.registrarMovimentacao).toHaveBeenCalled())
    expect(confirm).not.toHaveBeenCalled()
  })

  it('cancelar a confirmação NÃO registra a saída', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<EstoquePage />)
    await screen.findByRole('cell', { name: 'Aço' })
    preencher('1', 'saida', '50')
    fireEvent.click(screen.getByRole('button', { name: /registrar/i }))
    expect(api.registrarMovimentacao).not.toHaveBeenCalled()
  })

  it('desabilita o botão enquanto salva (sem duplo envio)', async () => {
    let fim: (v: unknown) => void = () => {}
    api.registrarMovimentacao.mockReturnValue(new Promise((r) => (fim = r)))
    render(<EstoquePage />)
    await screen.findByRole('cell', { name: 'Aço' })
    preencher('1', 'entrada', '1')
    const botao = screen.getByRole('button', { name: /registrar/i })
    fireEvent.click(botao)
    await waitFor(() => expect(botao).toBeDisabled())
    fireEvent.click(botao)
    expect(api.registrarMovimentacao).toHaveBeenCalledTimes(1)
    fim({})
    await waitFor(() => expect(botao).toBeEnabled())
  })

  it('mostra histórico do material selecionado', async () => {
    api.historicoPorMaterial.mockResolvedValue([
      { id: 'h1', material_id: '1', tipo: 'entrada', quantidade: 7, data: '2026-10-01T10:00:00Z', obs: 'compra', usuario_id: null },
    ])
    render(<EstoquePage />)
    const linha = (await screen.findByRole('cell', { name: 'Aço' })).closest('tr')!
    fireEvent.click(within(linha).getByRole('button', { name: /histórico/i }))
    await waitFor(() => expect(api.historicoPorMaterial).toHaveBeenCalledWith('1'))
    expect(await screen.findByText('compra')).toBeInTheDocument()
  })
})
