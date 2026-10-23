import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Pedido, PedidoItem } from '../../types'
import { formatMoedaBR } from '../../lib/money'
import { formatNumero } from '../../lib/numero'
import { calcularTotais } from '../../lib/desconto'
import { EMPRESA } from '../../lib/empresa'
import { obterPedido, aprovarPedido, reprovarPedido, faturarPedido } from './pedidos.api'
import { gerarContaReceber, lancarRecebimentosPedido, type Parcela } from '../financeiro/financeiro.api'
import { STATUS, statusDe } from './status'
import FaturarDialog from './FaturarDialog'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')
const dataHoraBR = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—')
const dataBR = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—')
const num = (n: number) => n.toLocaleString('pt-BR')
const linhaTotal = (i: PedidoItem) => i.valor_total ?? Math.round(i.quantidade * i.valor_unitario * 100) / 100
const m2 = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
const medidasDe = (i: PedidoItem) => {
  if (i.largura && i.altura) {
    const area = Math.round(i.largura * i.altura * 10000) / 10000
    const total = Math.round(area * i.quantidade * 10000) / 10000
    return `Medidas: ${num(i.largura)} × ${num(i.altura)} m = ${m2(area)} m²${i.quantidade > 1 ? ` (total ${m2(total)} m²)` : ''}`
  }
  if (i.largura) return `Comprimento: ${num(i.largura)} m`
  return ''
}
// Até ser aprovado o documento é um Orçamento; depois vira Pedido.
export const nomeDocumento = (status?: string | null) =>
  status === 'aprovado' || status === 'faturado' ? 'Pedido' : 'Orçamento'

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
  const [aviso, setAviso] = useState<string | null>(null)
  const [acaoEmCurso, setAcaoEmCurso] = useState(false)
  const [faturando, setFaturando] = useState(false)

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
  const subtotal = itens.reduce((s, i) => s + Math.round(linhaTotal(i) * 100), 0) / 100
  const totais = calcularTotais(subtotal, pedido.desconto, pedido.desconto_tipo)
  // Total final (com desconto): é o que vai pra fatura e pro financeiro.
  const total = totais.total
  const doc = nomeDocumento(pedido.status)
  const contato = [pedido.cliente_telefone, pedido.cliente_email].filter(Boolean).join(' · ')
  const ped = pedido

  async function gerarReceber() {
    if (acaoEmCurso) return
    setAcaoEmCurso(true)
    setErro(null)
    setAviso(null)
    try {
      await gerarContaReceber({ id: ped.id, cliente_id: ped.cliente_id, numero: ped.numero, total })
      setAviso('Conta a receber gerada no Financeiro.')
    } catch (e) {
      setErro(msg(e))
    } finally {
      setAcaoEmCurso(false)
    }
  }

  async function confirmarFaturamento(forma: string, parcelas: Parcela[]) {
    if (acaoEmCurso) return
    setAcaoEmCurso(true)
    setErro(null)
    setAviso(null)
    try {
      await faturarPedido(ped.id)
      try {
        await lancarRecebimentosPedido({ id: ped.id, cliente_id: ped.cliente_id, numero: ped.numero }, forma, parcelas)
        setAviso('Pedido faturado e lançado no Financeiro.')
      } catch {
        setAviso('Pedido faturado. (Não foi possível lançar no Financeiro — verifique permissão/migração.)')
      }
      setFaturando(false)
      await carregar()
    } catch (e) {
      setErro(msg(e))
    } finally {
      setAcaoEmCurso(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Papel timbrado — aparece apenas na impressão */}
      <header className="print-only mb-4">
        <img src="/timbrado.png" alt={EMPRESA.nome} className="w-full" />
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{doc}{pedido.numero ? ` nº ${formatNumero(pedido.numero)}` : ''}</h1>
          {pedido.fatura_numero ? (
            <div className="text-sm text-gray-600">Fatura nº {formatNumero(pedido.fatura_numero)}</div>
          ) : null}
        </div>
        <span className={`rounded px-3 py-1 text-sm font-medium ${STATUS[status].cls}`}>{STATUS[status].rotulo}</span>
      </div>

      {erro && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800 no-print">{erro}</p>
      )}
      {aviso && (
        <p role="status" className="rounded bg-green-100 px-3 py-2 text-green-800 no-print">{aviso}</p>
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
              <tr className="border-b text-sm text-gray-500">
                <th className="py-2 pr-3 font-medium">Descrição</th>
                <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Qtd</th>
                <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Valor unit.</th>
                <th className="whitespace-nowrap py-2 pl-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => {
                const medidas = medidasDe(i)
                return (
                  <Fragment key={i.id}>
                    <tr className={i.obs ? '' : 'border-b'}>
                      <td className="py-2 pr-3 align-top">
                        <div className="font-medium">{i.descricao}</div>
                        {i.descricao_adicional && <div className="text-sm text-gray-600">{i.descricao_adicional}</div>}
                        {medidas && <div className="text-xs text-gray-500">{medidas}</div>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right align-top">
                        {num(i.quantidade)}{i.unidade ? ` ${i.unidade}` : ''}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right align-top">{formatMoedaBR(i.valor_unitario)}</td>
                      <td className="whitespace-nowrap py-2 pl-3 text-right align-top">{formatMoedaBR(linhaTotal(i))}</td>
                    </tr>
                    {i.obs && (
                      <tr className="border-b">
                        <td colSpan={4} className="pb-3 pr-3 text-sm text-gray-600">
                          <span className="font-medium text-gray-500">Obs: </span>
                          <span>{i.obs}</span>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
            <tfoot>
              {totais.descontoValor > 0 && (
                <>
                  <tr>
                    <td colSpan={3} className="whitespace-nowrap pt-3 pr-3 text-right">Subtotal</td>
                    <td className="whitespace-nowrap pt-3 pl-3 text-right">{formatMoedaBR(totais.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="whitespace-nowrap pr-3 text-right text-red-700">
                      Desconto{pedido.desconto_tipo === 'percentual' ? ` (${num(Number(pedido.desconto))}%)` : ''}
                    </td>
                    <td className="whitespace-nowrap pl-3 text-right text-red-700">− {formatMoedaBR(totais.descontoValor)}</td>
                  </tr>
                </>
              )}
              <tr>
                <td colSpan={3} className="whitespace-nowrap py-3 pr-3 text-right font-medium">Total {doc === 'Orçamento' ? 'do orçamento' : 'do pedido'}</td>
                <td className="whitespace-nowrap py-3 pl-3 text-right font-semibold">{formatMoedaBR(total)}</td>
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
          <button type="button" disabled={acaoEmCurso} onClick={() => setFaturando(true)} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Faturar</button>
        )}
        <Link to={`/app/pedidos/${pedido.id}/editar`} className="rounded border px-4 py-2">Editar</Link>
        <button type="button" disabled={acaoEmCurso} onClick={gerarReceber} className="rounded border px-4 py-2 disabled:opacity-50">Gerar conta a receber</button>
        <button type="button" onClick={() => window.print()} className="rounded border px-4 py-2">Imprimir</button>
        <Link to="/app/pedidos" className="rounded border px-4 py-2">Voltar</Link>
      </div>

      {faturando && (
        <FaturarDialog
          total={total}
          numero={pedido.numero}
          salvando={acaoEmCurso}
          onConfirm={confirmarFaturamento}
          onCancel={() => setFaturando(false)}
        />
      )}
    </div>
  )
}
