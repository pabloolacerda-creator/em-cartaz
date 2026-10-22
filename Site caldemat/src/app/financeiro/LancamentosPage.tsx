import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Cliente, ContaFinanceira, Lancamento } from '../../types'
import { parseMoedaBR, formatMoedaBR } from '../../lib/money'
import { listarClientes } from '../clientes/clientes.api'
import { listarLancamentos, criarLancamento, marcarPago, excluirLancamento, listarContas, type LancamentoInput } from './financeiro.api'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')
const hojeISO = () => new Date().toISOString().slice(0, 10)
const dataBR = (iso?: string | null) => {
  if (!iso) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

const VAZIO = {
  tipo: 'despesa' as 'receita' | 'despesa',
  descricao: '', valor: '', vencimento: hojeISO(),
  categoria: '', fornecedor: '', cliente_id: '', conta_id: '', obs: '',
}
type Form = typeof VAZIO
type Filtro = 'todos' | 'pagar' | 'receber' | 'vencidos'
const opc = (s: string) => (s.trim() === '' ? null : s.trim())

export default function LancamentosPage() {
  const [itens, setItens] = useState<Lancamento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [contas, setContas] = useState<ContaFinanceira[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [f, setF] = useState<Form>(VAZIO)
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const [l, c, ct] = await Promise.all([listarLancamentos(), listarClientes(), listarContas()])
      setItens(l)
      setClientes(c)
      setContas(ct)
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

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (salvando) return
    const descricao = f.descricao.trim()
    if (!descricao) return setErro('Informe a descrição.')
    const valor = parseMoedaBR(f.valor.trim())
    if (Number.isNaN(valor) || valor <= 0) return setErro('Informe um valor válido maior que zero.')
    if (!f.vencimento) return setErro('Informe o vencimento.')
    setErro(null)
    setSalvando(true)
    const dados: LancamentoInput = {
      tipo: f.tipo, descricao, valor, vencimento: f.vencimento,
      categoria: opc(f.categoria), fornecedor: opc(f.fornecedor),
      cliente_id: f.cliente_id || null, conta_id: f.conta_id || null, obs: opc(f.obs),
    }
    try {
      await criarLancamento(dados)
      setF({ ...VAZIO, tipo: f.tipo, vencimento: hojeISO() })
      await carregar()
    } catch (err) {
      setErro(msg(err))
    } finally {
      setSalvando(false)
    }
  }

  async function baixar(l: Lancamento) {
    const conta = l.conta_id ?? contas[0]?.id ?? null
    if (!conta) return setErro('Cadastre uma conta antes de dar baixa (pagar/receber).')
    try {
      await marcarPago(l.id, hojeISO(), conta)
      await carregar()
    } catch (err) {
      setErro(msg(err))
    }
  }

  async function excluir(l: Lancamento) {
    if (!window.confirm(`Excluir "${l.descricao}"?`)) return
    try {
      await excluirLancamento(l.id)
      await carregar()
    } catch (err) {
      setErro(msg(err))
    }
  }

  const filtrados = useMemo(() => {
    const hoje = hojeISO()
    return itens.filter((l) => {
      if (filtro === 'pagar') return l.tipo === 'despesa' && !l.pago_em
      if (filtro === 'receber') return l.tipo === 'receita' && !l.pago_em
      if (filtro === 'vencidos') return !l.pago_em && l.vencimento < hoje
      return true
    })
  }, [itens, filtro])

  const campo = 'w-full rounded border border-gray-300 px-3 py-2'
  const btnFiltro = (chave: Filtro, rotulo: string) => (
    <button
      type="button"
      onClick={() => setFiltro(chave)}
      className={`rounded px-3 py-1 text-sm ${filtro === chave ? 'bg-gray-900 text-white' : 'border hover:bg-gray-100'}`}
    >
      {rotulo}
    </button>
  )

  return (
    <div className="space-y-6">
      {erro && <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">{erro}</p>}

      <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <div>
          <label htmlFor="lc-tipo" className="block text-sm">Tipo</label>
          <select id="lc-tipo" className={campo} value={f.tipo} onChange={set('tipo')}>
            <option value="despesa">Despesa (a pagar)</option>
            <option value="receita">Receita (a receber)</option>
          </select>
        </div>
        <div>
          <label htmlFor="lc-desc" className="block text-sm">Descrição</label>
          <input id="lc-desc" className={campo} value={f.descricao} onChange={set('descricao')} />
        </div>
        <div>
          <label htmlFor="lc-valor" className="block text-sm">Valor</label>
          <input id="lc-valor" className={campo} inputMode="decimal" placeholder="0,00" value={f.valor} onChange={set('valor')} />
        </div>
        <div>
          <label htmlFor="lc-venc" className="block text-sm">Vencimento</label>
          <input id="lc-venc" type="date" className={campo} value={f.vencimento} onChange={set('vencimento')} />
        </div>
        <div>
          <label htmlFor="lc-cat" className="block text-sm">Categoria</label>
          <input id="lc-cat" className={campo} value={f.categoria} onChange={set('categoria')} />
        </div>
        <div>
          <label htmlFor="lc-conta" className="block text-sm">Conta</label>
          <select id="lc-conta" className={campo} value={f.conta_id} onChange={set('conta_id')}>
            <option value="">—</option>
            {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="lc-cli" className="block text-sm">Cliente</label>
          <select id="lc-cli" className={campo} value={f.cliente_id} onChange={set('cliente_id')}>
            <option value="">—</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="lc-forn" className="block text-sm">Fornecedor</label>
          <input id="lc-forn" className={campo} value={f.fornecedor} onChange={set('fornecedor')} />
        </div>
        <div>
          <button type="submit" disabled={salvando} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Salvar</button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        {btnFiltro('todos', 'Todos')}
        {btnFiltro('pagar', 'A pagar')}
        {btnFiltro('receber', 'A receber')}
        {btnFiltro('vencidos', 'Vencidos')}
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : filtrados.length === 0 ? (
        !erro && <p>Nenhum lançamento.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Vencimento</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th className="text-right">Valor</th>
                <th>Situação</th>
                <th><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((l) => {
                const vencido = !l.pago_em && l.vencimento < hojeISO()
                return (
                  <tr key={l.id} className="border-b">
                    <td className={`py-2 ${vencido ? 'font-medium text-red-700' : ''}`}>{dataBR(l.vencimento)}</td>
                    <td>{l.descricao}</td>
                    <td className={l.tipo === 'receita' ? 'text-green-700' : 'text-red-700'}>{l.tipo === 'receita' ? 'Receita' : 'Despesa'}</td>
                    <td className="text-right">{formatMoedaBR(l.valor)}</td>
                    <td>{l.pago_em ? `Pago ${dataBR(l.pago_em)}` : vencido ? 'Vencido' : 'Em aberto'}</td>
                    <td className="space-x-2 whitespace-nowrap text-right">
                      {!l.pago_em && <button type="button" className="underline" onClick={() => baixar(l)}>Baixar</button>}
                      <button type="button" className="text-red-700 underline" onClick={() => excluir(l)}>Excluir</button>
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
