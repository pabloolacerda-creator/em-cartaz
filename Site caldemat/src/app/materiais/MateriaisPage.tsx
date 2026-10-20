import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { Material } from '../../types'
import { listarMateriais, criarMaterial, editarMaterial, inativarMaterial } from './materiais.api'

const UNIDADES = ['kg', 'metro', 'peça', 'barra']

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')

export default function MateriaisPage() {
  const [itens, setItens] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [unidade, setUnidade] = useState('')
  const [minimo, setMinimo] = useState('')

  const carregar = useCallback(async () => {
    try {
      setItens(await listarMateriais())
      setErro(null)
    } catch (e) {
      setErro(msg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  function limpar() {
    setEditId(null)
    setNome('')
    setUnidade('')
    setMinimo('')
  }

  function editar(m: Material) {
    setEditId(m.id)
    setNome(m.nome)
    setUnidade(m.unidade)
    setMinimo(m.estoque_minimo == null ? '' : String(m.estoque_minimo))
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const estoque_minimo = minimo.trim() === '' ? null : Number(minimo.replace(',', '.'))
    try {
      if (editId) {
        await editarMaterial(editId, { nome: nome.trim(), unidade, estoque_minimo })
      } else {
        const novo: { nome: string; unidade: string; estoque_minimo?: number | null } = { nome: nome.trim(), unidade }
        if (estoque_minimo != null) novo.estoque_minimo = estoque_minimo
        await criarMaterial(novo)
      }
      limpar()
      await carregar()
    } catch (err) {
      setErro(msg(err))
    }
  }

  async function inativar(m: Material) {
    if (!window.confirm(`Inativar "${m.nome}"?`)) return
    try {
      await inativarMaterial(m.id)
      if (editId === m.id) limpar()
      await carregar()
    } catch (err) {
      setErro(msg(err))
    }
  }

  const campo = 'w-full rounded border border-gray-300 px-3 py-2'

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Matéria-Prima</h1>

      {erro && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">
          {erro}
        </p>
      )}

      <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-4 sm:items-end">
        <div>
          <label htmlFor="mat-nome" className="block text-sm">Nome</label>
          <input id="mat-nome" className={campo} required value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label htmlFor="mat-un" className="block text-sm">Unidade</label>
          <select id="mat-un" className={campo} required value={unidade} onChange={(e) => setUnidade(e.target.value)}>
            <option value="">Selecione</option>
            {UNIDADES.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mat-min" className="block text-sm">Estoque mínimo</label>
          <input id="mat-min" className={campo} type="number" min="0" step="any" value={minimo} onChange={(e) => setMinimo(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-white">Salvar</button>
          {editId && (
            <button type="button" className="rounded border px-4 py-2" onClick={limpar}>Cancelar</button>
          )}
        </div>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : itens.length === 0 ? (
        <p>Nenhuma matéria-prima cadastrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Nome</th>
                <th>Unidade</th>
                <th>Estoque mínimo</th>
                <th><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="py-2">{m.nome}</td>
                  <td>{m.unidade}</td>
                  <td>{m.estoque_minimo == null ? '—' : m.estoque_minimo.toLocaleString('pt-BR')}</td>
                  <td className="space-x-2 whitespace-nowrap text-right">
                    <button type="button" className="underline" onClick={() => editar(m)}>Editar</button>
                    <button type="button" className="text-red-700 underline" onClick={() => inativar(m)}>Inativar</button>
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
