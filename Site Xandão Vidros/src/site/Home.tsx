import { WHATSAPP_URL } from './dados'

const NUMEROS = [
  { v: 'Sob medida', r: 'cada peça no tamanho certo' },
  { v: 'Temperado', r: 'segurança e resistência' },
  { v: 'Cuiabá · VG', r: 'atendemos a Grande Cuiabá' },
]

export default function Home() {
  return (
    <section id="topo" aria-label="Início" className="relative overflow-hidden bg-zinc-900 pt-28 text-white md:pt-24">
      <img
        src="/fotos/banner-principal.webp"
        alt="Fechamento de vidro temperado instalado pela Xandão Vidros"
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      {/* Gradiente escuro por cima da foto, para o texto ficar legível (mais leve à direita) */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-zinc-950/45 to-transparent" />
      <div aria-hidden="true" className="absolute inset-0 bg-zinc-950/20 md:bg-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 md:pb-24 md:pt-12">
        <div className="max-w-2xl">
          <p className="mb-4 inline-block border-l-4 border-white pl-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">
            Vidraçaria · Cuiabá e Várzea Grande/MT
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Vidro com <span className="text-white">segurança, elegância e resistência</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-zinc-300">
            Box, espelhos, portas, janelas, fachadas e fechamentos de vidro sob medida — do projeto
            residencial ao comercial.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 font-semibold text-brand shadow-lg transition hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Pedir orçamento no WhatsApp
            </a>
            <a
              href="#produtos"
              className="inline-flex items-center justify-center rounded-md border border-zinc-500 px-6 py-3 font-semibold text-white transition hover:border-white"
            >
              Ver produtos
            </a>
          </div>
        </div>
      </div>
      <dl className="relative border-t border-zinc-700 bg-zinc-950/60">
        <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-zinc-700 px-4">
          {NUMEROS.map((n) => (
            <div key={n.r} className="px-2 py-5 text-center sm:px-6 sm:text-left">
              <dt className="text-2xl font-extrabold text-white sm:text-3xl">{n.v}</dt>
              <dd className="text-xs text-zinc-400 sm:text-sm">{n.r}</dd>
            </div>
          ))}
        </div>
      </dl>
    </section>
  )
}
