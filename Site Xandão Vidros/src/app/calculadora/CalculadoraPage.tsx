import { useState } from 'react'
import { CHAPAS, GRUPOS_CHAPA, calcularChapa } from '../../lib/chapa'
import { parseMoedaBR, formatMoedaBR } from '../../lib/money'

export const numBR = (s: string) => {
  const t = s.trim().replace(',', '.')
  return t === '' ? NaN : Number(t)
}
const fmt = (n: number, casas = 2) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: Math.max(casas, 4) })

function Resultado({ rotulo, valor, testid, destaque }: { rotulo: string; valor: string; testid?: string; destaque?: boolean }) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${destaque ? 'border-blue-700' : ''}`}>
      <div className="text-sm text-gray-500">{rotulo}</div>
      <div className={`font-semibold ${destaque ? 'text-2xl text-blue-800' : 'text-xl'}`} data-testid={testid}>{valor}</div>
    </div>
  )
}

export default function CalculadoraPage() {
  const [pol, setPol] = useState(CHAPAS[0].pol)
  const [largura, setLargura] = useState('')
  const [comprimento, setComprimento] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [precoKg, setPrecoKg] = useState('')

  const chapa = CHAPAS.find((c) => c.pol === pol) ?? CHAPAS[0]
  const r = calcularChapa({
    kgm2: chapa.kgm2,
    largura: numBR(largura),
    comprimento: numBR(comprimento),
    quantidade: numBR(quantidade),
    precoKg: parseMoedaBR(precoKg.trim()),
  })
  const campo = 'w-full rounded border border-gray-300 px-3 py-2'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Calculadora de chapa</h1>
        <p className="text-sm text-gray-600">Chapas finas a quente e chapas grossas — peso aproximado pela tabela (kg/m²). Medidas em metros.</p>
      </div>

      <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-5 sm:items-end">
        <div>
          <label htmlFor="calc-esp" className="block text-sm">Espessura</label>
          <select id="calc-esp" className={campo} value={pol} onChange={(e) => setPol(e.target.value)}>
            {GRUPOS_CHAPA.map((g) => (
              <optgroup key={g.grupo} label={g.titulo}>
                {CHAPAS.filter((c) => c.grupo === g.grupo).map((c) => (
                  <option key={c.pol} value={c.pol}>{c.pol} — {fmt(c.mm)} mm</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="calc-larg" className="block text-sm">Largura (m)</label>
          <input id="calc-larg" className={campo} inputMode="decimal" value={largura} onChange={(e) => setLargura(e.target.value)} />
        </div>
        <div>
          <label htmlFor="calc-comp" className="block text-sm">Comprimento (m)</label>
          <input id="calc-comp" className={campo} inputMode="decimal" value={comprimento} onChange={(e) => setComprimento(e.target.value)} />
        </div>
        <div>
          <label htmlFor="calc-qtd" className="block text-sm">Quantidade</label>
          <input id="calc-qtd" className={campo} inputMode="decimal" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        </div>
        <div>
          <label htmlFor="calc-kg" className="block text-sm">Valor do kg (R$)</label>
          <input id="calc-kg" className={campo} inputMode="decimal" placeholder="0,00" value={precoKg} onChange={(e) => setPrecoKg(e.target.value)} />
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Chapa {chapa.pol} ({fmt(chapa.mm)} mm) pesa <strong>{fmt(chapa.kgm2)} kg/m²</strong>.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Resultado rotulo="Área por peça" valor={`${fmt(r.areaUnit)} m²`} />
        <Resultado rotulo="Área total" valor={`${fmt(r.areaTotal)} m²`} testid="area-total" />
        <Resultado rotulo="Peso por peça" valor={`${fmt(r.pesoUnit)} kg`} />
        <Resultado rotulo="Peso total" valor={`${fmt(r.pesoTotal)} kg`} testid="peso-total" />
        <Resultado rotulo="Custo total" valor={formatMoedaBR(r.custoTotal)} testid="custo-total" destaque />
      </div>
    </div>
  )
}
