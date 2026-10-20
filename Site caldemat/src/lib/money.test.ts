import { describe, it, expect } from 'vitest'
import { parseMoedaBR, formatMoedaBR } from './money'

describe('parseMoedaBR', () => {
  it('converte milhar e decimal pt-BR', () => expect(parseMoedaBR('1.234,56')).toBe(1234.56))
  it('inválido vira NaN', () => expect(Number.isNaN(parseMoedaBR('abc'))).toBe(true))
  it('vazio vira NaN', () => {
    expect(Number.isNaN(parseMoedaBR(''))).toBe(true)
    expect(Number.isNaN(parseMoedaBR('   '))).toBe(true)
  })
  it('aceita prefixo R$', () => expect(parseMoedaBR('R$ 10,00')).toBe(10))
  it('aceita espaços e inteiro', () => expect(parseMoedaBR('  1.000  ')).toBe(1000))
  it('aceita sem milhar', () => expect(parseMoedaBR('0,5')).toBe(0.5))
  it('rejeita formato misto inválido', () => expect(Number.isNaN(parseMoedaBR('1,2,3'))).toBe(true))
})

describe('formatMoedaBR', () => {
  it('formata com 2 casas', () => expect(formatMoedaBR(1234.5)).toBe('R$ 1.234,50'))
  it('formata 1234.56', () => expect(formatMoedaBR(1234.56)).toBe('R$ 1.234,56'))
  it('zero', () => expect(formatMoedaBR(0)).toBe('R$ 0,00'))
  it('milhões', () => expect(formatMoedaBR(1234567.891)).toBe('R$ 1.234.567,89'))
})
