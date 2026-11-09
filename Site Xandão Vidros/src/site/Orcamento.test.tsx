import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const api = vi.hoisted(() => ({ criarLead: vi.fn(), lerUtms: vi.fn(() => ({ utm_source: null, utm_medium: null, utm_campaign: null })) }))
vi.mock('../app/leads/leads.api', () => api)
const gads = vi.hoisted(() => ({ initGads: vi.fn(), dispararConversaoLead: vi.fn() }))
vi.mock('../lib/gads', () => gads)

import Orcamento from './Orcamento'

function preencherBasico() {
  fireEvent.change(screen.getByLabelText(/^nome/i), { target: { value: 'João' } })
  fireEvent.change(screen.getByLabelText(/whatsapp/i), { target: { value: '65999990000' } })
  fireEvent.change(screen.getByLabelText(/qual cidade/i), { target: { value: 'Sorriso-MT' } })
}

describe('Orcamento (LP)', () => {
  beforeEach(() => {
    api.criarLead.mockReset().mockResolvedValue(undefined)
    gads.dispararConversaoLead.mockReset()
  })

  it('envio válido grava o lead, dispara a conversão e mostra confirmação', async () => {
    render(<Orcamento />)
    preencherBasico()
    fireEvent.change(screen.getByLabelText(/capacidade/i), { target: { value: '5000' } })
    fireEvent.change(screen.getByLabelText(/bacia de contenção/i), { target: { value: 'true' } })
    fireEvent.click(screen.getByRole('button', { name: /quero meu orçamento/i }))

    await waitFor(() => expect(api.criarLead).toHaveBeenCalledTimes(1))
    expect(api.criarLead).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'João', whatsapp: '65999990000', cidade: 'Sorriso-MT', capacidade_litros: 5000, bacia_contencao: true }),
    )
    expect(gads.dispararConversaoLead).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/recebemos/i)).toBeInTheDocument()
  })

  it('honeypot preenchido descarta o envio (não grava), mas mostra confirmação', async () => {
    render(<Orcamento />)
    preencherBasico()
    fireEvent.change(screen.getByLabelText(/não preencha/i), { target: { value: 'bot' } })
    fireEvent.click(screen.getByRole('button', { name: /quero meu orçamento/i }))

    expect(await screen.findByText(/recebemos/i)).toBeInTheDocument()
    expect(api.criarLead).not.toHaveBeenCalled()
  })

  it('campos obrigatórios vazios bloqueiam o envio', async () => {
    render(<Orcamento />)
    // sem nome
    fireEvent.change(screen.getByLabelText(/whatsapp/i), { target: { value: '65999990000' } })
    fireEvent.change(screen.getByLabelText(/qual cidade/i), { target: { value: 'Sorriso-MT' } })
    fireEvent.click(screen.getByRole('button', { name: /quero meu orçamento/i }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(api.criarLead).not.toHaveBeenCalled()
  })

  it('capacidade com separador de milhar "5.000" vira 5000', async () => {
    render(<Orcamento />)
    preencherBasico()
    fireEvent.change(screen.getByLabelText(/capacidade/i), { target: { value: '5.000' } })
    fireEvent.click(screen.getByRole('button', { name: /quero meu orçamento/i }))

    await waitFor(() => expect(api.criarLead).toHaveBeenCalledTimes(1))
    expect(api.criarLead).toHaveBeenCalledWith(expect.objectContaining({ capacidade_litros: 5000 }))
  })

  it('capacidade não-numérica vira null (não quebra)', async () => {
    render(<Orcamento />)
    preencherBasico()
    fireEvent.change(screen.getByLabelText(/capacidade/i), { target: { value: 'abc' } })
    fireEvent.click(screen.getByRole('button', { name: /quero meu orçamento/i }))

    await waitFor(() => expect(api.criarLead).toHaveBeenCalledTimes(1))
    expect(api.criarLead).toHaveBeenCalledWith(expect.objectContaining({ capacidade_litros: null }))
  })
})
