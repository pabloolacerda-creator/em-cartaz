import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Pedido, PedidoItem } from '../../types'
import { formatMoedaBR } from '../../lib/money'
import { EMPRESA } from '../../lib/empresa'
import { obterPedido, aprovarPedido, reprovarPedido, faturarPedido } from './pedidos.api'
import { STATUS, statusDe } from './status'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')
const dataHoraBR = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—')
const dataBR = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—')

function Dado({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  return (
    <div>
      <span className="text-sm text-gray-500">{rotulo}</span>
      <div>{valor || '—'}</div>
    </div>
  )
}

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
  const contato = [pedido.cliente_telefone, pedido.cliente_email].filter(Boolean).join(' · ')

  return (
    <div className="space-y-6">
      {/* Cabeçalho institucional — aparece apenas na impressão */}
      <header className="print-only mb-4 flex items-center gap-4 border-b pb-4">
        <img src={EMPRESA.logo} alt={EMPRESA.nome} className="h-16 w-auto" />
        <div>
          <div className="text-lg font-bold">{EMPRESA.nome}</div>
          <div className="text-sm italic text-gray-600">{EMPRESA.slogan}</div>
          <div className="text-xs text-gray-600">{EMPRESA.endereco} · CNPJ {EMPRESA.cnpj}</div>
          <div className="text-xs text-gray-600">{EMPRESA.telefone} · {EMPRESA.email}</div>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Pedido</h1>
        <span className={`rounded px-3 py-1 text-sm font-medium ${STATUS[status].cls}`}>{STATUS[status].rotulo}</span>
      </div>

      {erro && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800 no-print">{erro}</p>
      )}

      {/* Bloco 1 — Informações do cliente */}
      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-medium">Informações do cliente</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Dado rotulo="Nome" valor={pedido.cliente_nome} />
          <Dado rotulo="CNPJ/CPF" valor={pedido.cliente_documento} />
          <Dado rotulo="Data" valor={dataBR(pedido.data)} />
          <Dado rotulo="Contato" valor={contato} />
          <div className="sm:col-span-2">
            <Dado rotulo="Endereço" valor={pedido.cliente_endereco} />
          </div>
        </div>
      </section>

      {/* Bloco 2 — Produtos e Serviços */}
      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-medium">Produtos e Serviços</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Descrição</th>
                <th className="text-right">Qtd</th>
                <th className="text-right">Valor unit.</th>
                <th className="text-right">Total</th>
                <th>Obs</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.id} className="border-b align-top">
                  <td className="py-2">{i.descricao}</td>
                  <td className="text-right">{i.quantidade.toLocaleString('pt-BR')}</td>
                  <td className="text-right">{formatMoedaBR(i.valor_unitario)}</td>
                  <td className="text-right">{formatMoedaBR(Math.round(i.quantidade * i.valor_unitario * 100) / 100)}</td>
                  <td>{i.obs || ''}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="py-2 text-right font-medium">Total do pedido</td>
                <td className="text-right font-semibold">{formatMoedaBR(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Bloco 3 — Informações adicionais */}
      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-medium">Informações adicionais</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Dado rotulo="Prazo de entrega" valor={pedido.prazo_entrega} />
          <Dado rotulo="Formas de pagamento" valor={pedido.forma_pagamento} />
          <div className="sm:col-span-2">
            <Dado rotulo="Observações" valor={pedido.obs} />
          </div>
          {status === 'faturado' && <Dado rotulo="Faturado em" valor={dataHoraBR(pedido.faturado_em)} />}
        </div>
      </section>

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
