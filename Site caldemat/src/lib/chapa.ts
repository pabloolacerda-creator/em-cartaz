// Tabela de chapas grossas (espessura → peso aproximado em kg/m²), fornecida pela Caldemat.
export type Chapa = { pol: string; mm: number; kgm2: number }

export const CHAPAS: Chapa[] = [
  { pol: '1/4"', mm: 6.3, kgm2: 49.39 },
  { pol: '5/16"', mm: 8, kgm2: 62.72 },
  { pol: '3/8"', mm: 9.5, kgm2: 74.48 },
  { pol: '1/2"', mm: 12.5, kgm2: 98 },
  { pol: '5/8"', mm: 16, kgm2: 125.44 },
  { pol: '3/4"', mm: 19, kgm2: 149 },
  { pol: '7/8"', mm: 22.4, kgm2: 175.84 },
  { pol: '1"', mm: 25, kgm2: 196 },
  { pol: '1.1/4"', mm: 31.5, kgm2: 247.27 },
  { pol: '1.1/2"', mm: 37.5, kgm2: 294.37 },
  { pol: '1.3/4"', mm: 44.45, kgm2: 348.5 },
  { pol: '2"', mm: 50, kgm2: 392 },
  { pol: '2.1/2"', mm: 63, kgm2: 494.55 },
  { pol: '3"', mm: 75, kgm2: 588.1 },
  { pol: '3.1/2"', mm: 88.9, kgm2: 697.8 },
  { pol: '4"', mm: 100, kgm2: 784 },
]

export type EntradaChapa = { kgm2: number; largura: number; comprimento: number; quantidade: number; precoKg: number }
export type ResultadoChapa = { areaUnit: number; areaTotal: number; pesoUnit: number; pesoTotal: number; custoTotal: number }

const ok = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0)
const r = (n: number, casas: number) => Math.round(n * 10 ** casas) / 10 ** casas

// Medidas em metros. Peso = área × kg/m². Custo = peso total × R$/kg (calculado sem arredondar o peso).
export function calcularChapa(e: EntradaChapa): ResultadoChapa {
  const area = ok(e.largura) * ok(e.comprimento)
  const qtd = ok(e.quantidade)
  const peso = area * ok(e.kgm2)
  return {
    areaUnit: r(area, 4),
    areaTotal: r(area * qtd, 4),
    pesoUnit: r(peso, 2),
    pesoTotal: r(peso * qtd, 2),
    custoTotal: r(peso * qtd * ok(e.precoKg), 2),
  }
}
