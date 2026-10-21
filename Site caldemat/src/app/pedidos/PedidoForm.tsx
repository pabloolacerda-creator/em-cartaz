import { useMemo, useState, type FormEvent } from 'react'
import type { Cliente } from '../../types'
import { parseMoedaBR, formatMoedaBR } from '../../lib/money'
import type { PedidoInput } from './pedidos.api'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')

export type ItemForm = { descricao: string; quantidade: string; valor: string; obs: string }
export const ITEM_VAZIO: ItemForm = { descricao: '', quantidade: '1', valor: '', obs: '' }

export type PedidoFormValor = {
  cliente_id: string
  obs: string
  prazo_entrega: string
  forma_pagamento: string
  itens: ItemForm[]
}

const VALOR_VAZIO: PedidoFormValor = { cliente_id: '', obs: '', prazo_entrega: '', forma_pagamento: '', itens: [ITEM_VAZIO] }

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
const contatoDe = (c?: Cliente) => [c?.telefone, c?.email].filter(Boolean).join(' · ')

type Props = {
  clientes: Cliente[]
  inicial?: PedidoFormValor
  dataTexto: string
  textoBotao: string
  limparAoSalvar?: boolean
  onSubmit: (input: PedidoInput) => Promise<void>
}

export default function PedidoForm({ clientes, inicial, dataTexto, textoBotao, limparAoSalvar, onSubmit }: Props) {
  const base = inicial ?? VALOR_VAZIO
  const [clienteId, setClienteId] = useState(base.cliente_id)
  const [obs, setObs] = useState(base.obs)
  const [prazo, setPrazo] = useState(base.prazo_entrega)
  const [forma, setForma] = useState(base.forma_pagamento)
  const [itens, setItens] = useState<ItemForm[]>(base.itens.length ? base.itens : [ITEM_VAZIO])
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const clienteSel = useMemo(() => clientes.find((c) => c.id === clienteId), [clientes, clienteId])
  const totalPedido = useMemo(() => itens.reduce((s, i) => s + Math.round(totalItem(i) * 100), 0) / 100, [itens])

  const setItem = (idx: number, k: keyof ItemForm, v: string) =>
    setItens((p) => p.map((it, i) => (i === idx ? { ...it, [k]: v } : it)))

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (salvando) return
    if (!clienteId) return setErro('Selecione o cliente.')
    const out: { descricao: string; quantidade: number; valor_unitario: number; obs: string | null }[] = []
    for (let n = 0; n < itens.length; n++) {
      const it = itens[n]
      const descricao = it.descricao.trim()
      const quantidade = parseQtd(it.quantidade)
      const valor = parseMoedaBR(it.valor.trim())
      if (!descricao) return setErro(`Item ${n + 1}: informe a descrição.`)
      if (!(quantidade > 0)) return setErro(`Item ${n + 1}: a quantidade deve ser maior que zero.`)
      if (Number.isNaN(valor)) return setErro(`Item ${n + 1}: valor unitário inválido (ex.: 1.234,56).`)
      out.push({ descricao, quantidade, valor_unitario: valor, obs: it.obs.trim() || null })
    }
    if (out.length === 0) return setErro('Adicione ao menos um item.')
    setErro(null)
    setSalvando(true)
    try {
      await onSubmit({
        cliente_id: clienteId,
        obs: obs.trim() || null,
        prazo_entrega: prazo.trim() || null,
        forma_pagamento: forma.trim() || null,
        itens: out,
      })
      if (limparAoSalvar) {
        setClienteId('')
        setObs('')
        setPrazo('')
        setForma('')
        setItens([ITEM_VAZIO])
      }
    } catch (err) {
      setErro(msg(err))
    } finally {
      setSalvando(false)
    }
  }

  const campo = 'w-full rounded border border-gray-300 px-3 py-2'
  const bloco = 'rounded-lg border bg-white p-4 space-y-3'
  const tituloBloco = 'font-medium text-gray-900'
  const rotulo = 'text-sm text-gray-500'

  return (
    <form onSubmit={salvar} className="space-y-4">
      {erro && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">
          {erro}
        </p>
      )}

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
            <div className="px-3 py-2">{dataTexto}</div>
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
        {textoBotao}
      </button>
    </form>
  )
}
