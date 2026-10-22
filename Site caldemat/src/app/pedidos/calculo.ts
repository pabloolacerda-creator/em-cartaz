// Como o item do pedido é medido, conforme a unidade do produto:
// - 'area'       -> precisa de largura × altura (m²)
// - 'linear'     -> precisa de comprimento (m, m linear, cm, mm) — guardado em `largura`
// - 'quantidade' -> só a quantidade (Unidade(s), Dúzia(s), Quilo(s), ...)
export type ModoMedida = 'area' | 'linear' | 'quantidade'

export function modoMedida(unidade: string): ModoMedida {
  if (unidade === 'm²') return 'area'
  if (unidade === 'm' || unidade === 'm linear' || unidade === 'cm' || unidade === 'mm') return 'linear'
  return 'quantidade'
}

// Valor total do item (arredondado a centavos). Medidas/valores inválidos contam como 0.
export function calcularValorItem(
  unidade: string,
  quantidade: number,
  largura: number,
  altura: number,
  valorUnitario: number,
): number {
  const q = Number.isNaN(quantidade) ? 0 : quantidade
  const v = Number.isNaN(valorUnitario) ? 0 : valorUnitario
  const l = Number.isNaN(largura) ? 0 : largura
  const a = Number.isNaN(altura) ? 0 : altura
  const fator = modoMedida(unidade) === 'area' ? l * a : modoMedida(unidade) === 'linear' ? l : 1
  return Math.round(q * fator * v * 100) / 100
}
