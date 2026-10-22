// Formata um número nativo do sistema com zeros à esquerda (ex.: 123 -> "000123").
// Número maior que a largura não é cortado. null/undefined -> "".
export function formatNumero(n: number | null | undefined, largura = 6): string {
  if (n === null || n === undefined) return ''
  return String(n).padStart(largura, '0')
}
