import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { ContaFinanceira } from '../../types'
import { parseMoedaBR, formatMoedaBR } from '../../lib/money'
import { listarContas, criarConta, editarConta, inativarConta } from './financeiro.api'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')

const VAZIO = { nome: '', tipo: 'banco' as 'banco' | 'caixa', saldo: '' }
type Form = typeof VAZIO

export default function ContasPage() {
  const [itens, setItens] = useState<ContaFinanceira[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [f, setF] = useState<Form>(VAZIO)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      setItens(await listarContas())
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
    setF(VAZIO)
  }

  function editar(c: ContaFinanceira) {
    setEditId(c.id)
    setF({ nome: c.nome, tipo: c.tipo, saldo: formatMoedaBR(c.saldo_inicial).replace('R$', '').trim() })
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (salvando) return
    const nome = f.nome.trim()
    if (!nome) return setErro('Informe o nome da conta.')
    const saldo_inicial = parseMoedaBR(f.saldo.trim() || '0')
    if (Number.isNaN(saldo_inicial)) return setErro('Saldo inicial inválido (ex.: 1.000,00).')
    setErro(null)
    setSalvando(true)
    try {
      const dados = { nome, tipo: f.tipo, saldo_inicial }
      if (editId) await editarConta(editId, dados)
      else await criarConta(dados)
      limpar()
      await carregar()
    } catch (err) {
      setErro(msg(err))
    } finally {
      setSalvando(false)
    }
  }

  async function inativar(c: ContaFinanceira) {
    if (!window.confirm(`Inativar a conta "${c.nome}"?`)) return
    try {
      await inativarConta(c.id)
      if (editId === c.id) limpar()
      await carregar()
    } catch (err) {
      setErro(msg(err))
    }
  }

  const campo = 'w-full rounded border border-gray-300 px-3 py-2'

  return (
    <div className="space-y-6">
      {erro && <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">{erro}</p>}

      <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-4 sm:items-end">
        <div>
          <label htmlFor="ct-nome" className="block text-sm">Nome</label>
          <input id="ct-nome" className={campo} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        </div>
        <div>
          <label htmlFor="ct-tipo" className="block text-sm">Tipo</label>
          <select id="ct-tipo" className={campo} value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as 'banco' | 'caixa' })}>
            <option value="banco">Banco</option>
            <option value="caixa">Caixa</option>
          </select>
        </div>
        <div>
          <label htmlFor="ct-saldo" className="block text-sm">Saldo inicial</label>
          <input id="ct-saldo" className={campo} inputMode="decimal" placeholder="0,00" value={f.saldo} onChange={(e) => setF({ ...f, saldo: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={salvando} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Salvar</button>
          {editId && <button type="button" className="rounded border px-4 py-2" onClick={limpar}>Cancelar</button>}
        </div>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : itens.length === 0 ? (
        !erro && <p>Nenhuma conta cadastrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Conta</th>
                <th>Tipo</th>
                <th className="text-right">Saldo atual</th>
                <th><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-2">{c.nome}</td>
                  <td className="capitalize">{c.tipo}</td>
                  <td className="text-right">{formatMoedaBR(c.saldo ?? c.saldo_inicial)}</td>
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
