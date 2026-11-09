import { periodoPreset, type Periodo, type Preset } from '../../lib/periodo'

const PRESETS: [Preset, string][] = [
  ['hoje', 'Hoje'],
  ['mes', 'Esse mês'],
  ['7dias', 'Últimos 7 dias'],
  ['30dias', 'Últimos 30 dias'],
]

const hojeLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Props = { label: string; value: Periodo; onChange: (p: Periodo) => void }

export default function FiltroPeriodo({ label, value, onChange }: Props) {
  const campo = 'rounded border border-gray-300 px-3 py-2'
  return (
    <div>
      <span className="block text-sm">{label}</span>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {PRESETS.map(([p, rot]) => (
          <button key={p} type="button" className="rounded border px-2 py-1 text-xs hover:bg-gray-100" onClick={() => onChange(periodoPreset(p, hojeLocal()))}>
            {rot}
          </button>
        ))}
        <input aria-label={`${label} — de`} type="date" className={campo} value={value.de ?? ''} onChange={(e) => onChange({ ...value, de: e.target.value || null })} />
        <span className="text-sm text-gray-500">até</span>
        <input aria-label={`${label} — até`} type="date" className={campo} value={value.ate ?? ''} onChange={(e) => onChange({ ...value, ate: e.target.value || null })} />
        {(value.de || value.ate) && (
          <button type="button" className="text-sm text-gray-600 underline" onClick={() => onChange({ de: null, ate: null })}>
            Limpar
          </button>
        )}
      </div>
    </div>
  )
}
