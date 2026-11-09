// Teste Deno — NÃO executado no ambiente de desenvolvimento (sem Deno). Rodar com:
//   deno test --allow-env --allow-net supabase/functions/admin-users/index.test.ts
// Requer `supabase start` com a function servida e usuários seed (um admin único e um não-admin).
// Preencha as variáveis de ambiente abaixo antes de rodar.
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

const FN = Deno.env.get('FN_URL') ?? 'http://localhost:54321/functions/v1/admin-users'
const ANON = Deno.env.get('ANON_KEY')!
const AUTH = Deno.env.get('AUTH_URL') ?? 'http://localhost:54321/auth/v1'

async function login(email: string, password: string): Promise<string> {
  const r = await fetch(`${AUTH}/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return (await r.json()).access_token
}

const chamar = (token: string, body: unknown) =>
  fetch(FN, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

Deno.test('chamador não-admin recebe 403', async () => {
  const t = await login(Deno.env.get('FUNC_EMAIL')!, Deno.env.get('FUNC_SENHA')!)
  const r = await chamar(t, { acao: 'resetar_senha', id: 'x', nova_senha: '123456' })
  assertEquals(r.status, 403)
  await r.body?.cancel()
})

Deno.test('admin cria usuário com e-mail sintético e permissões', async () => {
  const t = await login(Deno.env.get('ADMIN_EMAIL')!, Deno.env.get('ADMIN_SENHA')!)
  const usuario = `teste${Date.now()}`
  const r = await chamar(t, {
    acao: 'criar', usuario, senha: 'segredo1', nome: 'Teste',
    permissoes: { pode_materia_prima: true, pode_estoque: false, pode_clientes: false, pode_pedidos: false },
  })
  assertEquals(r.status, 200)
  await r.body?.cancel()
  const login2 = await login(`${usuario}@caldemat.local`, 'segredo1')
  assertEquals(typeof login2, 'string')
})

Deno.test('inativar o último admin retorna 409 ultimo_admin', async () => {
  const t = await login(Deno.env.get('ADMIN_EMAIL')!, Deno.env.get('ADMIN_SENHA')!)
  const r = await chamar(t, { acao: 'inativar', id: Deno.env.get('ADMIN_ID')! })
  assertEquals(r.status, 409)
  assertEquals((await r.json()).erro, 'ultimo_admin')
})
