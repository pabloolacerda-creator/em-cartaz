import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { Material, Movimentacao } from '../../types'
import { listarMateriais } from '../materiais/materiais.api'
import { listarSaldos, registrarMovimentacao, historicoPorMaterial, type Saldo } from './estoque.api'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')
const num = (n: number) => n.toLocaleString('pt-BR')

export default function EstoquePage() {
  const [saldos, setSaldos] = useState<Saldo[]>([])
  const [materiais, setMateriais] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [materialId, setMaterialId] = useState('')
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada')
  const [quantidade, setQuantidade] = useState('')
  const [obs, setObs] = useState('')
  const [histId, setHistId] = useState<string | null>(null)
  const [historico, setHistorico] = useState<Movimentacao[]>([])

  const carregar = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([listarSaldos(), listarMateriais()])
      setSaldos(s)
      setMateriais(m)
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

  const carregarHistorico = useCallback(async (id: string) => {
    try {
      setHistorico(await historicoPorMaterial(id))
    } catch (e) {
      setErro(msg(e))
    }
  }, [])

  async function verHistorico(id: string) {
    setHistId(id)
    setHistorico([])
    await carregarHistorico(id)
  }

  const qtd = Number(quantidade.replace(',', '.'))
  const qtdValida = quantidade.trim() !== '' && Number.isFinite(qtd) && qtd > 0
  const saldoAtual = saldos.find((s) => s.material_id === materialId)?.saldo ?? 0
  const ficaNegativo = tipo === 'saida' && qtdValida && materialId !== '' && qtd > saldoAtual

  async function registrar(e: FormEvent) {
    e.preventDefault()
    if (salvando || !materialId || !qtdValida) return
    if (
      ficaNegativo &&
      !window.confirm('Atenção: o saldo ficará negativo. Deseja registrar a saída mesmo assim?')
    )
      return
    setSalvando(true)
    try {
      await registrarMovimentacao({ material_id: materialId, tipo, quantidade: qtd, obs: obs.trim() || null })
      setQuantidade('')
      setObs('')
      await carregar()
      if (histId === materialId) await carregarHistorico(materialId)
    } catch (err) {
      setErro(msg(err))
    } finally {
      setSalvando(false)
    }
  }

  const campo = 'w-full rounded border border-gray-300 px-3 py-2'
  const histNome = saldos.find((s) => s.material_id === histId)?.nome

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Estoque</h1>

      {erro && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">
          {erro}
        </p>
      )}

      <form onSubmit={registrar} className="grid gap-3 sm:grid-cols-5 sm:items-end">
        <div>
          <label htmlFor="mov-material" className="block text-sm">Material</label>
          <select id="mov-material" className={campo} required value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
            <option value="">Selecione</option>
            {materiais.map((m) => (
              <option key={m.id} value={m.id}>{m.nome} ({m.unidade})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mov-tipo" className="block text-sm">Tipo</label>
          <select id="mov-tipo" className={campo} value={tipo} onChange={(e) => setTipo(e.target.value as 'entrada' | 'saida')}>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>
        <div>
          <label htmlFor="mov-qtd" className="block text-sm">Quantidade</label>
          <input id="mov-qtd" className={campo} type="number" min="0" step="any" required value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        </div>
        <div>
          <label htmlFor="mov-obs" className="block text-sm">Observação</label>
          <input id="mov-obs" className={campo} value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>
        <div>
          <button type="submit" disabled={salvando} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">
            Registrar
          </button>
        </div>
        {ficaNegativo && (
          <p role="status" className="rounded bg-yellow-100 px-3 py-2 text-yellow-900 sm:col-span-5">
            Atenção: o saldo ficará negativo (saldo atual: {num(saldoAtual)}). Você ainda pode registrar.
          </p>
        )}
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : saldos.length === 0 ? (
        !erro && <p>Nenhum material em estoque.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Material</th>
                <th>Unidade</th>
                <th>Saldo</th>
                <th><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {saldos.map((s) => (
                <tr key={s.material_id} className={`border-b ${s.saldo < 0 ? 'bg-red-100 text-red-800' : ''}`}>
                  <td className="py-2">{s.nome}</td>
                  <td>{s.unidade}</td>
                  <td>{num(s.saldo)}</td>
                  <td className="text-right">
                    <button type="button" className="underline" onClick={() => verHistorico(s.material_id)}>
                      Histórico
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {histId && (
        <section aria-label="Histórico" className="space-y-2">
          <h2 className="font-semibold">Histórico: {histNome}</h2>
          {historico.length === 0 ? (
            !erro && <p>Nenhuma movimentação.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Data</th>
                    <th>Tipo</th>
                    <th>Quantidade</th>
                    <th>Obs</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((h) => (
                    <tr key={h.id} className="border-b">
                      <td className="py-2">{new Date(h.data).toLocaleString('pt-BR')}</td>
                      <td>{h.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
                      <td>{num(h.quantidade)}</td>
                      <td>{h.obs ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
