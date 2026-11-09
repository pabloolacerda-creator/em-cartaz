import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Lancamento, Cliente } from '../../types'
import { formatMoedaBR } from '../../lib/money'
import { periodoPreset, type Periodo } from '../../lib/periodo'
import FiltroPeriodo from '../comum/FiltroPeriodo'
import RelatorioCabecalho from '../comum/RelatorioCabecalho'
import { listarLancamentos } from './financeiro.api'
import { listarClientes } from '../clientes/clientes.api'
import { resumoPeriodo, despesasPorCategoria, emAbertoResumo, recebidoPorCliente } from './relatorios'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')
const hojeLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const dataBR = (iso?: string | null) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '—')

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <h2 className="mb-3 font-medium">{titulo}</h2>
      {children}
    </section>
  )
}

const vazio = <p className="text-sm text-gray-500">Nada no período.</p>

export default function RelatoriosPage() {
  const [lancs, setLancs] = useState<Lancamento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoPreset('mes', hojeLocal()))

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const [ls, cs] = await Promise.all([listarLancamentos(), listarClientes()])
      setLancs(ls)
      setClientes(cs)
    } catch (e) {
      setErro(msg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const resumo = useMemo(() => resumoPeriodo(lancs, periodo), [lancs, periodo])
  const categorias = useMemo(() => despesasPorCategoria(lancs, periodo), [lancs, periodo])
  const abertos = useMemo(() => emAbertoResumo(lancs), [lancs])
  const porCliente = useMemo(() => recebidoPorCliente(lancs, clientes, periodo), [lancs, clientes, periodo])

  const periodoTxt = periodo.de || periodo.ate ? `Período: ${dataBR(periodo.de)} a ${dataBR(periodo.ate)}` : 'Todo o período'

  if (loading) return <p>Carregando...</p>

  return (
    <div className="space-y-6">
      <RelatorioCabecalho titulo="Relatórios financeiros" subtitulo={periodoTxt} />

      {erro && <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800 no-print">{erro}</p>}

      <div className="flex flex-wrap items-end justify-between gap-3 no-print">
        <FiltroPeriodo label="Período (realizado)" value={periodo} onChange={setPeriodo} />
        <button type="button" onClick={() => window.print()} className="rounded bg-gray-900 px-4 py-2 text-sm text-white">
          Imprimir
        </button>
      </div>

      {/* 1. Resumo do período */}
      <Secao titulo="Resumo do período">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-sm text-gray-500">Receitas</div>
            <div className="text-xl font-semibold text-green-700">{formatMoedaBR(resumo.receitas)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Despesas</div>
            <div className="text-xl font-semibold text-red-700">{formatMoedaBR(resumo.despesas)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Resultado</div>
            <div className={`text-xl font-semibold ${resumo.saldo < 0 ? 'text-red-700' : ''}`}>{formatMoedaBR(resumo.saldo)}</div>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">Considera o que foi efetivamente pago/recebido dentro do período.</p>
      </Secao>

      {/* 2. Despesas por categoria */}
      <Secao titulo="Despesas por categoria">
        {categorias.length === 0 ? (
          vazio
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="py-2">Categoria</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((c) => (
                <tr key={c.categoria} className="border-b">
                  <td className="py-2">{c.categoria}</td>
                  <td className="text-right text-red-700">{formatMoedaBR(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Secao>

      {/* 3. A pagar e a receber (situação atual) */}
      <Secao titulo="A pagar e a receber (em aberto)">
        <div className="mb-3 grid gap-4 sm:grid-cols-2">
          <div className="rounded border p-3">
            <div className="text-sm text-gray-500">Total a receber</div>
            <div className="text-lg font-semibold text-green-700">{formatMoedaBR(abertos.aReceber)}</div>
          </div>
          <div className="rounded border p-3">
            <div className="text-sm text-gray-500">Total a pagar</div>
            <div className="text-lg font-semibold text-red-700">{formatMoedaBR(abertos.aPagar)}</div>
          </div>
        </div>
        {abertos.itensReceber.length + abertos.itensPagar.length === 0 ? (
          <p className="text-sm text-gray-500">Nada em aberto.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="py-2">Vencimento</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th className="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {[...abertos.itensReceber, ...abertos.itensPagar]
                .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
                .map((l) => (
                  <tr key={l.id} className="border-b">
                    <td className="py-2 whitespace-nowrap">{dataBR(l.vencimento)}</td>
                    <td>{l.descricao}</td>
                    <td className={l.tipo === 'receita' ? 'text-green-700' : 'text-red-700'}>
                      {l.tipo === 'receita' ? 'A receber' : 'A pagar'}
                    </td>
                    <td className="text-right whitespace-nowrap">{formatMoedaBR(l.valor)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
        <p className="mt-2 text-xs text-gray-400">Situação atual (não depende do período).</p>
      </Secao>

      {/* 4. Faturamento por cliente */}
      <Secao titulo="Recebido por cliente (no período)">
        {porCliente.length === 0 ? (
          vazio
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="py-2">Cliente</th>
                <th className="text-right">Total recebido</th>
              </tr>
            </thead>
            <tbody>
              {porCliente.map((c) => (
                <tr key={c.cliente_id ?? 'sem'} className="border-b">
                  <td className="py-2">{c.nome}</td>
                  <td className="text-right text-green-700">{formatMoedaBR(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Secao>
    </div>
  )
}
