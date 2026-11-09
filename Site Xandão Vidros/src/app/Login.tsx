import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { entrar } from '../lib/auth'

export default function Login() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    const r = await entrar(usuario, senha)
    setEnviando(false)
    if (r.erro) setErro(r.erro)
    else navigate('/app', { replace: true })
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded border p-6">
        <h1 className="text-xl font-semibold">Entrar</h1>
        <div>
          <label htmlFor="usuario" className="block text-sm">Usuário</label>
          <input id="usuario" className="w-full rounded border p-2" autoComplete="username"
            value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="senha" className="block text-sm">Senha</label>
          <input id="senha" type="password" className="w-full rounded border p-2"
            autoComplete="current-password" value={senha}
            onChange={(e) => setSenha(e.target.value)} required />
        </div>
        {erro && <p role="alert" className="text-sm text-red-600">{erro}</p>}
        <button type="submit" disabled={enviando} className="w-full rounded bg-black p-2 text-white">
          Entrar
        </button>
      </form>
    </main>
  )
}
