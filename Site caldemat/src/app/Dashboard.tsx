import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { usePerfil } from './RequireAuth'
import { podeAcessar } from '../lib/permissions'
import { sair } from '../lib/auth'
import type { Modulo } from '../types'

const ABAS: { modulo: Modulo; rotulo: string; to: string }[] = [
  { modulo: 'materia_prima', rotulo: 'Matéria-Prima', to: '/app/materiais' },
  { modulo: 'estoque', rotulo: 'Estoque', to: '/app/estoque' },
  { modulo: 'clientes', rotulo: 'Clientes', to: '/app/clientes' },
  { modulo: 'pedidos', rotulo: 'Pedidos', to: '/app/pedidos' },
  { modulo: 'funcionarios', rotulo: 'Funcionários', to: '/app/funcionarios' },
]

export default function Dashboard() {
  const perfil = usePerfil()
  const navigate = useNavigate()

  async function handleSair() {
    await sair()
    navigate('/app/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <aside className="border-b bg-white md:w-56 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4 md:block">
          <div>
            <div className="text-lg font-bold">Caldemat</div>
            <div className="text-sm text-gray-500">{perfil.nome}</div>
          </div>
          <button
            type="button"
            onClick={handleSair}
            className="rounded border px-3 py-1 text-sm md:mt-4"
          >
            Sair
          </button>
        </div>
        <nav aria-label="Módulos" className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-4">
          {ABAS.filter((a) => podeAcessar(perfil, a.modulo)).map((a) => (
            <NavLink
              key={a.modulo}
              to={a.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded px-3 py-2 text-sm ${isActive ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`
              }
            >
              {a.rotulo}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
