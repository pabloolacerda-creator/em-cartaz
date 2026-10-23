export type TipoDesconto = 'valor' | 'percentual'

const cent = (n: number) => Math.round(n * 100) / 100

// Subtotal → desconto (R$ ou %) → total final (nunca negativo).
export function calcularTotais(
  subtotal: number,
  desconto: number | null | undefined,
  tipo: TipoDesconto | null | undefined,
): { subtotal: number; descontoValor: number; total: number } {
  const sub = cent(Number.isFinite(subtotal) ? subtotal : 0)
  const d = Number.isFinite(desconto as number) ? (desconto as number) : 0
  const bruto = tipo === 'percentual' ? (sub * d) / 100 : d
  const descontoValor = cent(Math.min(Math.max(bruto, 0), sub))
  return { subtotal: sub, descontoValor, total: cent(sub - descontoValor) }
}
