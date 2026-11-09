import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Lancamento } from '../../types'
import { formatMoedaBR } from '../../lib/money'
import { listarLancamentos } from './financeiro.api'
import { serieMensal } from './dashboard'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')
const hojeISO = () => new Date().toISOString().slice(0, 10)
const nomeMes = (chave: string) => {
  const [a, m] = chave.split('-').map(Number)
  return new Date(a, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

export default function FluxoPage() {
  const [itens, setItens] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      setItens(await listarLancamentos())
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
  const serie = useMemo(() => serieMensal(itens, 6, hoje), [itens, hoje])
  // acumula o saldo ao longo dos meses (realizado)
  const comAcumulado = useMemo(() => {
    let acc = 0
    return serie.map((p) => {
      acc = Math.round((acc + p.saldo) * 100) / 100
      return { ...p, acumulado: acc }
    })
  }, [serie])

  const aReceber = useMemo(() => itens.filter((l) => l.tipo === 'receita' && !l.pago_em).reduce((s, l) => s + Math.round(l.valor * 100), 0) / 100, [itens])
  const aPagar = useMemo(() => itens.filter((l) => l.tipo === 'despesa' && !l.pago_em).reduce((s, l) => s + Math.round(l.valor * 100), 0) / 100, [itens])

  if (loading) return <p>Carregando...</p>

  return (
    <div className="space-y-6">
      {erro && <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">{erro}</p>}

      <div>
        <h2 className="mb-3 font-medium">Realizado (últimos 6 meses)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="py-2">Mês</th>
                <th className="text-right">Entradas</th>
                <th className="text-right">Saídas</th>
                <th className="text-right">Resultado</th>
                <th className="text-right">Saldo acumulado</th>
              </tr>
            </thead>
            <tbody>
              {comAcumulado.map((p) => (
                <tr key={p.mes} className="border-b">
                  <td className="py-2 capitalize">{nomeMes(p.mes)}</td>
                  <td className="text-right text-green-700">{formatMoedaBR(p.receitas)}</td>
                  <td className="text-right text-red-700">{formatMoedaBR(p.despesas)}</td>
                  <td className={`text-right ${p.saldo < 0 ? 'text-red-700' : ''}`}>{formatMoedaBR(p.saldo)}</td>
                  <td className="text-right font-medium">{formatMoedaBR(p.acumulado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Previsto a receber (em aberto)</div>
          <div className="text-xl font-semibold text-green-700">{formatMoedaBR(aReceber)}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Previsto a pagar (em aberto)</div>
          <div className="text-xl font-semibold text-red-700">{formatMoedaBR(aPagar)}</div>
        </div>
      </div>
    </div>
  )
}
