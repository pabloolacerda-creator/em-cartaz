import { describe, it, expect } from 'vitest'
import { formatNumero } from './numero'

describe('formatNumero', () => {
  it('preenche com zeros à esquerda (6 dígitos por padrão)', () => {
    expect(formatNumero(123)).toBe('000123')
    expect(formatNumero(1)).toBe('000001')
  })
  it('não corta números maiores que a largura', () => {
    expect(formatNumero(1234567)).toBe('1234567')
  })
  it('retorna vazio para null/undefined', () => {
    expect(formatNumero(null)).toBe('')
    expect(formatNumero(undefined)).toBe('')
  })
  it('aceita largura customizada', () => {
    expect(formatNumero(7, 3)).toBe('007')
  })
})
