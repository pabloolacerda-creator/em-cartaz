import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CalculadoraPage from './CalculadoraPage'

const txt = () => (document.body.textContent ?? '').replace(/\s/g, ' ')

describe('CalculadoraPage', () => {
  it('calcula área, peso e custo pela espessura da tabela', () => {
    render(<CalculadoraPage />)
    fireEvent.change(screen.getByLabelText(/espessura/i), { target: { value: '1/2"' } })
    fireEvent.change(screen.getByLabelText(/largura/i), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText(/comprimento/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/quantidade/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/valor do kg/i), { target: { value: '8,50' } })
    expect(screen.getByTestId('area-total').textContent).toBe('4,00 m²')
    expect(screen.getByTestId('peso-total').textContent).toBe('392,00 kg')
    expect(txt()).toContain('R$ 3.332,00')
    expect(txt()).toContain('98,00 kg/m²') // peso da espessura escolhida
  })

  it('aceita medidas com vírgula', () => {
    render(<CalculadoraPage />)
    fireEvent.change(screen.getByLabelText(/espessura/i), { target: { value: '1/4"' } })
    fireEvent.change(screen.getByLabelText(/largura/i), { target: { value: '1,2' } })
    fireEvent.change(screen.getByLabelText(/comprimento/i), { target: { value: '0,75' } })
    expect(screen.getByTestId('area-total').textContent).toBe('0,90 m²')
  })
  it('também calcula chapas finas a quente (bitola MSG)', () => {
    render(<CalculadoraPage />)
    fireEvent.change(screen.getByLabelText(/espessura/i), { target: { value: 'MSG 14' } })
    fireEvent.change(screen.getByLabelText(/largura/i), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText(/comprimento/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/valor do kg/i), { target: { value: '10' } })
    expect(screen.getByTestId('peso-total').textContent).toBe('32,00 kg') // 2 m² × 16 kg/m²
    expect(txt()).toContain('R$ 320,00')
    expect(screen.getByRole('group', { name: /chapas finas a quente/i })).toBeInTheDocument()
  })
})
