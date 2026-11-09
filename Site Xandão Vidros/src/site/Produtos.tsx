const PRODUTOS = [
  { nome: 'Box para banheiro', desc: 'Box de vidro temperado sob medida, com ferragens de qualidade e acabamento impecável.', foto: '/fotos/box.webp' },
  { nome: 'Espelhos sob medida', desc: 'Espelhos lapidados, bisotados ou com moldura, no tamanho certo para cada ambiente.', foto: '/fotos/espelhos.webp' },
  { nome: 'Portas e janelas de vidro', desc: 'Portas de correr, de abrir e janelas em vidro temperado, para casa e comércio.', foto: '/fotos/portas-janelas.webp' },
]

export default function Produtos() {
  return (
    <section id="produtos" aria-label="Produtos" className="scroll-mt-24 bg-zinc-100 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Produtos</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
          Vidro sob medida para cada ambiente.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PRODUTOS.map((p) => (
            <article
              key={p.nome}
              className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-48 overflow-hidden bg-zinc-800">
                <img src={p.foto} alt={p.nome} loading="lazy" className="h-full w-full object-cover transition duration-300 hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 h-1 bg-zinc-300" />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-zinc-900">{p.nome}</h3>
                <p className="mt-2 text-sm text-zinc-600">{p.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
