import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Pedido, PedidoItem } from '../../types'
import { formatMoedaBR } from '../../lib/money'
import { obterPedido, aprovarPedido, reprovarPedido, faturarPedido } from './pedidos.api'
import { STATUS, statusDe } from './status'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')
const dataHoraBR = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—')

export default function PedidoDetalhe() {
  const { id = '' } = useParams()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [itens, setItens] = useState<PedidoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [acaoEmCurso, setAcaoEmCurso] = useState(false)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const { pedido, itens } = await obterPedido(id)
      setPedido(pedido)
      setItens(itens)
    } catch (e) {
      setErro(msg(e))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function executar(fn: (id: string) => Promise<void>) {
    if (acaoEmCurso) return
    setAcaoEmCurso(true)
    setErro(null)
    try {
      await fn(id)
      await carregar()
    } catch (e) {
      setErro(msg(e))
    } finally {
      setAcaoEmCurso(false)
    }
  }

  if (loading) return <p>Carregando...</p>
  if (erro && !pedido)
    return (
      <div className="space-y-4">
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">{erro}</p>
        <Link to="/app/pedidos" className="underline">Voltar</Link>
      </div>
    )
  if (!pedido) return null

  const status = statusDe(pedido.status)
  const total = itens.reduce((s, i) => s + Math.round(i.quantidade * i.valor_unitario * 100), 0) / 100

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Pedido</h1>
        <span className={`rounded px-3 py-1 text-sm font-medium ${STATUS[status].cls}`}>{STATUS[status].rotulo}</span>
      </div>

      {erro && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800 no-print">{erro}</p>
      )}

      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div><span className="text-sm text-gray-500">Cliente</span><div className="font-medium">{pedido.cliente_nome ?? '—'}</div></div>
          <div><span className="text-sm text-gray-500">Data</span><div>{new Date(pedido.data).toLocaleString('pt-BR')}</div></div>
          {pedido.obs && <div className="sm:col-span-2"><span className="text-sm text-gray-500">Observações</span><div>{pedido.obs}</div></div>}
          {status === 'faturado' && (
            <div><span className="text-sm text-gray-500">Faturado em</span><div>{dataHoraBR(pedido.faturado_em)}</div></div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Descrição</th>
              <th className="text-right">Qtd</th>
              <th className="text-right">Valor unit.</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id} className="border-b">
                <td className="py-2">{i.descricao}</td>
                <td className="text-right">{i.quantidade.toLocaleString('pt-BR')}</td>
                <td className="text-right">{formatMoedaBR(i.valor_unitario)}</td>
                <td className="text-right">{formatMoedaBR(Math.round(i.quantidade * i.valor_unitario * 100) / 100)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="py-2 text-right font-medium">Total do pedido</td>
              <td className="text-right font-semibold">{formatMoedaBR(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 no-print">
        {status === 'emitido' && (
          <>
            <button type="button" disabled={acaoEmCurso} onClick={() => executar(aprovarPedido)} className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50">Aprovar</button>
            <button type="button" disabled={acaoEmCurso} onClick={() => executar(reprovarPedido)} className="rounded bg-red-700 px-4 py-2 text-white disabled:opacity-50">Reprovar</button>
          </>
        )}
        {status === 'aprovado' && (
          <button type="button" disabled={acaoEmCurso} onClick={() => executar(faturarPedido)} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Faturar</button>
        )}
        <button type="button" onClick={() => window.print()} className="rounded border px-4 py-2">Imprimir</button>
        <Link to="/app/pedidos" className="rounded border px-4 py-2">Voltar</Link>
      </div>
    </div>
  )
}
