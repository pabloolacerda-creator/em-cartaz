import type { Lancamento, ContaFinanceira } from '../../types'

const soma = (vals: number[]) => vals.reduce((s, v) => s + Math.round(v * 100), 0) / 100
const emAberto = (l: Lancamento) => !l.pago_em
const addDias = (iso: string, dias: number) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}
const mesDe = (iso: string) => iso.slice(0, 7)

export type ResumoFinanceiro = {
  saldoTotal: number
  totalAPagar: number
  totalAReceber: number
  receitasMes: number
  despesasMes: number
  resultadoMes: number
  previsto7: number
  previsto15: number
  previsto30: number
  inadimplencia: number
  alertaNegativo: boolean
}

export function resumoFinanceiro(lancs: Lancamento[], contas: ContaFinanceira[], hoje: string): ResumoFinanceiro {
  const saldoTotal = soma(contas.map((c) => c.saldo ?? c.saldo_inicial ?? 0))
  const abertos = lancs.filter(emAberto)
  const totalAPagar = soma(abertos.filter((l) => l.tipo === 'despesa').map((l) => l.valor))
  const totalAReceber = soma(abertos.filter((l) => l.tipo === 'receita').map((l) => l.valor))

  const mes = mesDe(hoje)
  const pagosMes = lancs.filter((l) => l.pago_em && mesDe(l.pago_em) === mes)
  const receitasMes = soma(pagosMes.filter((l) => l.tipo === 'receita').map((l) => l.valor))
  const despesasMes = soma(pagosMes.filter((l) => l.tipo === 'despesa').map((l) => l.valor))

  const previsto = (dias: number) => {
    const limite = addDias(hoje, dias)
    const rec = soma(abertos.filter((l) => l.tipo === 'receita' && l.vencimento <= limite).map((l) => l.valor))
    const desp = soma(abertos.filter((l) => l.tipo === 'despesa' && l.vencimento <= limite).map((l) => l.valor))
    return Math.round((saldoTotal + rec - desp) * 100) / 100
  }
  const previsto7 = previsto(7)
  const previsto15 = previsto(15)
  const previsto30 = previsto(30)

  const inadimplencia = soma(abertos.filter((l) => l.tipo === 'receita' && l.vencimento < hoje).map((l) => l.valor))

  return {
    saldoTotal,
    totalAPagar,
    totalAReceber,
    receitasMes,
    despesasMes,
    resultadoMes: Math.round((receitasMes - despesasMes) * 100) / 100,
    previsto7,
    previsto15,
    previsto30,
    inadimplencia,
    alertaNegativo: previsto7 < 0 || previsto15 < 0 || previsto30 < 0,
  }
}

export function proximosVencimentos(lancs: Lancamento[], hoje: string, dias: number): Lancamento[] {
  const limite = addDias(hoje, dias)
  return lancs
    .filter((l) => emAberto(l) && l.vencimento <= limite)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
}

export type PontoMensal = { mes: string; receitas: number; despesas: number; saldo: number }

export function serieMensal(lancs: Lancamento[], n: number, hoje: string): PontoMensal[] {
  const [ano, mes] = hoje.split('-').map(Number)
  const pontos: PontoMensal[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(ano, mes - 1 - i, 1)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const doMes = lancs.filter((l) => l.pago_em && mesDe(l.pago_em) === chave)
    const receitas = soma(doMes.filter((l) => l.tipo === 'receita').map((l) => l.valor))
    const despesas = soma(doMes.filter((l) => l.tipo === 'despesa').map((l) => l.valor))
    pontos.push({ mes: chave, receitas, despesas, saldo: Math.round((receitas - despesas) * 100) / 100 })
  }
  return pontos
}
