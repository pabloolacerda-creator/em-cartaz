import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const api = vi.hoisted(() => ({ listarLeads: vi.fn(), atualizarStatusLead: vi.fn() }))
vi.mock('./leads.api', () => api)

import LeadsPage, { linkWhatsappLead } from './LeadsPage'
import type { Lead } from '../../types'

const lead: Lead = {
  id: 'L1', criado_em: '2026-10-26T14:32:00Z', nome: 'João', whatsapp: '(65) 99999-0000',
  documento: '123', capacidade_litros: 5000, bacia_contencao: true, cidade: 'Sorriso-MT',
  status: 'novo', utm_source: null, utm_medium: null, utm_campaign: null, obs: null,
}

describe('LeadsPage', () => {
  beforeEach(() => {
    api.listarLeads.mockReset().mockResolvedValue([lead])
    api.atualizarStatusLead.mockReset().mockResolvedValue(undefined)
  })

  it('lista os leads carregados', async () => {
    render(<LeadsPage />)
    expect(await screen.findByText('João')).toBeInTheDocument()
    expect(screen.getByText('Sorriso-MT')).toBeInTheDocument()
  })

  it('trocar o status chama atualizarStatusLead', async () => {
    render(<LeadsPage />)
    await screen.findByText('João')
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'contatado' } })
    await waitFor(() => expect(api.atualizarStatusLead).toHaveBeenCalledWith('L1', 'contatado'))
  })

  it('linkWhatsappLead monta wa.me com número limpo e nome na mensagem', () => {
    const url = linkWhatsappLead(lead)
    expect(url.startsWith('https://wa.me/5565999990000?text=')).toBe(true)
    expect(url).toContain('Jo%C3%A3o')
  })
})
