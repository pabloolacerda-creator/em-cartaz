import { RouterProvider, createBrowserRouter, Link } from 'react-router-dom'
import Login from './app/Login'
import RequireAuth from './app/RequireAuth'
import Dashboard from './app/Dashboard'
import Materiais from './app/materiais/MateriaisPage'
import Estoque from './app/estoque/EstoquePage'
import Clientes from './app/clientes/ClientesPage'
import Pedidos from './app/pedidos/PedidosPage'
import Funcionarios from './app/funcionarios/FuncionariosPage'

const Inicio = () => <h1 className="text-xl font-semibold">Bem-vindo ao painel Caldemat</h1>

// TEMPORÁRIO: o site institucional real (Task 12) substitui esta página.
const Institucional = () => (
  <main className="p-4">
    <h1 className="text-2xl font-bold">Caldemat</h1>
    <Link to="/app/login" className="underline">Login</Link>
  </main>
)

export const router = createBrowserRouter(
  [
    { path: '/', element: <Institucional /> },
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
        { path: 'materiais', element: <Materiais /> },
        { path: 'estoque', element: <Estoque /> },
        { path: 'clientes', element: <Clientes /> },
        { path: 'pedidos', element: <Pedidos /> },
        { path: 'funcionarios', element: <Funcionarios /> },
      ],
    },
  ],
  { future: { v7_relativeSplatPath: true } },
)

export default function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />
}
