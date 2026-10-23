import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Pedido, PedidoItem } from '../../types'
import { formatNumero } from '../../lib/numero'
import { EMPRESA } from '../../lib/empresa'
import { obterPedido, gerarOS, salvarObsProducao } from './pedidos.api'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')
const dataBR = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—')
const num = (n: number) => n.toLocaleString('pt-BR')
const medidas = (i: PedidoItem) => {
  if (i.largura && i.altura) return `${num(i.largura)} × ${num(i.altura)} m`
  if (i.largura) return `${num(i.largura)} m`
  return '—'
}

// Ordem de Serviço: documento para a produção. NUNCA mostra valores.
export default function PedidoOS() {
  const { id = '' } = useParams()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [itens, setItens] = useState<PedidoItem[]>([])
  const [osNumero, setOsNumero] = useState<number | null>(null)
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const { pedido, itens } = await obterPedido(id)
      setPedido(pedido)
      setItens(itens)
      setObs(pedido.obs_producao ?? '')
      setOsNumero(await gerarOS(id))
    } catch (e) {
      setErro(msg(e))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function salvar(): Promise<boolean> {
    setSalvando(true)
    setErro(null)
    setAviso(null)
    try {
      await salvarObsProducao(id, obs.trim() || null)
      setAviso('Obs de produção salva.')
      return true
    } catch (e) {
      setErro(msg(e))
      return false
    } finally {
      setSalvando(false)
    }
  }

  async function imprimir() {
    if (await salvar()) window.print()
  }

  if (loading) return <p>Carregando...</p>
  if (!pedido)
    return (
      <div className="space-y-4">
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">{erro ?? 'Pedido não encontrado.'}</p>
        <Link to="/app/pedidos" className="underline">Voltar</Link>
      </div>
    )

  return (
    <div className="space-y-6">
      <img src="/timbrado.png" alt={EMPRESA.nome} className="w-full" />

      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
        <div>
          <h1 className="text-xl font-bold">Ordem de Serviço{osNumero ? ` nº ${formatNumero(osNumero)}` : ''}</h1>
          <div className="text-sm text-gray-600">
            Ref. Pedido nº {formatNumero(pedido.numero)} · Emitida em {dataBR(new Date().toISOString())}
          </div>
        </div>
      </div>

      {erro && <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800 no-print">{erro}</p>}
      {aviso && <p role="status" className="rounded bg-green-100 px-3 py-2 text-green-800 no-print">{aviso}</p>}

      <section className="grid gap-2 rounded-lg border bg-white p-4 sm:grid-cols-3">
        <div><span className="text-sm text-gray-500">Cliente</span><div className="font-medium">{pedido.cliente_nome ?? '—'}</div></div>
        <div><span className="text-sm text-gray-500">Data do pedido</span><div>{dataBR(pedido.data)}</div></div>
        <div><span className="text-sm text-gray-500">Prazo de entrega</span><div>{pedido.prazo_entrega || '—'}</div></div>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-medium">Itens a produzir</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-sm text-gray-500">
              <th className="py-2 pr-3 font-medium">Descrição</th>
              <th className="px-3 py-2 text-right font-medium">Qtd</th>
              <th className="px-3 py-2 font-medium">Unidade</th>
              <th className="py-2 pl-3 font-medium">Medidas</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <Fragment key={i.id}>
                <tr className={i.obs ? '' : 'border-b'}>
                  <td className="py-2 pr-3 align-top">
                    <div className="font-medium">{i.descricao}</div>
                    {i.descricao_adicional && <div className="text-sm text-gray-600">{i.descricao_adicional}</div>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right align-top">{num(i.quantidade)}</td>
                  <td className="px-3 py-2 align-top">{i.unidade ?? '—'}</td>
                  <td className="whitespace-nowrap py-2 pl-3 align-top">{medidas(i)}</td>
                </tr>
                {i.obs && (
                  <tr className="border-b">
                    <td colSpan={4} className="pb-3 text-sm text-gray-600">
                      <span className="font-medium text-gray-500">Obs: </span>
                      <span>{i.obs}</span>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <label htmlFor="os-obs" className="mb-2 block font-medium">Obs de produção (interno — não vai para o cliente)</label>
        <textarea
          id="os-obs"
          rows={4}
          className="w-full rounded border border-gray-300 px-3 py-2 no-print"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
        />
        <div className="print-only whitespace-pre-wrap">{obs.trim() || '—'}</div>
      </section>

      <div className="flex flex-wrap gap-2 no-print">
        <button type="button" disabled={salvando} onClick={salvar} className="rounded border px-4 py-2 disabled:opacity-50">Salvar obs</button>
        <button type="button" disabled={salvando} onClick={imprimir} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Imprimir OS</button>
        <Link to={`/app/pedidos/${id}`} className="rounded border px-4 py-2">Voltar</Link>
      </div>
    </div>
  )
}
