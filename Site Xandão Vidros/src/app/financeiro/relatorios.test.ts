import { describe, it, expect } from 'vitest'
import type { Lancamento, Cliente, StatusPedido } from '../../types'
import type { Periodo } from '../../lib/periodo'
import { resumoPeriodo, despesasPorCategoria, emAbertoResumo, recebidoPorCliente, realizados, pedidosFaturadosNoPeriodo } from './relatorios'

const L = (o: Partial<Lancamento>): Lancamento =>
  ({
    id: Math.random().toString(36).slice(2),
    tipo: 'despesa',
    descricao: 'x',
    valor: 100,
    vencimento: '2026-11-10',
    pago_em: null,
    categoria: null,
    cliente_id: null,
    pedido_id: null,
    ...o,
  }) as Lancamento

const NOV: Periodo = { de: '2026-11-01', ate: '2026-11-30' }

describe('resumoPeriodo (realizado no período)', () => {
  it('soma receitas e despesas pagas dentro do período e o saldo', () => {
    const lancs = [
      L({ tipo: 'receita', valor: 1000, pago_em: '2026-11-05' }),
      L({ tipo: 'despesa', valor: 300, pago_em: '2026-11-08' }),
      L({ tipo: 'receita', valor: 500, pago_em: '2026-10-30' }), // fora do período
      L({ tipo: 'receita', valor: 700, pago_em: null }), // em aberto, não conta
    ]
    expect(resumoPeriodo(lancs, NOV)).toEqual({ receitas: 1000, despesas: 300, saldo: 700 })
  })
})

describe('despesasPorCategoria', () => {
  it('agrupa despesas pagas no período por categoria, maior primeiro', () => {
    const lancs = [
      L({ tipo: 'despesa', valor: 200, categoria: 'Vidro', pago_em: '2026-11-03' }),
      L({ tipo: 'despesa', valor: 150, categoria: 'Vidro', pago_em: '2026-11-09' }),
      L({ tipo: 'despesa', valor: 90, categoria: null, pago_em: '2026-11-09' }),
      L({ tipo: 'receita', valor: 999, categoria: 'Vidro', pago_em: '2026-11-09' }), // receita não entra
    ]
    expect(despesasPorCategoria(lancs, NOV)).toEqual([
      { categoria: 'Vidro', total: 350 },
      { categoria: 'Sem categoria', total: 90 },
    ])
  })
})

describe('emAbertoResumo (situação atual, independe do período)', () => {
  it('soma o que está em aberto a pagar e a receber', () => {
    const lancs = [
      L({ tipo: 'despesa', valor: 400, pago_em: null }),
      L({ tipo: 'receita', valor: 900, pago_em: null }),
      L({ tipo: 'receita', valor: 100, pago_em: '2026-11-02' }), // pago, não conta
    ]
    const r = emAbertoResumo(lancs)
    expect(r.aPagar).toBe(400)
    expect(r.aReceber).toBe(900)
    expect(r.itensPagar).toHaveLength(1)
    expect(r.itensReceber).toHaveLength(1)
  })
})

describe('realizados (lista de entradas/saídas pagas no período)', () => {
  it('filtra por tipo e pago_em no período, ordenado por pago_em', () => {
    const lancs = [
      L({ tipo: 'receita', valor: 100, pago_em: '2026-11-20' }),
      L({ tipo: 'receita', valor: 50, pago_em: '2026-11-03' }),
      L({ tipo: 'despesa', valor: 70, pago_em: '2026-11-04' }),
      L({ tipo: 'receita', valor: 999, pago_em: '2026-10-01' }), // fora
      L({ tipo: 'receita', valor: 999, pago_em: null }), // aberto
    ]
    const r = realizados(lancs, NOV, 'receita')
    expect(r.map((l) => l.valor)).toEqual([50, 100])
  })
})

describe('pedidosFaturadosNoPeriodo', () => {
  it('só os faturados com faturado_em no período, mais recente primeiro', () => {
    const peds: { id: string; status: StatusPedido; faturado_em: string | null; total: number }[] = [
      { id: 'p1', status: 'faturado', faturado_em: '2026-11-05T10:00:00Z', total: 500 },
      { id: 'p2', status: 'faturado', faturado_em: '2026-11-20T10:00:00Z', total: 800 },
      { id: 'p3', status: 'aprovado', faturado_em: null, total: 300 }, // não faturado
      { id: 'p4', status: 'faturado', faturado_em: '2026-10-01T10:00:00Z', total: 900 }, // fora
    ]
    expect(pedidosFaturadosNoPeriodo(peds, NOV).map((p) => p.id)).toEqual(['p2', 'p1'])
  })
})

describe('recebidoPorCliente (realizado no período)', () => {
  it('agrupa receitas pagas por cliente com o nome, maior primeiro', () => {
    const clientes = [
      { id: 'c1', nome: 'Ana' } as Cliente,
      { id: 'c2', nome: 'Bruno' } as Cliente,
    ]
    const lancs = [
      L({ tipo: 'receita', valor: 1000, cliente_id: 'c1', pago_em: '2026-11-05' }),
      L({ tipo: 'receita', valor: 250, cliente_id: 'c2', pago_em: '2026-11-06' }),
      L({ tipo: 'receita', valor: 300, cliente_id: 'c1', pago_em: '2026-11-07' }),
      L({ tipo: 'receita', valor: 80, cliente_id: null, pago_em: '2026-11-07' }),
      L({ tipo: 'despesa', valor: 500, cliente_id: 'c1', pago_em: '2026-11-07' }), // despesa não conta
    ]
    expect(recebidoPorCliente(lancs, clientes, NOV)).toEqual([
      { cliente_id: 'c1', nome: 'Ana', total: 1300 },
      { cliente_id: 'c2', nome: 'Bruno', total: 250 },
      { cliente_id: null, nome: 'Sem cliente', total: 80 },
    ])
  })
})
