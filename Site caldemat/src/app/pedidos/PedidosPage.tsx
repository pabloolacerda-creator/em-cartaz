import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Cliente, Pedido, Produto } from '../../types'
import { formatMoedaBR } from '../../lib/money'
import { formatNumero } from '../../lib/numero'
import { dentroDoPeriodo, type Periodo } from '../../lib/periodo'
import { listarClientes } from '../clientes/clientes.api'
import { listarProdutos } from '../produtos/produtos.api'
import { listarPedidos, criarPedido, listarUsuariosNomes, type PedidoInput } from './pedidos.api'
import { STATUS, statusDe } from './status'
import PedidoForm from './PedidoForm'
import FiltroPeriodo from '../comum/FiltroPeriodo'
import RelatorioCabecalho from '../comum/RelatorioCabecalho'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')

type Linha = Pedido & { cliente_nome?: string; total: number; descricoes?: string }

const dataBR = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Linha[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Filtros
  const [fCliente, setFCliente] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [fEmitidoPor, setFEmitidoPor] = useState('')
  const [fNumero, setFNumero] = useState('')
  const [periodo, setPeriodo] = useState<Periodo>({ de: null, ate: null })

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const [p, c] = await Promise.all([listarPedidos(), listarClientes()])
      setPedidos(p)
      setClientes(c)
      // tolerantes a falha (ex.: migração ainda não aplicada)
      try { setProdutos(await listarProdutos()) } catch { setProdutos([]) }
      try { setUsuarios(await listarUsuariosNomes()) } catch { setUsuarios([]) }
    } catch (e) {
      setErro(msg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function criar(input: PedidoInput) {
    await criarPedido(input)
    await carregar()
  }

  const nomePorId = useMemo(() => new Map(usuarios.map((u) => [u.id, u.nome])), [usuarios])
  const emissor = (p: Linha) => (p.usuario_id ? nomePorId.get(p.usuario_id) ?? '—' : '—')

  const filtrados = useMemo(() => {
    const desc = fDesc.trim().toLowerCase()
    const numero = fNumero.trim()
    return pedidos.filter((p) => {
      if (fCliente && p.cliente_id !== fCliente) return false
      if (desc && !(p.descricoes ?? '').toLowerCase().includes(desc)) return false
      if (fEmitidoPor && p.usuario_id !== fEmitidoPor) return false
      if (numero && !formatNumero(p.numero).includes(numero) && !String(p.numero ?? '').includes(numero)) return false
      if (!dentroDoPeriodo(p.data, periodo)) return false
      return true
    })
  }, [pedidos, fCliente, fDesc, fEmitidoPor, fNumero, periodo])

  function limparFiltros() {
    setFCliente('')
    setFDesc('')
    setFEmitidoPor('')
    setFNumero('')
    setPeriodo({ de: null, ate: null })
  }

  const periodoTexto = periodo.de || periodo.ate ? `Período: ${periodo.de ? dataBR(periodo.de) : '...'} a ${periodo.ate ? dataBR(periodo.ate) : '...'}` : 'Todos os períodos'
  const campo = 'w-full rounded border border-gray-300 px-3 py-2'

  return (
    <div className="space-y-6">
      <RelatorioCabecalho titulo="Relatório de Pedidos" subtitulo={periodoTexto} />
      <h1 className="text-xl font-semibold no-print">Pedidos</h1>

      {erro && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800 no-print">{erro}</p>
      )}

      <div className="space-y-2 no-print">
        <h2 className="font-medium">Novo pedido</h2>
        <PedidoForm
          clientes={clientes}
          produtos={produtos}
          dataTexto={new Date().toLocaleDateString('pt-BR')}
          textoBotao="Salvar pedido"
          limparAoSalvar
          onSubmit={criar}
        />
      </div>

      {/* Filtros */}
      <div className="space-y-3 rounded-lg border bg-white p-4 no-print">
        <h2 className="font-medium">Filtros</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="f-cli" className="block text-sm">Filtrar por cliente</label>
            <select id="f-cli" className={campo} value={fCliente} onChange={(e) => setFCliente(e.target.value)}>
              <option value="">Todos</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-desc" className="block text-sm">Parte da descrição</label>
            <input id="f-desc" className={campo} value={fDesc} onChange={(e) => setFDesc(e.target.value)} />
          </div>
          <div>
            <label htmlFor="f-emit" className="block text-sm">Emitido por</label>
            <select id="f-emit" className={campo} value={fEmitidoPor} onChange={(e) => setFEmitidoPor(e.target.value)}>
              <option value="">Todos</option>
              {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-num" className="block text-sm">Nº do pedido</label>
            <input id="f-num" className={campo} value={fNumero} onChange={(e) => setFNumero(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <FiltroPeriodo label="Data de emissão" value={periodo} onChange={setPeriodo} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded bg-gray-900 px-4 py-2 text-white" onClick={() => window.print()}>Imprimir relatório</button>
          <button type="button" className="rounded border px-4 py-2" onClick={limparFiltros}>Limpar filtros</button>
        </div>
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
                <th className="py-2">Nº</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Emitido por</th>
                <th>Status</th>
                <th className="text-right">Total</th>
                <th className="no-print"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const st = statusDe(p.status)
                return (
                  <tr key={p.id} className="border-b">
                    <td className="py-2">{formatNumero(p.numero) || '—'}</td>
                    <td>{dataBR(p.data)}</td>
                    <td>{p.cliente_nome ?? '—'}</td>
                    <td>{emissor(p)}</td>
                    <td>
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS[st].cls}`}>{STATUS[st].rotulo}</span>
                    </td>
                    <td className="text-right">{formatMoedaBR(p.total)}</td>
                    <td className="text-right no-print">
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
