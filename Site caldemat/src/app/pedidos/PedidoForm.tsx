import { useMemo, useState, type FormEvent } from 'react'
import type { Cliente, Produto } from '../../types'
import { parseMoedaBR, formatMoedaBR } from '../../lib/money'
import { modoMedida, calcularValorItem } from './calculo'
import type { ItemInput, PedidoInput } from './pedidos.api'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')

// produto_id vazio = item de descrição livre (preço e descrição digitados à mão).
export type ItemForm = {
  produto_id: string
  descricao: string
  descricao_adicional: string
  quantidade: string
  valor: string
  largura: string
  altura: string
  obs: string
}
export const ITEM_VAZIO: ItemForm = {
  produto_id: '', descricao: '', descricao_adicional: '', quantidade: '1', valor: '', largura: '', altura: '', obs: '',
}

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
const parseMedida = (s: string) => {
  const t = s.trim().replace(',', '.')
  return t === '' ? NaN : Number(t)
}
const medidaOuNulo = (s: string) => {
  const v = parseMedida(s)
  return Number.isNaN(v) ? null : v
}
const contatoDe = (c?: Cliente) => [c?.telefone, c?.email].filter(Boolean).join(' · ')

type Props = {
  clientes: Cliente[]
  produtos: Produto[]
  inicial?: PedidoFormValor
  dataTexto: string
  textoBotao: string
  limparAoSalvar?: boolean
  onSubmit: (input: PedidoInput) => Promise<void>
}

