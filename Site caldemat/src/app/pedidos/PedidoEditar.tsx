import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Cliente } from '../../types'
import { listarClientes } from '../clientes/clientes.api'
import { obterPedido, editarPedido, type PedidoInput } from './pedidos.api'
import PedidoForm, { type PedidoFormValor } from './PedidoForm'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')
const valorBR = (n: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

export default function PedidoEditar() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [inicial, setInicial] = useState<PedidoFormValor | null>(null)
  const [dataTexto, setDataTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const [{ pedido, itens }, cs] = await Promise.all([obterPedido(id), listarClientes()])
      setClientes(cs)
      setDataTexto(new Date(pedido.data).toLocaleDateString('pt-BR'))
      setInicial({
        cliente_id: pedido.cliente_id,
        obs: pedido.obs ?? '',
        prazo_entrega: pedido.prazo_entrega ?? '',
        forma_pagamento: pedido.forma_pagamento ?? '',
        itens: itens.map((i) => ({
          descricao: i.descricao,
          quantidade: String(i.quantidade),
          valor: valorBR(i.valor_unitario),
          obs: i.obs ?? '',
        })),
      })
    } catch (e) {
      setErro(msg(e))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function salvar(input: PedidoInput) {
    await editarPedido(id, input)
    navigate(`/app/pedidos/${id}`)
  }

  if (loading) return <p>Carregando...</p>
  if (erro || !inicial)
    return (
      <div className="space-y-4">
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">{erro ?? 'Pedido não encontrado.'}</p>
        <Link to="/app/pedidos" className="underline">Voltar</Link>
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Editar pedido</h1>
        <Link to={`/app/pedidos/${id}`} className="rounded border px-4 py-2">Cancelar</Link>
      </div>
      <PedidoForm
        clientes={clientes}
        inicial={inicial}
        dataTexto={dataTexto}
        textoBotao="Salvar alterações"
        onSubmit={salvar}
      />
    </div>
  )
}
