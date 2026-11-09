import { NavLink, Outlet } from 'react-router-dom'

const sub = [
  { to: '/app/financeiro', rotulo: 'Painel', end: true },
  { to: '/app/financeiro/lancamentos', rotulo: 'Lançamentos' },
  { to: '/app/financeiro/contas', rotulo: 'Contas' },
  { to: '/app/financeiro/fluxo', rotulo: 'Fluxo de caixa' },
]

export default function FinanceiroLayout() {
  const cls = ({ isActive }: { isActive: boolean }) =>
    `rounded px-3 py-1.5 text-sm ${isActive ? 'bg-gray-900 text-white' : 'border hover:bg-gray-100'}`
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Financeiro</h1>
      <nav aria-label="Financeiro" className="flex flex-wrap gap-2">
        {sub.map((s) => (
          <NavLink key={s.to} to={s.to} end={s.end} className={cls}>
            {s.rotulo}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
