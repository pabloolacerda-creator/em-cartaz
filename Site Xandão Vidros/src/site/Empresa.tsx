const ATENDE = ['Residencial', 'Comercial', 'Obras e reformas']

export default function Empresa() {
  return (
    <section id="empresa" aria-label="Empresa" className="scroll-mt-24 bg-white py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">A empresa</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
            Especialistas em vidro, do projeto à instalação.
          </h2>
        </div>
        <div className="space-y-4 text-zinc-700">
          <p>
            A Xandão Vidros é uma vidraçaria que atende Cuiabá e Várzea Grande, em Mato Grosso.
            Trabalhamos com vidro temperado, comum e espelhos, transformando ambientes com segurança,
            elegância e resistência.
          </p>
          <p>
            Cada peça é medida no local e feita sob medida — do box do banheiro à fachada da sua loja —
            com acabamento caprichado e instalação por quem entende do assunto.
          </p>
          <ul className="flex flex-wrap gap-2 pt-2" aria-label="Quem atendemos">
            {ATENDE.map((a) => (
              <li key={a} className="rounded-full border border-zinc-300 bg-zinc-50 px-4 py-1.5 text-sm font-medium text-zinc-800">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
