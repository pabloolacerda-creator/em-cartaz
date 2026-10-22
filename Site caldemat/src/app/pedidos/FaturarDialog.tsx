import { useState } from 'react'
import { parseMoedaBR, formatMoedaBR } from '../../lib/money'
import type { Parcela } from '../financeiro/financeiro.api'

const FORMAS = ['Dinheiro', 'Pix', 'Cartão', 'Boleto', 'Transferência', 'Outro']

const hojeISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const maisDias = (dias: number) => {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}
const valorBR = (n: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

type ParcelaForm = { valor: string; vencimento: string; recebido: boolean }

type Props = {
  total: number
  numero?: number | null
  salvando?: boolean
  onConfirm: (forma: string, parcelas: Parcela[]) => void
  onCancel: () => void
}

export default function FaturarDialog({ total, numero, salvando, onConfirm, onCancel }: Props) {
  const [forma, setForma] = useState('Dinheiro')
  const [parcelas, setParcelas] = useState<ParcelaForm[]>([{ valor: valorBR(total), vencimento: hojeISO(), recebido: true }])
  const [erro, setErro] = useState<string | null>(null)

  const set = (i: number, k: keyof ParcelaForm, v: string | boolean) =>
    setParcelas((p) => p.map((it, j) => (j === i ? { ...it, [k]: v } : it)))

  const aVista = () => setParcelas([{ valor: valorBR(total), vencimento: hojeISO(), recebido: true }])
  const meioMeio = () =>
    setParcelas([
      { valor: valorBR(Math.round(total * 50) / 100), vencimento: hojeISO(), recebido: true },
      { valor: valorBR(total - Math.round(total * 50) / 100), vencimento: maisDias(30), recebido: false },
    ])

  const soma = parcelas.reduce((s, p) => s + (Number.isNaN(parseMoedaBR(p.valor)) ? 0 : parseMoedaBR(p.valor)) * 100, 0) / 100
  const diferenca = Math.round((soma - total) * 100) / 100

  function confirmar() {
    const out: Parcela[] = []
    for (let i = 0; i < parcelas.length; i++) {
      const v = parseMoedaBR(parcelas[i].valor.trim())
      if (Number.isNaN(v) || v <= 0) return setErro(`Parcela ${i + 1}: valor inválido.`)
      if (!parcelas[i].vencimento) return setErro(`Parcela ${i + 1}: informe o vencimento.`)
      out.push({ valor: v, vencimento: parcelas[i].vencimento, recebido: parcelas[i].recebido })
    }
    setErro(null)
    onConfirm(forma, out)
  }

  const campo = 'w-full rounded border border-gray-300 px-3 py-2'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 no-print" role="dialog" aria-label="Faturamento">
      <div className="w-full max-w-2xl space-y-4 rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold">Faturar{numero ? ` pedido nº ${String(numero).padStart(6, '0')}` : ''}</h2>
        <p className="text-sm text-gray-600">Total: <strong>{formatMoedaBR(total)}</strong></p>

        {erro && <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">{erro}</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="fat-forma" className="block text-sm">Forma de recebimento</label>
            <select id="fat-forma" className={campo} value={forma} onChange={(e) => setForma(e.target.value)}>
              {FORMAS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="button" className="rounded border px-3 py-2 text-sm" onClick={aVista}>À vista</button>
            <button type="button" className="rounded border px-3 py-2 text-sm" onClick={meioMeio}>50% entrada + 50% entrega</button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Parcelas</div>
          {parcelas.map((p, i) => (
            <div key={i} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
              <div>
                <label htmlFor={`fat-val-${i}`} className="block text-xs text-gray-500">Valor</label>
                <input id={`fat-val-${i}`} className={campo} inputMode="decimal" value={p.valor} onChange={(e) => set(i, 'valor', e.target.value)} />
              </div>
              <div>
                <label htmlFor={`fat-venc-${i}`} className="block text-xs text-gray-500">Vencimento</label>
                <input id={`fat-venc-${i}`} type="date" className={campo} value={p.vencimento} onChange={(e) => set(i, 'vencimento', e.target.value)} />
              </div>
              <label className="flex items-center gap-2 py-2 text-sm">
                <input type="checkbox" checked={p.recebido} onChange={(e) => set(i, 'recebido', e.target.checked)} aria-label={`Parcela ${i + 1} já recebida`} />
                Já recebido
              </label>
              <div className="py-2">
                {parcelas.length > 1 && (
                  <button type="button" className="text-red-700 underline" aria-label={`Remover parcela ${i + 1}`} onClick={() => setParcelas((pp) => pp.filter((_, j) => j !== i))}>
                    Remover
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button type="button" className="rounded border px-3 py-1" onClick={() => setParcelas((p) => [...p, { valor: '', vencimento: maisDias(30), recebido: false }])}>
              Adicionar parcela
            </button>
            <span className={diferenca !== 0 ? 'text-red-700' : 'text-gray-600'}>
              Soma: {formatMoedaBR(soma)} {diferenca !== 0 && `(${diferenca > 0 ? 'excede' : 'falta'} ${formatMoedaBR(Math.abs(diferenca))})`}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="rounded border px-4 py-2" onClick={onCancel} disabled={salvando}>Cancelar</button>
          <button type="button" className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50" onClick={confirmar} disabled={salvando}>
            Confirmar faturamento
          </button>
        </div>
      </div>
    </div>
  )
}
