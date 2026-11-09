import type { Lancamento, Cliente, Pedido } from '../../types'
import { dentroDoPeriodo, type Periodo } from '../../lib/periodo'

// Soma em centavos para evitar erro de ponto flutuante.
const soma = (vals: number[]) => vals.reduce((s, v) => s + Math.round(v * 100), 0) / 100

// "Realizado no período" = tem pago_em e ele cai dentro do período.
const realizado = (l: Lancamento, p: Periodo) => !!l.pago_em && dentroDoPeriodo(l.pago_em, p)

export type ResumoPeriodo = { receitas: number; despesas: number; saldo: number }

export function resumoPeriodo(lancs: Lancamento[], periodo: Periodo): ResumoPeriodo {
  const feitos = lancs.filter((l) => realizado(l, periodo))
  const receitas = soma(feitos.filter((l) => l.tipo === 'receita').map((l) => l.valor))
  const despesas = soma(feitos.filter((l) => l.tipo === 'despesa').map((l) => l.valor))
  return { receitas, despesas, saldo: Math.round((receitas - despesas) * 100) / 100 }
}

export type LinhaCategoria = { categoria: string; total: number }

export function despesasPorCategoria(lancs: Lancamento[], periodo: Periodo): LinhaCategoria[] {
  const mapa = new Map<string, number>()
  for (const l of lancs) {
    if (l.tipo !== 'despesa' || !realizado(l, periodo)) continue
    const cat = l.categoria?.trim() || 'Sem categoria'
    mapa.set(cat, Math.round(((mapa.get(cat) ?? 0) + l.valor) * 100) / 100)
  }
  return [...mapa.entries()].map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total)
}

export type AbertoResumo = {
  aPagar: number
  aReceber: number
  itensPagar: Lancamento[]
  itensReceber: Lancamento[]
}

// Situação atual: tudo que está em aberto (sem pago_em), independentemente do período.
export function emAbertoResumo(lancs: Lancamento[]): AbertoResumo {
  const abertos = lancs.filter((l) => !l.pago_em)
  const porVenc = (a: Lancamento, b: Lancamento) => a.vencimento.localeCompare(b.vencimento)
  const itensPagar = abertos.filter((l) => l.tipo === 'despesa').sort(porVenc)
  const itensReceber = abertos.filter((l) => l.tipo === 'receita').sort(porVenc)
  return {
    aPagar: soma(itensPagar.map((l) => l.valor)),
    aReceber: soma(itensReceber.map((l) => l.valor)),
    itensPagar,
    itensReceber,
  }
}

// Lista de entradas (receita) ou saídas (despesa) realizadas no período, por data de pagamento.
export function realizados(lancs: Lancamento[], periodo: Periodo, tipo: 'receita' | 'despesa'): Lancamento[] {
  return lancs
    .filter((l) => l.tipo === tipo && realizado(l, periodo))
    .sort((a, b) => (a.pago_em ?? '').localeCompare(b.pago_em ?? ''))
}

// Pedidos faturados (status faturado) com faturado_em dentro do período, mais recente primeiro.
export function pedidosFaturadosNoPeriodo<T extends Pick<Pedido, 'status' | 'faturado_em'>>(pedidos: T[], periodo: Periodo): T[] {
  return pedidos
    .filter((p) => p.status === 'faturado' && dentroDoPeriodo(p.faturado_em, periodo))
    .sort((a, b) => (b.faturado_em ?? '').localeCompare(a.faturado_em ?? ''))
}

export type LinhaCliente = { cliente_id: string | null; nome: string; total: number }

export function recebidoPorCliente(lancs: Lancamento[], clientes: Cliente[], periodo: Periodo): LinhaCliente[] {
  const nomeDe = new Map(clientes.map((c) => [c.id, c.nome]))
  const tot = new Map<string | null, number>()
  for (const l of lancs) {
    if (l.tipo !== 'receita' || !realizado(l, periodo)) continue
    const k = l.cliente_id ?? null
    tot.set(k, Math.round(((tot.get(k) ?? 0) + l.valor) * 100) / 100)
  }
  return [...tot.entries()]
    .map(([cliente_id, total]) => ({
      cliente_id,
      nome: cliente_id ? (nomeDe.get(cliente_id) ?? 'Cliente removido') : 'Sem cliente',
      total,
    }))
    .sort((a, b) => b.total - a.total)
}
