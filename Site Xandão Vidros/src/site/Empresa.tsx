const ATENDE = ['Agronegócio', 'Fazendas', 'Construtoras']

export default function Empresa() {
  return (
    <section id="empresa" aria-label="Empresa" className="scroll-mt-24 bg-white py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">A empresa</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
            Tradição de quem trabalha o metal há mais de quatro décadas.
          </h2>
        </div>
        <div className="space-y-4 text-zinc-700">
          <p>
            A Caldemat é uma indústria metalúrgica de Várzea Grande, em Mato Grosso. Fabricamos tanques e reservatórios
            e prestamos serviços de conformação de metais, com a experiência de mais de 40 anos de oficina.
          </p>
          <p>Cada peça é pensada para a rotina pesada do campo e da construção: resistência, acabamento e prazo.</p>
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
