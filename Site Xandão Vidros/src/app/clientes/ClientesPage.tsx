import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { Cliente } from '../../types'
import { listarClientes, criarCliente, editarCliente, inativarCliente } from './clientes.api'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')

const VAZIO = { nome: '', documento: '', telefone: '', email: '', endereco: '', obs: '' }
type Form = typeof VAZIO

const opc = (s: string) => (s.trim() === '' ? null : s.trim())

export default function ClientesPage() {
  const [itens, setItens] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [f, setF] = useState<Form>(VAZIO)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      setItens(await listarClientes())
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

  function editar(c: Cliente) {
    setEditId(c.id)
    setF({
      nome: c.nome,
      documento: c.documento ?? '',
      telefone: c.telefone ?? '',
      email: c.email ?? '',
      endereco: c.endereco ?? '',
      obs: c.obs ?? '',
    })
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (salvando) return
    const nome = f.nome.trim()
    if (!nome) {
      setErro('Informe o nome do cliente.')
      return
    }
    setErro(null)
    setSalvando(true)
    const dados = {
      nome,
      documento: opc(f.documento),
      telefone: opc(f.telefone),
      email: opc(f.email),
      endereco: opc(f.endereco),
      obs: opc(f.obs),
    }
    try {
      if (editId) await editarCliente(editId, dados)
      else await criarCliente(dados)
      limpar()
      await carregar()
    } catch (err) {
      setErro(msg(err))
    } finally {
      setSalvando(false)
    }
  }

  async function inativar(c: Cliente) {
    if (!window.confirm(`Inativar "${c.nome}"?`)) return
    setErro(null)
    try {
      await inativarCliente(c.id)
      if (editId === c.id) limpar()
      await carregar()
    } catch (err) {
      setErro(msg(err))
    }
  }

  const campo = 'w-full rounded border border-gray-300 px-3 py-2'

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Clientes</h1>

      {erro && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">
          {erro}
        </p>
      )}

      <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <div>
          <label htmlFor="cli-nome" className="block text-sm">Nome</label>
          <input id="cli-nome" className={campo} value={f.nome} onChange={set('nome')} />
        </div>
        <div>
          <label htmlFor="cli-doc" className="block text-sm">Documento</label>
          <input id="cli-doc" className={campo} value={f.documento} onChange={set('documento')} />
        </div>
        <div>
          <label htmlFor="cli-tel" className="block text-sm">Telefone</label>
          <input id="cli-tel" className={campo} type="tel" value={f.telefone} onChange={set('telefone')} />
        </div>
        <div>
          <label htmlFor="cli-email" className="block text-sm">E-mail</label>
          <input id="cli-email" className={campo} type="email" value={f.email} onChange={set('email')} />
        </div>
        <div>
          <label htmlFor="cli-end" className="block text-sm">Endereço</label>
          <input id="cli-end" className={campo} value={f.endereco} onChange={set('endereco')} />
        </div>
        <div>
          <label htmlFor="cli-obs" className="block text-sm">Observações</label>
          <input id="cli-obs" className={campo} value={f.obs} onChange={set('obs')} />
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

      {loading ? (
        <p>Carregando...</p>
      ) : itens.length === 0 ? (
        !erro && <p>Nenhum cliente cadastrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Nome</th>
                <th>Telefone</th>
                <th>Documento</th>
                <th><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-2">{c.nome}</td>
                  <td>{c.telefone ?? '—'}</td>
                  <td>{c.documento ?? '—'}</td>
                  <td className="space-x-2 whitespace-nowrap text-right">
                    <button type="button" className="underline" onClick={() => editar(c)}>Editar</button>
                    <button type="button" className="text-red-700 underline" onClick={() => inativar(c)}>Inativar</button>
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
