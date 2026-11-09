import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Material } from '../../types'
import { listarMateriais, criarMaterial, editarMaterial, inativarMaterial, type MaterialInput } from './materiais.api'
import { UNIDADES } from '../../lib/unidades'

const FORMAS = ['Chapa', 'Tubo', 'Barra', 'Cantoneira', 'Perfil', 'Outro']

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')

// Campos de texto e numéricos opcionais (técnicos).
const TEXTOS = ['forma', 'norma_tecnica', 'grau_liga', 'acabamento', 'propriedades'] as const
const NUMEROS = ['espessura', 'largura', 'comprimento', 'diametro_externo', 'espessura_parede'] as const

type Campos = Record<(typeof TEXTOS)[number] | (typeof NUMEROS)[number], string>
const VAZIO: Campos = {
  forma: '', norma_tecnica: '', grau_liga: '', acabamento: '', propriedades: '',
  espessura: '', largura: '', comprimento: '', diametro_externo: '', espessura_parede: '',
}

const numero = (s: string): number | null => {
  const v = s.trim()
  if (v === '') return null
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export default function MateriaisPage() {
  const [itens, setItens] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [codigo, setCodigo] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [unidade, setUnidade] = useState('')
  const [minimo, setMinimo] = useState('')
  const [tec, setTec] = useState<Campos>(VAZIO)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('')

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
    setCodigo(null)
    setNome('')
    setUnidade('')
    setMinimo('')
    setTec(VAZIO)
  }

  function editar(m: Material) {
    setEditId(m.id)
    setCodigo(m.codigo ?? null)
    setNome(m.nome)
    setUnidade(m.unidade)
    setMinimo(m.estoque_minimo == null ? '' : String(m.estoque_minimo))
    setTec({
      forma: m.forma ?? '', norma_tecnica: m.norma_tecnica ?? '', grau_liga: m.grau_liga ?? '',
      acabamento: m.acabamento ?? '', propriedades: m.propriedades ?? '',
      espessura: m.espessura == null ? '' : String(m.espessura),
      largura: m.largura == null ? '' : String(m.largura),
      comprimento: m.comprimento == null ? '' : String(m.comprimento),
      diametro_externo: m.diametro_externo == null ? '' : String(m.diametro_externo),
      espessura_parede: m.espessura_parede == null ? '' : String(m.espessura_parede),
    })
  }

  // Monta o payload incluindo apenas os campos técnicos preenchidos.
  function montarTecnicos(): Partial<MaterialInput> {
    const p: Record<string, string | number> = {}
    for (const k of TEXTOS) {
      const v = tec[k].trim()
      if (v !== '') p[k] = v
    }
    for (const k of NUMEROS) {
      const n = numero(tec[k])
      if (n != null) p[k] = n
    }
    return p as Partial<MaterialInput>
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setErro('Informe o nome.')
      return
    }
    const estoque_minimo = minimo.trim() === '' ? null : numero(minimo)
    const tecnicos = montarTecnicos()
    try {
      if (editId) {
        await editarMaterial(editId, { nome: nome.trim(), unidade, estoque_minimo, ...tecnicos })
      } else {
        const novo: MaterialInput = { nome: nome.trim(), unidade, ...tecnicos }
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

  const filtrados = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    if (!q) return itens
    return itens.filter((m) =>
      [m.codigo, m.nome, m.forma, m.norma_tecnica, m.grau_liga, m.acabamento, m.unidade]
        .filter((v) => v != null)
        .some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [itens, filtro])

  const campo = 'w-full rounded border border-gray-300 px-3 py-2'
  const num = (k: (typeof NUMEROS)[number], rotulo: string) => (
    <div>
      <label htmlFor={`mat-${k}`} className="block text-sm">{rotulo}</label>
      <input id={`mat-${k}`} className={campo} type="number" min="0" step="any" value={tec[k]} onChange={(e) => setTec({ ...tec, [k]: e.target.value })} />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Matéria-Prima</h1>

      {erro && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">
          {erro}
        </p>
      )}

      <form onSubmit={salvar} className="space-y-4 rounded-lg border bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-sm">Número</label>
            <input className={`${campo} bg-gray-100 text-gray-600`} value={codigo != null ? String(codigo) : 'Automático'} readOnly />
          </div>
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
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor="mat-forma" className="block text-sm">Forma do material</label>
            <select id="mat-forma" className={campo} value={tec.forma} onChange={(e) => setTec({ ...tec, forma: e.target.value })}>
              <option value="">Selecione</option>
              {FORMAS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mat-norma" className="block text-sm">Norma técnica</label>
            <input id="mat-norma" className={campo} value={tec.norma_tecnica} onChange={(e) => setTec({ ...tec, norma_tecnica: e.target.value })} />
          </div>
          <div>
            <label htmlFor="mat-grau" className="block text-sm">Grau / liga</label>
            <input id="mat-grau" className={campo} value={tec.grau_liga} onChange={(e) => setTec({ ...tec, grau_liga: e.target.value })} />
          </div>
          <div>
            <label htmlFor="mat-acab" className="block text-sm">Acabamento</label>
            <input id="mat-acab" className={campo} value={tec.acabamento} onChange={(e) => setTec({ ...tec, acabamento: e.target.value })} />
          </div>
          {num('espessura', 'Espessura (mm)')}
          {num('largura', 'Largura (mm)')}
          {num('comprimento', 'Comprimento (mm)')}
          {num('diametro_externo', 'Diâmetro externo (mm)')}
          {num('espessura_parede', 'Espessura da parede (mm)')}
        </div>

        <div>
          <label htmlFor="mat-prop" className="block text-sm">Propriedades adicionais</label>
          <textarea id="mat-prop" className={campo} rows={2} value={tec.propriedades} onChange={(e) => setTec({ ...tec, propriedades: e.target.value })} />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-white">Salvar</button>
          {editId && (
            <button type="button" className="rounded border px-4 py-2" onClick={limpar}>Cancelar</button>
          )}
        </div>
      </form>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setFiltro(busca)
        }}
      >
        <div className="flex-1">
          <label htmlFor="mat-busca" className="block text-sm">Buscar</label>
          <input id="mat-busca" className={campo} placeholder="Número, nome, forma, norma, grau..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <button type="submit" className="rounded bg-gray-900 px-4 py-2 text-white">Pesquisar</button>
        {filtro && (
          <button type="button" className="rounded border px-4 py-2" onClick={() => { setBusca(''); setFiltro('') }}>Limpar</button>
        )}
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : filtrados.length === 0 ? (
        !erro && <p>{filtro ? 'Nenhum resultado para a busca.' : 'Nenhuma matéria-prima cadastrada.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Nº</th>
                <th>Nome</th>
                <th>Forma</th>
                <th>Unidade</th>
                <th>Estoque mínimo</th>
                <th><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="py-2">{m.codigo ?? '—'}</td>
                  <td>{m.nome}</td>
                  <td>{m.forma ?? '—'}</td>
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
