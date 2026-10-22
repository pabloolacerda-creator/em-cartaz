import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { usePerfil } from '../RequireAuth'
import type { Perfil } from '../../types'
import { podeRemoverOuRebaixarAdmin, ERRO_ULTIMO_ADMIN } from '../../lib/adminGuard'
import { listarFuncionarios, criarFuncionario, resetarSenha, inativarFuncionario, ativarFuncionario, type Permissoes } from './funcionarios.api'

const msg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erro inesperado')

const MODULOS: { chave: keyof Permissoes; rotulo: string }[] = [
  { chave: 'pode_materia_prima', rotulo: 'Matéria-Prima' },
  { chave: 'pode_estoque', rotulo: 'Estoque' },
  { chave: 'pode_clientes', rotulo: 'Clientes' },
  { chave: 'pode_pedidos', rotulo: 'Pedidos' },
  { chave: 'pode_produtos', rotulo: 'Produtos/Serviços' },
  { chave: 'pode_financeiro', rotulo: 'Financeiro' },
]

const PERMS_VAZIAS: Permissoes = { pode_materia_prima: false, pode_estoque: false, pode_clientes: false, pode_pedidos: false, pode_produtos: false, pode_financeiro: false }
const VAZIO = {
  usuario: '', senha: '', nome: '', is_admin: false, permissoes: PERMS_VAZIAS,
  cpf: '', telefone: '', cargo: '', data_admissao: '', email: '',
}

export default function FuncionariosPage() {
  const perfil = usePerfil()
  if (!perfil.is_admin) {
    return <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">Sem permissão para acessar esta página.</p>
  }
  return <Gestao />
}

