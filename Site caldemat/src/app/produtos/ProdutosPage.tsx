import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Produto } from '../../types'
import { UNIDADES } from '../../lib/unidades'
import { parseMoedaBR, formatMoedaBR } from '../../lib/money'
import { listarProdutos, criarProduto, editarProduto, inativarProduto } from './produtos.api'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')

const VAZIO = { nome: '', unidade: UNIDADES[0], valor: '', descricao: '' }
type Form = typeof VAZIO
const opc = (s: string) => (s.trim() === '' ? null : s.trim())

export default function ProdutosPage() {
  const [itens, setItens] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [f, setF] = useState<Form>(VAZIO)
  const [busca, setBusca] = useState('')

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      setItens(await listarProdutos())
    } catch (e) {
      setErro(msg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }))

  function limpar() {
    setEditId(null)
    setF(VAZIO)
  }

  function editar(p: Produto) {
    setEditId(p.id)
    setF({ nome: p.nome, unidade: p.unidade, valor: formatMoedaBR(p.valor_venda).replace('R$', '').trim(), descricao: p.descricao ?? '' })
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (salvando) return
    const nome = f.nome.trim()
    if (!nome) return setErro('Informe o nome do produto.')
    const valor_venda = parseMoedaBR(f.valor.trim())
    if (Number.isNaN(valor_venda) || valor_venda < 0) return setErro('Informe um valor de venda válido (ex.: 120,00).')
    setErro(null)
    setSalvando(true)
    const dados = { nome, unidade: f.unidade, valor_venda, descricao: opc(f.descricao) }
    try {
      if (editId) await editarProduto(editId, dados)
      else await criarProduto(dados)
      limpar()
      await carregar()
    } catch (err) {
      setErro(msg(err))
    } finally {
      setSalvando(false)
    }
  }

  async function inativar(p: Produto) {
    if (!window.confirm(`Inativar "${p.nome}"?`)) return
    setErro(null)
    try {
      await inativarProduto(p.id)
      if (editId === p.id) limpar()
      await carregar()
    } catch (err) {
      setErro(msg(err))
    }
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? itens.filter((p) => p.nome.toLowerCase().includes(q)) : itens
  }, [itens, busca])

  const campo = 'w-full rounded border border-gray-300 px-3 py-2'

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Produtos/Serviços</h1>

      {erro && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">
          {erro}
        </p>
      )}

      <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <div>
          <label htmlFor="prod-nome" className="block text-sm">Nome do produto</label>
          <input id="prod-nome" className={campo} value={f.nome} onChange={set('nome')} />
        </div>
        <div>
          <label htmlFor="prod-unidade" className="block text-sm">Unidade</label>
          <select id="prod-unidade" className={campo} value={f.unidade} onChange={set('unidade')}>
            {UNIDADES.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="prod-valor" className="block text-sm">Valor de venda</label>
          <input id="prod-valor" className={campo} inputMode="decimal" placeholder="0,00" value={f.valor} onChange={set('valor')} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="prod-desc" className="block text-sm">Descrição</label>
          <input id="prod-desc" className={campo} value={f.descricao} onChange={set('descricao')} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={salvando} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">
            Salvar
          </button>
          {editId && (
            <button type="button" className="rounded border px-4 py-2" onClick={limpar}>Cancelar</button>
          )}
        </div>
      </form>

      <div>
        <label htmlFor="prod-busca" className="block text-sm">Buscar por nome</label>
        <input id="prod-busca" className={`${campo} sm:max-w-sm`} value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : filtrados.length === 0 ? (
        !erro && <p>{itens.length === 0 ? 'Nenhum produto cadastrado.' : 'Nenhum produto encontrado.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Nome</th>
                <th>Unidade</th>
                <th className="text-right">Valor de venda</th>
                <th><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2">{p.nome}</td>
                  <td>{p.unidade}</td>
                  <td className="text-right">{formatMoedaBR(p.valor_venda)}</td>
                  <td className="space-x-2 whitespace-nowrap text-right">
                    <button type="button" className="underline" onClick={() => editar(p)}>Editar</button>
                    <button type="button" className="text-red-700 underline" onClick={() => inativar(p)}>Inativar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
