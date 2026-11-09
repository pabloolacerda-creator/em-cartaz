import { describe, it, expect } from 'vitest'
import { resumoFinanceiro, proximosVencimentos, serieMensal } from './dashboard'
import type { Lancamento, ContaFinanceira } from '../../types'

const hoje = '2026-02-15'
const contas: ContaFinanceira[] = [{ id: 'c1', nome: 'Banco', tipo: 'banco', saldo_inicial: 0, ativo: true, saldo: 1000 }]
const L = (o: Partial<Lancamento>): Lancamento =>
  ({ id: Math.random().toString(), tipo: 'receita', descricao: 'x', valor: 0, vencimento: hoje, pago_em: null, ...o }) as Lancamento

const lancs: Lancamento[] = [
  L({ tipo: 'receita', valor: 500, vencimento: '2026-02-10', pago_em: '2026-02-12' }),
  L({ tipo: 'despesa', valor: 200, vencimento: '2026-02-05', pago_em: '2026-02-06' }),
  L({ tipo: 'receita', valor: 300, vencimento: '2026-02-18', pago_em: null }),
  L({ tipo: 'despesa', valor: 400, vencimento: '2026-03-07', pago_em: null }),
  L({ tipo: 'receita', valor: 150, vencimento: '2026-02-01', pago_em: null }), // vencida
]

describe('resumoFinanceiro', () => {
  const r = resumoFinanceiro(lancs, contas, hoje)
  it('saldo total das contas', () => expect(r.saldoTotal).toBe(1000))
  it('a pagar e a receber (em aberto)', () => {
    expect(r.totalAPagar).toBe(400)
    expect(r.totalAReceber).toBe(450)
  })
  it('receitas/despesas/resultado do mês (realizado)', () => {
    expect(r.receitasMes).toBe(500)
    expect(r.despesasMes).toBe(200)
    expect(r.resultadoMes).toBe(300)
  })
  it('inadimplência = receita em aberto vencida', () => expect(r.inadimplencia).toBe(150))
  it('saldo previsto 7/15/30', () => {
    expect(r.previsto7).toBe(1450)
    expect(r.previsto15).toBe(1450)
    expect(r.previsto30).toBe(1050)
  })
  it('sem alerta quando nenhum previsto fica negativo', () => expect(r.alertaNegativo).toBe(false))
  it('listas vazias não viram NaN', () => {
    const z = resumoFinanceiro([], [], hoje)
    expect(z.saldoTotal).toBe(0)
    expect(z.totalAReceber).toBe(0)
    expect(z.resultadoMes).toBe(0)
  })
})

describe('proximosVencimentos', () => {
  it('em aberto até hoje+dias (inclui vencidos), ordenado', () => {
    const v = proximosVencimentos(lancs, hoje, 7)
    expect(v.map((l) => l.vencimento)).toEqual(['2026-02-01', '2026-02-18'])
  })
})

describe('serieMensal', () => {
  it('últimos N meses com receitas/despesas pagas', () => {
    const s = serieMensal(lancs, 3, hoje)
    expect(s.length).toBe(3)
    expect(s[2]).toMatchObject({ mes: '2026-02', receitas: 500, despesas: 200 })
    expect(s[0]).toMatchObject({ mes: '2025-12', receitas: 0, despesas: 0 })
  })
})
