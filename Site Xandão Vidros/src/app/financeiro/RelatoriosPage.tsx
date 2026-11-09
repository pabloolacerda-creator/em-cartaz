import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Lancamento, Cliente, Pedido } from '../../types'
import { formatMoedaBR } from '../../lib/money'
import { formatNumero } from '../../lib/numero'
import { periodoPreset, type Periodo } from '../../lib/periodo'
import FiltroPeriodo from '../comum/FiltroPeriodo'
import RelatorioCabecalho from '../comum/RelatorioCabecalho'
import { listarLancamentos } from './financeiro.api'
import { listarClientes } from '../clientes/clientes.api'
import { listarPedidos } from '../pedidos/pedidos.api'
import { serieMensal } from './dashboard'
import {
  resumoPeriodo,
  despesasPorCategoria,
  emAbertoResumo,
  recebidoPorCliente,
  realizados,
  pedidosFaturadosNoPeriodo,
} from './relatorios'

type PedidoLista = Pedido & { cliente_nome?: string; total: number }

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')
const hojeLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const dataBR = (iso?: string | null) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '—')
const dataHoraBR = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—')
const nomeMes = (chave: string) => {
  const [a, m] = chave.split('-').map(Number)
  return new Date(a, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

type BlocoKey = 'resumo' | 'entradas' | 'saidas' | 'categorias' | 'aReceber' | 'aPagar' | 'pedidos' | 'porCliente' | 'fluxo'
const BLOCOS: { key: BlocoKey; rotulo: string }[] = [
  { key: 'resumo', rotulo: 'Resumo do período' },
  { key: 'entradas', rotulo: 'Entradas (lista)' },
  { key: 'saidas', rotulo: 'Saídas (lista)' },
  { key: 'categorias', rotulo: 'Despesas por categoria' },
  { key: 'aReceber', rotulo: 'A receber (em aberto)' },
  { key: 'aPagar', rotulo: 'A pagar (em aberto)' },
  { key: 'pedidos', rotulo: 'Pedidos faturados' },
  { key: 'porCliente', rotulo: 'Recebido por cliente' },
  { key: 'fluxo', rotulo: 'Fluxo de caixa (6 meses)' },
]
const TODOS = Object.fromEntries(BLOCOS.map((b) => [b.key, true])) as Record<BlocoKey, boolean>

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <h2 className="mb-3 font-medium">{titulo}</h2>
      {children}
    </section>
  )
}
const Vazio = () => <p className="text-sm text-gray-500">Nada no período.</p>

