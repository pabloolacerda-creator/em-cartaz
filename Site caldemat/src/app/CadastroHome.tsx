import { Link } from 'react-router-dom'
import { usePerfil } from './RequireAuth'
import { podeAcessar } from '../lib/permissions'
import type { Modulo } from '../types'

const CARDS: { modulo: Modulo; titulo: string; descricao: string; to: string }[] = [
  { modulo: 'materia_prima', titulo: 'Matéria-Prima', descricao: 'Cadastre chapas, tubos, barras e cantoneiras com os dados técnicos.', to: '/app/cadastro/materiais' },
  { modulo: 'produtos', titulo: 'Produtos/Serviços', descricao: 'Defina produtos/serviços com unidade e preço de venda para os pedidos.', to: '/app/cadastro/produtos' },
  { modulo: 'clientes', titulo: 'Clientes', descricao: 'Cadastre e mantenha os dados dos clientes.', to: '/app/cadastro/clientes' },
  { modulo: 'funcionarios', titulo: 'Funcionários', descricao: 'Crie logins, defina acessos e gerencie a equipe.', to: '/app/cadastro/funcionarios' },
]

export default function CadastroHome() {
  const perfil = usePerfil()
  const disponiveis = CARDS.filter((c) => podeAcessar(perfil, c.modulo))

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Cadastro</h1>
      {disponiveis.length === 0 ? (
        <p className="text-gray-600">Você não tem acesso a nenhum cadastro.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {disponiveis.map((c) => (
            <Link
              key={c.modulo}
              to={c.to}
              className="block rounded-lg border bg-white p-5 shadow-sm transition hover:border-gray-900 hover:shadow"
            >
              <div className="text-lg font-semibold">{c.titulo}</div>
              <p className="mt-1 text-sm text-gray-600">{c.descricao}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
