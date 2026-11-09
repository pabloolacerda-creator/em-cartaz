import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ContaFinanceira, Lancamento } from '../../types'
import { formatMoedaBR } from '../../lib/money'
import { listarLancamentos, listarContas } from './financeiro.api'
import { resumoFinanceiro, proximosVencimentos, serieMensal } from './dashboard'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')
const hojeISO = () => new Date().toISOString().slice(0, 10)
const dataBR = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}` : iso
}
const nomeMes = (chave: string) => {
  const [a, m] = chave.split('-').map(Number)
  return new Date(a, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short' })
}

function Cartao({ titulo, valor, cor }: { titulo: string; valor: number; cor?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm text-gray-500">{titulo}</div>
      <div className={`text-xl font-semibold ${cor ?? ''}`}>{formatMoedaBR(valor)}</div>
    </div>
  )
}

export default function FinanceiroPainel() {
  const [itens, setItens] = useState<Lancamento[]>([])
  const [contas, setContas] = useState<ContaFinanceira[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const [l, c] = await Promise.all([listarLancamentos(), listarContas()])
      setItens(l)
      setContas(c)
    } catch (e) {
      setErro(msg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const hoje = hojeISO()
  const r = useMemo(() => resumoFinanceiro(itens, contas, hoje), [itens, contas, hoje])
  const vencendo = useMemo(() => proximosVencimentos(itens, hoje, 7), [itens, hoje])
  const serie = useMemo(() => serieMensal(itens, 6, hoje), [itens, hoje])
  const maxBarra = useMemo(() => Math.max(1, ...serie.flatMap((p) => [p.receitas, p.despesas])), [serie])

  if (loading) return <p>Carregando...</p>

  return (
    <div className="space-y-6">
      {erro && <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">{erro}</p>}

      {r.alertaNegativo && (
        <p role="alert" className="rounded bg-amber-100 px-3 py-2 font-medium text-amber-900">
          ⚠️ Atenção: há <strong>saldo previsto negativo</strong> em algum dos próximos períodos (7/15/30 dias).
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao titulo="Saldo em bancos e caixas" valor={r.saldoTotal} />
        <Cartao titulo="Total a pagar" valor={r.totalAPagar} cor="text-red-700" />
        <Cartao titulo="Total a receber" valor={r.totalAReceber} cor="text-green-700" />
        <Cartao titulo="Resultado do mês" valor={r.resultadoMes} cor={r.resultadoMes < 0 ? 'text-red-700' : 'text-green-700'} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao titulo="Saldo previsto (7 dias)" valor={r.previsto7} cor={r.previsto7 < 0 ? 'text-red-700' : ''} />
        <Cartao titulo="Saldo previsto (15 dias)" valor={r.previsto15} cor={r.previsto15 < 0 ? 'text-red-700' : ''} />
        <Cartao titulo="Saldo previsto (30 dias)" valor={r.previsto30} cor={r.previsto30 < 0 ? 'text-red-700' : ''} />
        <Cartao titulo="Inadimplência (a receber vencido)" valor={r.inadimplencia} cor="text-red-700" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Gráfico receitas × despesas */}
        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-medium">Receitas × Despesas (6 meses)</h2>
          <div className="flex h-40 items-end gap-3">
            {serie.map((p) => (
              <div key={p.mes} className="flex flex-1 flex-col items-center justify-end gap-1">
                <div className="flex w-full items-end justify-center gap-1" style={{ height: '120px' }}>
                  <div className="w-3 rounded-t bg-green-600" style={{ height: `${(p.receitas / maxBarra) * 100}%` }} title={`Receitas ${formatMoedaBR(p.receitas)}`} />
                  <div className="w-3 rounded-t bg-red-600" style={{ height: `${(p.despesas / maxBarra) * 100}%` }} title={`Despesas ${formatMoedaBR(p.despesas)}`} />
                </div>
                <div className="text-xs capitalize text-gray-500">{nomeMes(p.mes)}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-gray-600">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-green-600" />Receitas</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-red-600" />Despesas</span>
          </div>
        </div>

        {/* Fluxo: resultado por mês */}
        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-medium">Fluxo de caixa — resultado por mês</h2>
          <div className="flex h-40 items-center gap-3">
            {serie.map((p) => {
              const alt = Math.min(100, (Math.abs(p.saldo) / maxBarra) * 100)
              return (
                <div key={p.mes} className="flex flex-1 flex-col items-center justify-center gap-1">
                  <div className="flex w-full items-end justify-center" style={{ height: '120px' }}>
                    <div className={`w-6 rounded-t ${p.saldo < 0 ? 'bg-red-600' : 'bg-emerald-600'}`} style={{ height: `${alt}%` }} title={`${nomeMes(p.mes)}: ${formatMoedaBR(p.saldo)}`} />
                  </div>
                  <div className="text-xs capitalize text-gray-500">{nomeMes(p.mes)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Próximos vencimentos */}
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Próximos vencimentos (7 dias)</h2>
          <Link to="/app/financeiro/lancamentos" className="text-sm underline">Ver lançamentos</Link>
        </div>
        {vencendo.length === 0 ? (
          <p className="text-sm text-gray-500">Nada vencendo nos próximos 7 dias.</p>
        ) : (
          <ul className="divide-y">
            {vencendo.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                <span>{dataBR(l.vencimento)} · {l.descricao}</span>
                <span className={l.tipo === 'receita' ? 'text-green-700' : 'text-red-700'}>{formatMoedaBR(l.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
