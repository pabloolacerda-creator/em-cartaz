import { describe, it, expect } from 'vitest'
import { CHAPAS, calcularChapa } from './chapa'

describe('tabelas de chapas', () => {
  it('tem as 13 finas a quente + 16 grossas, da mais fina para a mais grossa', () => {
    expect(CHAPAS).toHaveLength(29)
    expect(CHAPAS[0]).toEqual({ grupo: 'finas', pol: 'MSG 18', mm: 1.2, kgm2: 9.6 })
    expect(CHAPAS.find((c) => c.pol === 'MSG 10')).toMatchObject({ mm: 3.35, kgm2: 26.8 })
    expect(CHAPAS.find((c) => c.pol === '1/2"')).toEqual({ grupo: 'grossas', pol: '1/2"', mm: 12.5, kgm2: 98 })
    expect(CHAPAS[28]).toEqual({ grupo: 'grossas', pol: '4"', mm: 100, kgm2: 784 })
    for (let k = 1; k < CHAPAS.length; k++) expect(CHAPAS[k].mm).toBeGreaterThan(CHAPAS[k - 1].mm)
  })
  it('identificadores únicos (usados no seletor)', () => {
    expect(new Set(CHAPAS.map((c) => c.pol)).size).toBe(CHAPAS.length)
  })
  it('chapas finas seguem 8 kg/m² por mm', () => {
    for (const c of CHAPAS.filter((x) => x.grupo === 'finas')) expect(c.kgm2).toBeCloseTo(c.mm * 8, 2)
  })
})

describe('calcularChapa', () => {
  it('área, peso e custo de uma chapa 1/2" 1,0 × 2,0 m, 2 peças, R$ 8,50/kg', () => {
    expect(calcularChapa({ kgm2: 98, largura: 1, comprimento: 2, quantidade: 2, precoKg: 8.5 })).toEqual({
      areaUnit: 2,
      areaTotal: 4,
      pesoUnit: 196,
      pesoTotal: 392,
      custoTotal: 3332,
    })
  })
  it('arredonda peso (2 casas) e custo (centavos)', () => {
    const r = calcularChapa({ kgm2: 49.39, largura: 1.2, comprimento: 0.75, quantidade: 3, precoKg: 7.9 })
    expect(r.areaUnit).toBe(0.9)
    expect(r.pesoUnit).toBe(44.45) // 0,9 × 49,39 = 44,451
    expect(r.pesoTotal).toBe(133.35)
    expect(r.custoTotal).toBe(1053.49) // 133,353 kg (sem arredondar) × 7,9
  })
  it('entradas vazias/inválidas viram zero, sem NaN', () => {
    const r = calcularChapa({ kgm2: 98, largura: NaN, comprimento: 2, quantidade: 1, precoKg: NaN })
    expect(r).toEqual({ areaUnit: 0, areaTotal: 0, pesoUnit: 0, pesoTotal: 0, custoTotal: 0 })
  })
})
