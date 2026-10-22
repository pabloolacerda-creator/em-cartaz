import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { usePerfil } from './RequireAuth'
import { podeAcessar } from '../lib/permissions'
import { sair } from '../lib/auth'
import type { Modulo } from '../types'

type Item = { modulo: Modulo; rotulo: string; to: string }

// "Cadastro" agrupa os cadastros; Estoque e Pedidos são operação (itens soltos).
const CADASTRO_SUBS: Item[] = [
  { modulo: 'materia_prima', rotulo: 'Matéria-Prima', to: '/app/cadastro/materiais' },
  { modulo: 'produtos', rotulo: 'Produtos/Serviços', to: '/app/cadastro/produtos' },
  { modulo: 'clientes', rotulo: 'Clientes', to: '/app/cadastro/clientes' },
  { modulo: 'funcionarios', rotulo: 'Funcionários', to: '/app/cadastro/funcionarios' },
]

const OPERACAO: Item[] = [
  { modulo: 'estoque', rotulo: 'Estoque', to: '/app/estoque' },
  { modulo: 'pedidos', rotulo: 'Pedidos', to: '/app/pedidos' },
  { modulo: 'financeiro', rotulo: 'Financeiro', to: '/app/financeiro' },
]

export default function Dashboard() {
  const perfil = usePerfil()
  const navigate = useNavigate()

  async function handleSair() {
    await sair()
    navigate('/app/login', { replace: true })
  }

  const cadastroSubs = CADASTRO_SUBS.filter((a) => podeAcessar(perfil, a.modulo))
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded px-3 py-2 text-sm ${isActive ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <aside className="border-b bg-white md:w-56 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4 md:block">
          <div>
            <Link to="/app" aria-label="Ir para o início">
              <img src="/logo-cor.png" alt="Caldemat" className="h-10 w-auto" />
            </Link>
            <div className="mt-1 text-sm text-gray-500">{perfil.nome}</div>
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
          {cadastroSubs.length > 0 && (
            <NavLink to="/app/cadastro" className={linkCls}>
              Cadastro
            </NavLink>
          )}
          {OPERACAO.filter((a) => podeAcessar(perfil, a.modulo)).map((a) => (
            <NavLink key={a.modulo} to={a.to} className={linkCls}>
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