export default function RelatoriosPage() {
  const [lancs, setLancs] = useState<Lancamento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pedidos, setPedidos] = useState<PedidoLista[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoPreset('mes', hojeLocal()))
  const [incluir, setIncluir] = useState<Record<BlocoKey, boolean>>(TODOS)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const [ls, cs, ps] = await Promise.all([listarLancamentos(), listarClientes(), listarPedidos()])
      setLancs(ls)
      setClientes(cs)
      setPedidos(ps)
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
  const entradas = useMemo(() => realizados(lancs, periodo, 'receita'), [lancs, periodo])
  const saidas = useMemo(() => realizados(lancs, periodo, 'despesa'), [lancs, periodo])
  const categorias = useMemo(() => despesasPorCategoria(lancs, periodo), [lancs, periodo])
  const abertos = useMemo(() => emAbertoResumo(lancs), [lancs])
  const porCliente = useMemo(() => recebidoPorCliente(lancs, clientes, periodo), [lancs, clientes, periodo])
  const pedidosFat = useMemo(() => pedidosFaturadosNoPeriodo(pedidos, periodo), [pedidos, periodo])
  const serie = useMemo(() => serieMensal(lancs, 6, hojeLocal()), [lancs])

  const periodoTxt = periodo.de || periodo.ate ? `Período: ${dataBR(periodo.de)} a ${dataBR(periodo.ate)}` : 'Todo o período'
  const toggle = (k: BlocoKey) => setIncluir((p) => ({ ...p, [k]: !p[k] }))

  if (loading) return <p>Carregando...</p>

  const listaMov = (itens: Lancamento[]) =>
    itens.length === 0 ? (
      <Vazio />
    ) : (
      <table className="w-full text-left">
        <thead>
          <tr className="border-b text-sm text-gray-500">
            <th className="py-2">Data</th>
            <th>Descrição</th>
            <th className="text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((l) => (
            <tr key={l.id} className="border-b">
              <td className="py-2 whitespace-nowrap">{dataBR(l.pago_em)}</td>
              <td>{l.descricao}</td>
              <td className="text-right whitespace-nowrap">{formatMoedaBR(l.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )

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

      {/* Montador: escolha o que entra no relatório */}
      <section className="rounded-lg border bg-gray-50 p-4 no-print">
        <h2 className="mb-3 text-sm font-medium text-gray-700">O que incluir no relatório</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BLOCOS.map((b) => (
            <label key={b.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={incluir[b.key]} onChange={() => toggle(b.key)} />
              {b.rotulo}
            </label>
          ))}
        </div>
      </section>

      {incluir.resumo && (
        <Secao titulo="Resumo do período">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-sm text-gray-500">Entradas</div>
              <div className="text-xl font-semibold text-green-700">{formatMoedaBR(resumo.receitas)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Saídas</div>
              <div className="text-xl font-semibold text-red-700">{formatMoedaBR(resumo.despesas)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Resultado</div>
              <div className={`text-xl font-semibold ${resumo.saldo < 0 ? 'text-red-700' : ''}`}>{formatMoedaBR(resumo.saldo)}</div>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">Considera o que foi efetivamente pago/recebido dentro do período.</p>
        </Secao>
      )}

      {incluir.entradas && <Secao titulo="Entradas (realizadas no período)">{listaMov(entradas)}</Secao>}
      {incluir.saidas && <Secao titulo="Saídas (realizadas no período)">{listaMov(saidas)}</Secao>}

      {incluir.categorias && (
        <Secao titulo="Despesas por categoria">
          {categorias.length === 0 ? (
            <Vazio />
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
      )}

      {incluir.aReceber && (
        <Secao titulo="A receber (em aberto)">
          <div className="mb-2 text-lg font-semibold text-green-700">{formatMoedaBR(abertos.aReceber)}</div>
          {abertos.itensReceber.length === 0 ? <p className="text-sm text-gray-500">Nada a receber.</p> : listaVenc(abertos.itensReceber)}
        </Secao>
      )}

      {incluir.aPagar && (
        <Secao titulo="A pagar (em aberto)">
          <div className="mb-2 text-lg font-semibold text-red-700">{formatMoedaBR(abertos.aPagar)}</div>
          {abertos.itensPagar.length === 0 ? <p className="text-sm text-gray-500">Nada a pagar.</p> : listaVenc(abertos.itensPagar)}
        </Secao>
      )}

      {incluir.pedidos && (
        <Secao titulo="Pedidos faturados no período">
          {pedidosFat.length === 0 ? (
            <Vazio />
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="py-2">Data</th>
                  <th>Nº</th>
                  <th>Cliente</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFat.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-2 whitespace-nowrap">{dataHoraBR(p.faturado_em)}</td>
                    <td>{p.numero ? formatNumero(p.numero) : '—'}</td>
                    <td>{p.cliente_nome ?? '—'}</td>
                    <td className="text-right whitespace-nowrap">{formatMoedaBR(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Secao>
      )}

      {incluir.porCliente && (
        <Secao titulo="Recebido por cliente (no período)">
          {porCliente.length === 0 ? (
            <Vazio />
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
      )}

      {incluir.fluxo && (
        <Secao titulo="Fluxo de caixa (últimos 6 meses)">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="py-2">Mês</th>
                <th className="text-right">Entradas</th>
                <th className="text-right">Saídas</th>
                <th className="text-right">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {serie.map((p) => (
                <tr key={p.mes} className="border-b">
                  <td className="py-2 capitalize">{nomeMes(p.mes)}</td>
                  <td className="text-right text-green-700">{formatMoedaBR(p.receitas)}</td>
                  <td className="text-right text-red-700">{formatMoedaBR(p.despesas)}</td>
                  <td className={`text-right ${p.saldo < 0 ? 'text-red-700' : ''}`}>{formatMoedaBR(p.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Secao>
      )}
    </div>
  )
}

function listaVenc(itens: Lancamento[]) {
  const dataBRv = (iso?: string | null) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '—')
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b text-sm text-gray-500">
          <th className="py-2">Vencimento</th>
          <th>Descrição</th>
          <th className="text-right">Valor</th>
        </tr>
      </thead>
      <tbody>
        {itens.map((l) => (
          <tr key={l.id} className="border-b">
            <td className="py-2 whitespace-nowrap">{dataBRv(l.vencimento)}</td>
            <td>{l.descricao}</td>
            <td className="text-right whitespace-nowrap">{formatMoedaBR(l.valor)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
