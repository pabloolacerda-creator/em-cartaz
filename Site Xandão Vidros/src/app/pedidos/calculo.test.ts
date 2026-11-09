import { describe, it, expect } from 'vitest'
import { modoMedida, calcularValorItem } from './calculo'

describe('modoMedida', () => {
  it('m² é área', () => expect(modoMedida('m²')).toBe('area'))
  it('m / m linear / cm / mm são lineares', () => {
    for (const u of ['m', 'm linear', 'cm', 'mm']) expect(modoMedida(u)).toBe('linear')
  })
  it('demais unidades são por quantidade', () => {
    for (const u of ['Unidade(s)', 'Dúzia(s)', 'Quilo(s)', '']) expect(modoMedida(u)).toBe('quantidade')
  })
})

describe('calcularValorItem', () => {
  it('m²: quantidade × largura × altura × valor', () => {
    expect(calcularValorItem('m²', 2, 1.5, 2, 120)).toBe(720)
  })
  it('vidro por m²: 0,80 × 1,90 m × 2 un a R$ 120/m² = R$ 364,80', () => {
    expect(calcularValorItem('m²', 2, 0.8, 1.9, 120)).toBe(364.8)
  })
  it('linear: quantidade × comprimento (largura) × valor', () => {
    expect(calcularValorItem('m linear', 3, 4, 0, 10)).toBe(120)
  })
  it('quantidade: quantidade × valor', () => {
    expect(calcularValorItem('Unidade(s)', 5, 0, 0, 10)).toBe(50)
  })
  it('medida/valor em branco não vira NaN', () => {
    expect(calcularValorItem('m²', 1, NaN, 2, 120)).toBe(0)
    expect(calcularValorItem('Unidade(s)', NaN, 0, 0, 10)).toBe(0)
  })
  it('item sem preço (catálogo sem valor): total = 0, não quebra', () => {
    expect(calcularValorItem('m²', 2, 0.8, 1.9, NaN)).toBe(0)
  })
  it('arredonda a centavos sem erro de ponto flutuante', () => {
    expect(calcularValorItem('Unidade(s)', 3, 0, 0, 0.1)).toBe(0.3)
  })
})