function Gestao() {
  const [itens, setItens] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [f, setF] = useState(VAZIO)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      setItens(await listarFuncionarios())
    } catch (e) {
      setErro(msg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const totalAdminsAtivos = itens.filter((p) => p.is_admin && p.ativo).length
  const ehUltimoAdmin = (p: Perfil) =>
    p.ativo && !podeRemoverOuRebaixarAdmin({ alvoEhAdmin: p.is_admin, totalAdminsAtivos })

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (salvando) return
    const usuario = f.usuario.trim()
    const nome = f.nome.trim()
    if (!usuario || !nome || !f.senha) {
      setErro('Informe usuário, senha e nome.')
      return
    }
    if (f.senha.length < 6) {
      setErro('A senha deve ter ao menos 6 caracteres.')
      return
    }
    setErro(null)
    setSalvando(true)
    try {
      const cadastrais: Record<string, string> = {}
      for (const k of ['cpf', 'telefone', 'cargo', 'data_admissao', 'email'] as const) {
        const v = f[k].trim()
        if (v !== '') cadastrais[k] = v
      }
      await criarFuncionario({ usuario, senha: f.senha, nome, permissoes: f.permissoes, is_admin: f.is_admin, ...cadastrais })
      setF(VAZIO)
      await carregar()
    } catch (err) {
      setErro(msg(err))
    } finally {
      setSalvando(false)
    }
  }

  async function resetar(p: Perfil) {
    const nova = window.prompt(`Nova senha para "${p.nome}" (mínimo 6 caracteres):`)?.trim()
    if (!nova) return
    if (nova.length < 6) {
      setErro('A senha deve ter ao menos 6 caracteres.')
      return
    }
    setErro(null)
    try {
      await resetarSenha(p.id, nova)
    } catch (err) {
      setErro(msg(err))
    }
  }

  async function inativar(p: Perfil) {
    if (ehUltimoAdmin(p)) {
      setErro(ERRO_ULTIMO_ADMIN)
      return
    }
    if (!window.confirm(`Inativar "${p.nome}"?`)) return
    setErro(null)
    try {
      await inativarFuncionario(p.id)
      await carregar()
    } catch (err) {
      setErro(msg(err))
    }
  }

  async function ativar(p: Perfil) {
    setErro(null)
    try {
      await ativarFuncionario(p.id)
      await carregar()
    } catch (err) {
      setErro(msg(err))
    }
  }

  const campo = 'w-full rounded border border-gray-300 px-3 py-2'

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Funcionários</h1>

      {erro && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">
          {erro}
        </p>
      )}

      <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <div>
          <label htmlFor="fn-usuario" className="block text-sm">Usuário</label>
          <input id="fn-usuario" className={campo} autoComplete="off" value={f.usuario} onChange={(e) => setF({ ...f, usuario: e.target.value })} />
        </div>
        <div>
          <label htmlFor="fn-senha" className="block text-sm">Senha</label>
          <input id="fn-senha" className={campo} type="password" autoComplete="new-password" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} />
        </div>
        <div>
          <label htmlFor="fn-nome" className="block text-sm">Nome</label>
          <input id="fn-nome" className={campo} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        </div>
        <div>
          <label htmlFor="fn-cpf" className="block text-sm">CPF</label>
          <input id="fn-cpf" className={campo} value={f.cpf} onChange={(e) => setF({ ...f, cpf: e.target.value })} />
        </div>
        <div>
          <label htmlFor="fn-tel" className="block text-sm">Telefone</label>
          <input id="fn-tel" className={campo} value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} />
        </div>
        <div>
          <label htmlFor="fn-cargo" className="block text-sm">Cargo / função</label>
          <input id="fn-cargo" className={campo} value={f.cargo} onChange={(e) => setF({ ...f, cargo: e.target.value })} />
        </div>
        <div>
          <label htmlFor="fn-adm" className="block text-sm">Data de admissão</label>
          <input id="fn-adm" className={campo} type="date" value={f.data_admissao} onChange={(e) => setF({ ...f, data_admissao: e.target.value })} />
        </div>
        <div>
          <label htmlFor="fn-email" className="block text-sm">E-mail</label>
          <input id="fn-email" className={campo} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </div>
        <fieldset className="flex flex-wrap gap-4 sm:col-span-3">
          <legend className="text-sm">Acesso aos módulos</legend>
          {MODULOS.map((m) => (
            <label key={m.chave} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={f.permissoes[m.chave]}
                onChange={(e) => setF({ ...f, permissoes: { ...f.permissoes, [m.chave]: e.target.checked } })}
              />
              {m.rotulo}
            </label>
          ))}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={f.is_admin} onChange={(e) => setF({ ...f, is_admin: e.target.checked })} />
            Administrador
          </label>
        </fieldset>
        <div>
          <button type="submit" disabled={salvando} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">
            Cadastrar
          </button>
        </div>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : itens.length === 0 ? (
        !erro && <p>Nenhum funcionário cadastrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Nome</th>
                <th>Cargo</th>
                <th>Perfil</th>
                <th>Situação</th>
                <th><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((p) => {
                const ultimo = ehUltimoAdmin(p)
                return (
                  <tr key={p.id} className="border-b">
                    <td className="py-2">{p.nome}</td>
                    <td>{p.cargo ?? '—'}</td>
                    <td>{p.is_admin ? 'Administrador' : 'Funcionário'}</td>
                    <td>{p.ativo ? 'Ativo' : <span className="font-medium text-red-700">Inativo</span>}</td>
                    <td className="space-x-2 whitespace-nowrap text-right">
                      {!p.ativo && (
                        <button type="button" className="underline" onClick={() => ativar(p)}>Ativar</button>
                      )}
                      {p.ativo && (
                        <>
                          <button type="button" className="underline" onClick={() => resetar(p)}>Resetar senha</button>
                          <button
                            type="button"
                            className="text-red-700 underline disabled:opacity-50"
                            disabled={ultimo}
                            title={ultimo ? ERRO_ULTIMO_ADMIN : undefined}
                            onClick={() => inativar(p)}
                          >
                            Inativar
                          </button>
                          {ultimo && <span className="block text-xs text-gray-600">{ERRO_ULTIMO_ADMIN}</span>}
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
