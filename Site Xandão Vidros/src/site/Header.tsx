import { Link } from 'react-router-dom'
import { NAV } from './dados'

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <a href="#topo" className="shrink-0">
          <img src="/logo-cor.png" alt="Xandão Vidros" className="h-10 w-auto" />
        </a>
        <nav aria-label="Principal" className="hidden items-center gap-8 text-sm font-medium text-zinc-700 md:flex">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="transition hover:text-brand">
              {n.rotulo}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/app/login"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Login
          </Link>
        </div>
      </div>
      <nav
        aria-label="Seções"
        className="flex justify-between gap-1 overflow-x-auto border-t border-zinc-100 px-4 py-2 text-xs font-medium text-zinc-700 md:hidden"
      >
        {NAV.map((n) => (
          <a key={n.id} href={`#${n.id}`} className="rounded px-2 py-1 hover:bg-zinc-100">
            {n.rotulo}
          </a>
        ))}
      </nav>
    </header>
  )
}
