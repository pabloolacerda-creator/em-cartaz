import { UNIDADES } from './unidades'

// Fator de cada unidade para a base da sua família (comprimento=m, peso=kg,
// contagem=unidade, volume=litro, área=m², tempo=hora). Conversão só vale
// DENTRO da mesma família.
const FATOR: Record<string, number> = {
  m: 1, 'm linear': 1, cm: 0.01, mm: 0.001,
  'Quilo(s)': 1, 'Grama(s)': 0.001,
  'Unidade(s)': 1, 'Dúzia(s)': 12, 'Cento(s)': 100, 'Milhar(es)': 1000,
  'Litro(s)': 1, 'm²': 1, 'Hora(s)': 1,
}

const FAMILIA: Record<string, string> = {
  m: 'comprimento', 'm linear': 'comprimento', cm: 'comprimento', mm: 'comprimento',
  'Quilo(s)': 'peso', 'Grama(s)': 'peso',
  'Unidade(s)': 'contagem', 'Dúzia(s)': 'contagem', 'Cento(s)': 'contagem', 'Milhar(es)': 'contagem',
  'Litro(s)': 'volume', 'm²': 'area', 'Hora(s)': 'tempo',
}

export function familia(unidade: string): string {
  return FAMILIA[unidade] ?? 'outro'
}

export function fatorUnidade(unidade: string): number {
  return FATOR[unidade] ?? 1
}

export function compativel(a: string, b: string): boolean {
  return familia(a) !== 'outro' && familia(a) === familia(b)
}

// Converte uma quantidade da unidade `de` para a unidade `para`.
// Retorna null quando as unidades são de famílias diferentes.
export function converter(qtd: number, de: string, para: string): number | null {
  if (!compativel(de, para)) return null
  const r = (qtd * fatorUnidade(de)) / fatorUnidade(para)
  return Math.round(r * 1e6) / 1e6
}

// Unidades que podem ser usadas para movimentar um material cadastrado em `unidade`.
export function unidadesCompativeis(unidade: string): string[] {
  if (familia(unidade) === 'outro') return unidade ? [unidade] : [...UNIDADES]
  return UNIDADES.filter((u) => familia(u) === familia(unidade))
}
