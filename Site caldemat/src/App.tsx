import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import SitePublico from './site/SitePublico'
import Login from './app/Login'
import RequireAuth from './app/RequireAuth'
import Dashboard from './app/Dashboard'
import Materiais from './app/materiais/MateriaisPage'
import Estoque from './app/estoque/EstoquePage'
import Clientes from './app/clientes/ClientesPage'
import Pedidos from './app/pedidos/PedidosPage'
import RequireModulo from './app/RequireModulo'
import Funcionarios from './app/funcionarios/FuncionariosPage'

const Inicio = () => <h1 className="text-xl font-semibold">Bem-vindo ao painel Caldemat</h1>

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
        { path: 'materiais', element: <RequireModulo modulo="materia_prima"><Materiais /></RequireModulo> },
        { path: 'estoque', element: <RequireModulo modulo="estoque"><Estoque /></RequireModulo> },
        { path: 'clientes', element: <RequireModulo modulo="clientes"><Clientes /></RequireModulo> },
        { path: 'pedidos', element: <RequireModulo modulo="pedidos"><Pedidos /></RequireModulo> },
        { path: 'funcionarios', element: <Funcionarios /> },
      ],
    },
  ],
  { future: { v7_relativeSplatPath: true } },
)

export default function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />
}
