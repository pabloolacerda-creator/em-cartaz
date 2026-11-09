import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import SitePublico from './site/SitePublico'
import Login from './app/Login'
import RequireAuth from './app/RequireAuth'
import Dashboard from './app/Dashboard'
import CadastroHome from './app/CadastroHome'
import Materiais from './app/materiais/MateriaisPage'
import Estoque from './app/estoque/EstoquePage'
import Clientes from './app/clientes/ClientesPage'
import Produtos from './app/produtos/ProdutosPage'
import Pedidos from './app/pedidos/PedidosPage'
import PedidoDetalhe from './app/pedidos/PedidoDetalhe'
import PedidoEditar from './app/pedidos/PedidoEditar'
import PedidoOS from './app/pedidos/PedidoOS'
import FinanceiroLayout from './app/financeiro/FinanceiroLayout'
import FinanceiroPainel from './app/financeiro/FinanceiroPainel'
import Lancamentos from './app/financeiro/LancamentosPage'
import Contas from './app/financeiro/ContasPage'
import Fluxo from './app/financeiro/FluxoPage'
import Relatorios from './app/financeiro/RelatoriosPage'
import RequireModulo from './app/RequireModulo'
import Funcionarios from './app/funcionarios/FuncionariosPage'

const Inicio = () => <h1 className="text-xl font-semibold">Bem-vindo ao painel Xandão Vidros</h1>

export const router = createBrowserRouter(
  [
    { path: '/', element: <SitePublico /> },
    { path: '/app/login', element: <Login /> },
    {
      path: '/app',
      element: (
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      ),
      children: [
        { index: true, element: <Inicio /> },
        { path: 'cadastro', element: <CadastroHome /> },
        { path: 'cadastro/materiais', element: <RequireModulo modulo="materia_prima"><Materiais /></RequireModulo> },
        { path: 'cadastro/produtos', element: <RequireModulo modulo="produtos"><Produtos /></RequireModulo> },
        { path: 'cadastro/clientes', element: <RequireModulo modulo="clientes"><Clientes /></RequireModulo> },
        { path: 'cadastro/funcionarios', element: <Funcionarios /> },
        { path: 'estoque', element: <RequireModulo modulo="estoque"><Estoque /></RequireModulo> },
        { path: 'pedidos', element: <RequireModulo modulo="pedidos"><Pedidos /></RequireModulo> },
        { path: 'pedidos/:id', element: <RequireModulo modulo="pedidos"><PedidoDetalhe /></RequireModulo> },
        { path: 'pedidos/:id/editar', element: <RequireModulo modulo="pedidos"><PedidoEditar /></RequireModulo> },
        { path: 'pedidos/:id/os', element: <RequireModulo modulo="pedidos"><PedidoOS /></RequireModulo> },
        {
          path: 'financeiro',
          element: <RequireModulo modulo="financeiro"><FinanceiroLayout /></RequireModulo>,
          children: [
            { index: true, element: <FinanceiroPainel /> },
            { path: 'lancamentos', element: <Lancamentos /> },
            { path: 'contas', element: <Contas /> },
            { path: 'fluxo', element: <Fluxo /> },
            { path: 'relatorios', element: <Relatorios /> },
          ],
        },
      ],
    },
  ],
  { future: { v7_relativeSplatPath: true } },
)

export default function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />
}