export default function PedidoForm({ clientes, produtos, inicial, dataTexto, textoBotao, limparAoSalvar, onSubmit }: Props) {
  const base = inicial ?? VALOR_VAZIO
  const [clienteId, setClienteId] = useState(base.cliente_id)
  const [obs, setObs] = useState(base.obs)
  const [prazo, setPrazo] = useState(base.prazo_entrega)
  const [forma, setForma] = useState(base.forma_pagamento)
  const [itens, setItens] = useState<ItemForm[]>(base.itens.length ? base.itens : [ITEM_VAZIO])
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const clienteSel = useMemo(() => clientes.find((c) => c.id === clienteId), [clientes, clienteId])
  const produtoDe = (it: ItemForm) => produtos.find((p) => p.id === it.produto_id)

  const totalItem = (it: ItemForm): number => {
    const prod = produtoDe(it)
    if (it.produto_id && prod) {
      return calcularValorItem(prod.unidade, parseQtd(it.quantidade), parseMedida(it.largura), parseMedida(it.altura), prod.valor_venda)
    }
    const q = parseQtd(it.quantidade)
    const v = parseMoedaBR(it.valor.trim())
    return Number.isNaN(q) || Number.isNaN(v) ? 0 : Math.round(q * v * 100) / 100
  }
  const totalPedido = useMemo(
    () => itens.reduce((s, it) => s + Math.round(totalItem(it) * 100), 0) / 100,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itens, produtos],
  )

  const setItem = (idx: number, k: keyof ItemForm, v: string) =>
    setItens((p) => p.map((it, i) => (i === idx ? { ...it, [k]: v } : it)))

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (salvando) return
    if (!clienteId) return setErro('Selecione o cliente.')
    const out: ItemInput[] = []
    for (let n = 0; n < itens.length; n++) {
      const it = itens[n]
      const quantidade = parseQtd(it.quantidade)
      if (!(quantidade > 0)) return setErro(`Item ${n + 1}: a quantidade deve ser maior que zero.`)
      if (it.produto_id) {
        const prod = produtoDe(it)
        if (!prod) return setErro(`Item ${n + 1}: selecione um produto válido.`)
        const modo = modoMedida(prod.unidade)
        const largura = medidaOuNulo(it.largura)
        const altura = medidaOuNulo(it.altura)
        if (modo === 'area' && (!(largura! > 0) || !(altura! > 0))) return setErro(`Item ${n + 1}: informe largura e altura.`)
        if (modo === 'linear' && !(largura! > 0)) return setErro(`Item ${n + 1}: informe o comprimento.`)
        const item: ItemInput = {
          descricao: prod.nome,
          quantidade,
          valor_unitario: prod.valor_venda,
          produto_id: it.produto_id,
          descricao_adicional: it.descricao_adicional.trim() || null,
          obs: it.obs.trim() || null,
        }
        if (modo === 'area') {
          item.largura = largura
          item.altura = altura
        } else if (modo === 'linear') {
          item.largura = largura
        }
        out.push(item)
      } else {
        const descricao = it.descricao.trim()
        const valor = parseMoedaBR(it.valor.trim())
        if (!descricao) return setErro(`Item ${n + 1}: informe a descrição.`)
        if (Number.isNaN(valor)) return setErro(`Item ${n + 1}: valor unitário inválido (ex.: 1.234,56).`)
        out.push({ descricao, quantidade, valor_unitario: valor, obs: it.obs.trim() || null })
      }
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
  const campoRO = 'w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600'
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
        {itens.map((it, i) => {
          const prod = produtoDe(it)
          const modo = prod ? modoMedida(prod.unidade) : null
          return (
            <div key={i} className="rounded border border-gray-200 p-3 space-y-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`ped-prod-${i}`} className="block text-sm">Produto/serviço</label>
                  <select id={`ped-prod-${i}`} className={campo} value={it.produto_id} onChange={(e) => setItem(i, 'produto_id', e.target.value)}>
                    <option value="">— Descrição livre —</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                {it.produto_id ? (
                  <div>
                    <label htmlFor={`ped-descadic-${i}`} className="block text-sm">Descrição adicional</label>
                    <input id={`ped-descadic-${i}`} className={campo} value={it.descricao_adicional} onChange={(e) => setItem(i, 'descricao_adicional', e.target.value)} />
                  </div>
                ) : (
                  <div>
                    <label htmlFor={`ped-desc-${i}`} className="block text-sm">Descrição</label>
                    <input id={`ped-desc-${i}`} className={campo} value={it.descricao} onChange={(e) => setItem(i, 'descricao', e.target.value)} />
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto] sm:items-end">
                {modo === 'area' && (
                  <>
                    <div>
                      <label htmlFor={`ped-larg-${i}`} className="block text-sm">Largura (m)</label>
                      <input id={`ped-larg-${i}`} className={campo} inputMode="decimal" value={it.largura} onChange={(e) => setItem(i, 'largura', e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor={`ped-alt-${i}`} className="block text-sm">Altura (m)</label>
                      <input id={`ped-alt-${i}`} className={campo} inputMode="decimal" value={it.altura} onChange={(e) => setItem(i, 'altura', e.target.value)} />
                    </div>
                  </>
                )}
                {modo === 'linear' && (
                  <div>
                    <label htmlFor={`ped-comp-${i}`} className="block text-sm">Comprimento (m)</label>
                    <input id={`ped-comp-${i}`} className={campo} inputMode="decimal" value={it.largura} onChange={(e) => setItem(i, 'largura', e.target.value)} />
                  </div>
                )}
                <div>
                  <label htmlFor={`ped-qtd-${i}`} className="block text-sm">Quantidade</label>
                  <input id={`ped-qtd-${i}`} className={campo} inputMode="decimal" value={it.quantidade} onChange={(e) => setItem(i, 'quantidade', e.target.value)} />
                </div>
                {it.produto_id ? (
                  <div>
                    <span className="block text-sm">{prod && modoMedida(prod.unidade) === 'area' ? 'Valor do m²' : 'Valor unitário'}</span>
                    <div className={campoRO}>{prod ? formatMoedaBR(prod.valor_venda) : '—'}</div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor={`ped-val-${i}`} className="block text-sm">Valor unitário</label>
                    <input id={`ped-val-${i}`} className={campo} inputMode="decimal" placeholder="0,00" value={it.valor} onChange={(e) => setItem(i, 'valor', e.target.value)} />
                  </div>
                )}
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
          )
        })}

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
