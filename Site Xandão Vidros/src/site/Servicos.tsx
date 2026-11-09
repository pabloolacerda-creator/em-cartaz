const SERVICOS = [
  {
    nome: 'Residencial',
    itens: [
      'Portas e janelas de vidro temperado',
      'Box para banheiro e espelhos sob medida',
      'Fechamento de sacadas e envidraçamento de varandas',
      'Divisórias e guarda-corpo de vidro',
      'Coberturas, prateleiras, tampos de mesa e nichos de vidro',
    ],
  },
  {
    nome: 'Comercial',
    itens: [
      'Fachadas de vidro, pele de vidro e vitrines',
      'Portas de vidro temperado e portas automáticas',
      'Divisórias corporativas e fechamento de ambientes',
      'Balcões, expositores e guichês de atendimento',
      'Fechamento de lojas',
    ],
  },
]

export default function Servicos() {
  return (
    <section id="servicos" aria-label="Serviços" className="scroll-mt-24 bg-zinc-900 py-16 text-white md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vidro">Serviços</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight md:text-4xl">Do residencial ao comercial.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {SERVICOS.map((s) => (
            <article key={s.nome} className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-6 md:p-8">
              <h3 className="text-xl font-bold">{s.nome}</h3>
              <ul className="mt-4 space-y-3 text-zinc-300">
                {s.itens.map((i) => (
                  <li key={i} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 bg-vidro" />
                    {i}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
