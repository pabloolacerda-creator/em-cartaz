import { EMAIL, ENDERECO, INSTAGRAM, INSTAGRAM_URL, TELEFONE, WHATSAPP_URL } from './dados'

const link = 'hover:text-brand'

export default function Contato() {
  const itens: [string, React.ReactNode][] = [
    ['WhatsApp / Telefone', <a href="tel:+5565993597968" className={link}>{TELEFONE}</a>],
    ['E-mail', <a href={`mailto:${EMAIL}`} className={`break-all ${link}`}>{EMAIL}</a>],
    ['Endereço', <span>{ENDERECO}</span>],
    [
      'Instagram',
      <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className={link}>
        {INSTAGRAM}
      </a>,
    ],
  ]
  return (
    <section id="contato" aria-label="Contato" className="scroll-mt-24 bg-white py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Contato</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
            Conte o que você precisa. Respondemos com um orçamento.
          </h2>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-md bg-brand px-6 py-3 font-semibold text-white shadow transition hover:bg-vidro focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Chamar no WhatsApp
          </a>
        </div>
        <dl className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
          {itens.map(([k, v]) => (
            <div key={k} className="px-5 py-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-600">{k}</dt>
              <dd className="mt-1 font-medium text-zinc-900">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
