export function parseMoedaBR(texto: string): number {
  const t = texto.replace(/R\$/g, '').replace(/\s/g, '')
  if (!/^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+(,\d+)?$/.test(t)) return NaN
  return Number(t.replace(/\./g, '').replace(',', '.'))
}

export function formatMoedaBR(n: number): string {
  const num = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
  return `R$ ${num}`.replace(/ /g, ' ')
}
