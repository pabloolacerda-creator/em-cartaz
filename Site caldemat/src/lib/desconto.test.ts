import { describe, it, expect } from 'vitest'
import { calcularTotais } from './desconto'

describe('calcularTotais', () => {
  it('sem desconto: total = subtotal', () => {
    expect(calcularTotais(1000, 0, 'valor')).toEqual({ subtotal: 1000, descontoValor: 0, total: 1000 })
  })
  it('desconto em R$', () => {
    expect(calcularTotais(1000, 150, 'valor')).toEqual({ subtotal: 1000, descontoValor: 150, total: 850 })
  })
  it('desconto em %', () => {
    expect(calcularTotais(1000, 10, 'percentual')).toEqual({ subtotal: 1000, descontoValor: 100, total: 900 })
  })
  it('arredonda a centavos', () => {
    expect(calcularTotais(333.33, 10, 'percentual')).toEqual({ subtotal: 333.33, descontoValor: 33.33, total: 300 })
  })
  it('desconto nunca deixa o total negativo', () => {
    expect(calcularTotais(100, 500, 'valor').total).toBe(0)
    expect(calcularTotais(100, 150, 'percentual').total).toBe(0)
  })
  it('valores ausentes/NaN contam como zero', () => {
    expect(calcularTotais(100, NaN, 'valor').total).toBe(100)
    expect(calcularTotais(100, null, null).total).toBe(100)
  })
})
