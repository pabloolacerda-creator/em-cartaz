import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Cliente, Pedido } from '../../types'
import { formatMoedaBR } from '../../lib/money'
import { listarClientes } from '../clientes/clientes.api'
import { listarPedidos, criarPedido, type PedidoInput } from './pedidos.api'
import { STATUS, statusDe } from './status'
import PedidoForm from './PedidoForm'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')

type Linha = Pedido & { cliente_nome?: string; total: number }

const dataBR = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Linha[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
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

  async function criar(input: PedidoInput) {
    await criarPedido(input)
    await carregar()
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return pedidos
    return pedidos.filter(
      (p) => (p.cliente_nome ?? '').toLowerCase().includes(q) || dataBR(p.data).includes(q) || p.data.includes(q),
    )
  }, [pedidos, busca])

  const campo = 'w-full rounded border border-gray-300 px-3 py-2'

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Pedidos</h1>

      {erro && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">
          {erro}
        </p>
      )}

      <div className="space-y-2">
        <h2 className="font-medium">Novo pedido</h2>
        <PedidoForm
          clientes={clientes}
          dataTexto={new Date().toLocaleDateString('pt-BR')}
          textoBotao="Salvar pedido"
          limparAoSalvar
          onSubmit={criar}
        />
      </div>

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
