import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Cliente, Pedido } from '../../types'
import { parseMoedaBR, formatMoedaBR } from '../../lib/money'
import { listarClientes } from '../clientes/clientes.api'
import { listarPedidos, criarPedido } from './pedidos.api'
import { STATUS, statusDe } from './status'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')

type ItemForm = { descricao: string; quantidade: string; valor: string; obs: string }
const ITEM_VAZIO: ItemForm = { descricao: '', quantidade: '1', valor: '', obs: '' }
type Linha = Pedido & { cliente_nome?: string; total: number }

const parseQtd = (s: string) => {
  const t = s.trim().replace(',', '.')
  return t === '' ? NaN : Number(t)
}
// total do item arredondado a centavos, para evitar erro de ponto flutuante
const totalItem = (i: ItemForm) => {
  const q = parseQtd(i.quantidade)
  const v = parseMoedaBR(i.valor.trim())
  return Number.isNaN(q) || Number.isNaN(v) ? 0 : Math.round(q * v * 100) / 100
}
const dataBR = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}
const contatoDe = (c?: Cliente) => [c?.telefone, c?.email].filter(Boolean).join(' · ')

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Linha[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [clienteId, setClienteId] = useState('')
  const [obs, setObs] = useState('')
  const [prazo, setPrazo] = useState('')
  const [forma, setForma] = useState('')
  const [itens, setItens] = useState<ItemForm[]>([ITEM_VAZIO])
  const [busca, setBusca] = useState('')

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const [p, c] = await Promise.all([listarPedidos(), listarClientes()])
      setPedidos(p)
      setClientes(c)
    } catch (e) {
      setErro(msg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const clienteSel = useMemo(() => clientes.find((c) => c.id === clienteId), [clientes, clienteId])

  const totalPedido = useMemo(
    () => itens.reduce((s, i) => s + Math.round(totalItem(i) * 100), 0) / 100,
    [itens],
  )

  const setItem = (idx: number, k: keyof ItemForm, v: string) =>
    setItens((p) => p.map((it, i) => (i === idx ? { ...it, [k]: v } : it)))

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (salvando) return
    if (!clienteId) return setErro('Selecione o cliente.')
    const out: { descricao: string; quantidade: number; valor_unitario: number; obs?: string }[] = []
    for (let n = 0; n < itens.length; n++) {
      const it = itens[n]
      const descricao = it.descricao.trim()
      const quantidade = parseQtd(it.quantidade)
      const valor = parseMoedaBR(it.valor.trim())
      if (!descricao) return setErro(`Item ${n + 1}: informe a descrição.`)
      if (!(quantidade > 0)) return setErro(`Item ${n + 1}: a quantidade deve ser maior que zero.`)
      if (Number.isNaN(valor)) return setErro(`Item ${n + 1}: valor unitário inválido (ex.: 1.234,56).`)
      out.push({ descricao, quantidade, valor_unitario: valor, ...(it.obs.trim() ? { obs: it.obs.trim() } : {}) })
    }
    if (out.length === 0) return setErro('Adicione ao menos um item.')
    setErro(null)
    setSalvando(true)
    try {
      await criarPedido({
        cliente_id: clienteId,
        obs: obs.trim() || null,
        ...(prazo.trim() ? { prazo_entrega: prazo.trim() } : {}),
        ...(forma.trim() ? { forma_pagamento: forma.trim() } : {}),
        itens: out,
      })
      setClienteId('')
      setObs('')
      setPrazo('')
      setForma('')
      setItens([ITEM_VAZIO])
      await carregar()
    } catch (err) {
      setErro(msg(err))
    } finally {
      setSalvando(false)
    }
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return pedidos
    return pedidos.filter(
      (p) => (p.cliente_nome ?? '').toLowerCase().includes(q) || dataBR(p.data).includes(q) || p.data.includes(q),
    )
  }, [pedidos, busca])

  const campo = 'w-full rounded border border-gray-300 px-3 py-2'
  const bloco = 'rounded-lg border bg-white p-4 space-y-3'
  const tituloBloco = 'font-medium text-gray-900'
  const rotulo = 'text-sm text-gray-500'

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Pedidos</h1>

      {erro && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">
          {erro}
        </p>
      )}

      <form onSubmit={salvar} className="space-y-4">
        <h2 className="font-medium">Novo pedido</h2>

        {/* Bloco 1 — Informações do cliente */}
        <section className={bloco}>
          <h3 className={tituloBloco}>Informações do cliente</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ped-cli" className="block text-sm">Cliente</label>
              <select id="ped-cli" className={campo} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Selecione...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="block text-sm">Data</span>
              <div className="px-3 py-2">{new Date().toLocaleDateString('pt-BR')}</div>
            </div>
            <div>
              <span className={rotulo}>CNPJ/CPF</span>
              <div>{clienteSel?.documento || '—'}</div>
            </div>
            <div>
              <span className={rotulo}>Contato</span>
              <div>{contatoDe(clienteSel) || '—'}</div>
            </div>
            <div className="sm:col-span-2">
              <span className={rotulo}>Endereço</span>
              <div>{clienteSel?.endereco || '—'}</div>
            </div>
          </div>
          {clienteId && (
            <p className="text-xs text-gray-400">
              Estes dados vêm do cadastro do cliente. Para alterá-los, edite o cliente em Cadastro → Clientes.
            </p>
          )}
        </section>

        {/* Bloco 2 — Produtos e Serviços */}
        <section className={bloco}>
          <h3 className={tituloBloco}>Produtos e Serviços</h3>
          {itens.map((it, i) => (
            <div key={i} className="rounded border border-gray-200 p-3 space-y-2">
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto_auto] sm:items-end">
                <div>
                  <label htmlFor={`ped-desc-${i}`} className="block text-sm">Descrição</label>
                  <input id={`ped-desc-${i}`} className={campo} value={it.descricao} onChange={(e) => setItem(i, 'descricao', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`ped-qtd-${i}`} className="block text-sm">Quantidade</label>
                  <input id={`ped-qtd-${i}`} className={campo} inputMode="decimal" value={it.quantidade} onChange={(e) => setItem(i, 'quantidade', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`ped-val-${i}`} className="block text-sm">Valor unitário</label>
                  <input id={`ped-val-${i}`} className={campo} inputMode="decimal" placeholder="0,00" value={it.valor} onChange={(e) => setItem(i, 'valor', e.target.value)} />
                </div>
                <div className="py-2 text-sm">
                  Total: <span data-testid={`total-item-${i}`}>{formatMoedaBR(totalItem(it))}</span>
                </div>
                <div>
                  {itens.length > 1 && (
                    <button type="button" className="text-red-700 underline" aria-label={`Remover item ${i + 1}`} onClick={() => setItens((p) => p.filter((_, j) => j !== i))}>
                      Remover
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor={`ped-item-obs-${i}`} className="block text-sm">Obs</label>
                <input id={`ped-item-obs-${i}`} aria-label={`Observação do item ${i + 1}`} className={campo} value={it.obs} onChange={(e) => setItem(i, 'obs', e.target.value)} />
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="rounded border px-4 py-2" onClick={() => setItens((p) => [...p, ITEM_VAZIO])}>
              Adicionar item
            </button>
            <p className="font-medium">
              Total do pedido: <span data-testid="total-pedido">{formatMoedaBR(totalPedido)}</span>
            </p>
          </div>
        </section>

        {/* Bloco 3 — Informações adicionais */}
        <section className={bloco}>
          <h3 className={tituloBloco}>Informações adicionais</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ped-prazo" className="block text-sm">Prazo de entrega</label>
              <input id="ped-prazo" className={campo} value={prazo} onChange={(e) => setPrazo(e.target.value)} />
            </div>
            <div>
              <label htmlFor="ped-forma" className="block text-sm">Formas de pagamento</label>
              <input id="ped-forma" className={campo} value={forma} onChange={(e) => setForma(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ped-obs" className="block text-sm">Observações</label>
              <input id="ped-obs" className={campo} value={obs} onChange={(e) => setObs(e.target.value)} />
            </div>
          </div>
        </section>

        <button type="submit" disabled={salvando} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">
          Salvar pedido
        </button>
      </form>

      <div>
        <label htmlFor="ped-busca" className="block text-sm">Buscar por cliente ou data</label>
        <input id="ped-busca" className={`${campo} sm:max-w-sm`} value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : filtrados.length === 0 ? (
        !erro && <p>{pedidos.length === 0 ? 'Nenhum pedido cadastrado.' : 'Nenhum pedido encontrado.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Data</th>
                <th>Cliente</th>
                <th>Status</th>
                <th className="text-right">Total</th>
                <th><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const st = statusDe(p.status)
                return (
                  <tr key={p.id} className="border-b">
                    <td className="py-2">{dataBR(p.data)}</td>
                    <td>{p.cliente_nome ?? '—'}</td>
                    <td>
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS[st].cls}`}>{STATUS[st].rotulo}</span>
                    </td>
                    <td className="text-right">{formatMoedaBR(p.total)}</td>
                    <td className="text-right">
                      <Link to={`/app/pedidos/${p.id}`} className="underline">Abrir</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
