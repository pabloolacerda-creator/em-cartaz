import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import SitePublico from './SitePublico'

function setup() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SitePublico />
    </MemoryRouter>,
  )
}

describe('Site institucional', () => {
  it('renderiza as seções Empresa, Produtos, Serviços e Contato', () => {
    setup()
    expect(screen.getByRole('region', { name: 'Empresa' })).toBeInTheDocument()
    const produtos = screen.getByRole('region', { name: 'Produtos' })
    expect(within(produtos).getByText('Tanques aéreos')).toBeInTheDocument()
    expect(within(produtos).getByText('Tanques ovais agrícolas')).toBeInTheDocument()
    expect(within(produtos).getByText('Caixas d’água metálicas')).toBeInTheDocument()
    const servicos = screen.getByRole('region', { name: 'Serviços' })
    expect(within(servicos).getByText('Recuperação de caixa d’água')).toBeInTheDocument()
    expect(within(servicos).getByText('Conformação de metais')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Contato' })).toBeInTheDocument()
  })

  it('tem link Login para /app/login e âncoras de navegação', () => {
    setup()
    const login = screen.getByRole('link', { name: 'Login' })
    expect(login).toHaveAttribute('href', '/app/login')
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    for (const [nome, id] of [['Empresa', 'empresa'], ['Produtos', 'produtos'], ['Serviços', 'servicos'], ['Contato', 'contato']]) {
      expect(within(nav).getByRole('link', { name: nome })).toHaveAttribute('href', `#${id}`)
    }
  })

  it('rodapé mostra WhatsApp e Instagram', () => {
    setup()
    const rodape = screen.getByRole('contentinfo')
    expect(within(rodape).getByText('(65) 99359-7968')).toBeInTheDocument()
    expect(within(rodape).getByText('@caldemat.ind')).toBeInTheDocument()
  })

  it('cada card de produto mostra sua foto', () => {
    setup()
    const produtos = screen.getByRole('region', { name: 'Produtos' })
    const esperado: [string, string][] = [
      ['Tanques aéreos', 'tanque-aereo'],
      ['Tanques ovais agrícolas', 'tanque-oval'],
      ['Caixas d’água metálicas', 'caixas-dagua'],
    ]
    for (const [alt, arquivo] of esperado) {
      const img = within(produtos).getByRole('img', { name: alt })
      expect(img.getAttribute('src')).toContain(`/fotos/${arquivo}`)
    }
  })

  it('o topo usa o banner principal', () => {
    setup()
    const temBanner = screen.getAllByRole('img').some((i) => (i.getAttribute('src') ?? '').includes('banner-principal'))
    expect(temBanner).toBe(true)
  })
})
