import type { StatusPedido } from '../../types'

export const STATUS: Record<StatusPedido, { rotulo: string; cls: string }> = {
  emitido: { rotulo: 'Emitido', cls: 'bg-gray-200 text-gray-800' },
  aprovado: { rotulo: 'Aprovado', cls: 'bg-green-100 text-green-800' },
  reprovado: { rotulo: 'Reprovado', cls: 'bg-red-100 text-red-800' },
  faturado: { rotulo: 'Faturado', cls: 'bg-blue-100 text-blue-800' },
}

export const statusDe = (s?: string | null): StatusPedido =>
  s === 'aprovado' || s === 'reprovado' || s === 'faturado' ? s : 'emitido'
