import { useEffect, useState, type FormEvent } from 'react'
import { TELEFONE } from './dados'
import { criarLead, lerUtms } from '../app/leads/leads.api'
import { initGads, dispararConversaoLead } from '../lib/gads'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')
const opc = (s: string) => (s.trim() === '' ? null : s.trim())

const VAZIO = { nome: '', whatsapp: '', documento: '', capacidade: '', bacia: 'false', cidade: '', empresa_site: '' }

export default function Orcamento() {
  const [f, setF] = useState(VAZIO)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    initGads()
  }, [])

  const set = (k: keyof typeof VAZIO) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }))

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (enviando) return
    // Honeypot: bot preencheu o campo escondido -> finge sucesso, não grava.
    if (f.empresa_site.trim() !== '') {
      setEnviado(true)
      return
    }
    const nome = f.nome.trim()
    const whatsapp = f.whatsapp.trim()
    const cidade = f.cidade.trim()
    if (!nome || !whatsapp || !cidade) {
      setErro('Preencha nome, WhatsApp e cidade.')
      return
    }
    const n = parseFloat(f.capacidade.replace(',', '.'))
    const capacidade_litros = Number.isFinite(n) ? n : null
    setErro(null)
    setEnviando(true)
    try {
      await criarLead({
        nome,
        whatsapp,
        documento: opc(f.documento),
        capacidade_litros,
        bacia_contencao: f.bacia === 'true',
        cidade,
        ...lerUtms(typeof window !== 'undefined' ? window.location.search : ''),
      })
      dispararConversaoLead()
      setEnviado(true)
    } catch (err) {
      setErro(msg(err))
    } finally {
      setEnviando(false)
    }
  }

  const campo = 'w-full rounded-md border border-zinc-300 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand'

  return (
    <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900">
      {/* Cabeçalho enxuto: sem menu que disperse quem veio do anúncio */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <img src="/logo-cor.png" alt="Caldemat" className="h-9 w-auto" />
          <a href="tel:+5565993597968" className="text-sm font-medium text-zinc-600 hover:text-brand">☎ {TELEFONE}</a>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800">
          Metalúrgica · 40+ anos em MT
        </span>
        <h1 className="mt-4 text-2xl font-extrabold leading-tight md:text-3xl">
          Tanques de abastecimento sob medida para a sua lavoura
        </h1>
        <p className="mt-2 text-zinc-600">
          Abastecimento de máquinas e aviões agrícolas com segurança. Fabricação própria em aço, entrega em Mato Grosso.
        </p>

        <img src="/fotos/tanque-aereo.webp" alt="Tanque de abastecimento Caldemat" loading="lazy" className="mt-5 h-48 w-full rounded-lg object-cover" />

        <ul className="mt-5 space-y-1 text-sm text-zinc-800">
          <li>✓ Fabricação sob medida para o seu volume</li>
          <li>✓ Aço resistente, pensado para combustível</li>
          <li>✓ Atendemos fazendas em todo o Mato Grosso</li>
        </ul>

        {enviado ? (
          <div role="status" className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <h2 className="text-xl font-bold text-emerald-800">Recebemos seu contato!</h2>
            <p className="mt-2 text-emerald-900">Um vendedor da Caldemat vai te chamar no WhatsApp em breve.</p>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-8 rounded-xl border border-zinc-200 bg-white p-5" noValidate>
            <h2 className="text-lg font-extrabold">Peça seu orçamento</h2>
            <p className="mb-4 text-sm text-zinc-500">Preencha e um vendedor te chama com o preço. Sem compromisso.</p>

            {erro && <p role="alert" className="mb-3 rounded bg-red-100 px-3 py-2 text-sm text-red-800">{erro}</p>}

            {/* Honeypot anti-spam: escondido de humanos, atraente para bots. */}
            <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="orc-empresa-site">Não preencha este campo</label>
              <input id="orc-empresa-site" name="empresa_site" tabIndex={-1} autoComplete="off" value={f.empresa_site} onChange={set('empresa_site')} />
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="orc-nome" className="block text-sm font-medium">Nome</label>
                <input id="orc-nome" className={campo} value={f.nome} onChange={set('nome')} />
              </div>
              <div>
                <label htmlFor="orc-whats" className="block text-sm font-medium">WhatsApp</label>
                <input id="orc-whats" type="tel" className={campo} value={f.whatsapp} onChange={set('whatsapp')} placeholder="(65) 9____-____" />
              </div>
              <div>
                <label htmlFor="orc-doc" className="block text-sm font-medium">CPF ou CNPJ</label>
                <input id="orc-doc" className={campo} value={f.documento} onChange={set('documento')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="orc-cap" className="block text-sm font-medium">Capacidade (litros)</label>
                  <input id="orc-cap" type="text" inputMode="numeric" className={campo} value={f.capacidade} onChange={set('capacidade')} placeholder="5000" />
                </div>
                <div>
                  <label htmlFor="orc-bacia" className="block text-sm font-medium">Bacia de contenção?</label>
                  <select id="orc-bacia" className={campo} value={f.bacia} onChange={set('bacia')}>
                    <option value="false">Não</option>
                    <option value="true">Sim</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="orc-cidade" className="block text-sm font-medium">Para qual cidade?</label>
                <input id="orc-cidade" className={campo} value={f.cidade} onChange={set('cidade')} placeholder="Ex.: Sorriso — MT" />
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="mt-5 w-full rounded-md bg-brand px-6 py-3 font-semibold text-white shadow transition hover:bg-emerald-800 disabled:opacity-50"
            >
              Quero meu orçamento
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
