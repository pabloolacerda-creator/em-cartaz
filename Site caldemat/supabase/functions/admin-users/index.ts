// Edge Function (Deno) — gestão de usuários, somente admin.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (injetadas pelo Supabase; secret SERVICE_ROLE_KEY aceito como alternativa).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Mesma regra pura usada pela página (_shared/adminGuard.ts, sem dependências).
import { podeRemoverOuRebaixarAdmin } from '../_shared/adminGuard.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const PERMS = ['pode_materia_prima', 'pode_estoque', 'pode_clientes', 'pode_pedidos'] as const
// Dados cadastrais opcionais do funcionário (gravados em perfis quando informados).
const CADASTRAIS = ['cpf', 'telefone', 'cargo', 'data_admissao', 'email'] as const

// deno-lint-ignore no-explicit-any
type Admin = any

async function contarAdminsAtivos(admin: Admin): Promise<number> {
  const { count, error } = await admin
    .from('perfis')
    .select('id', { count: 'exact', head: true })
    .eq('is_admin', true)
    .eq('ativo', true)
  if (error) throw error
  return count ?? 0
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json(405, { erro: 'metodo_nao_permitido' })

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY')!
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  // 1) Autenticação: o chamador vem do JWT, nunca do corpo.
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json(401, { erro: 'nao_autenticado' })
  const { data: u, error: eu } = await admin.auth.getUser(token)
  if (eu || !u?.user) return json(401, { erro: 'nao_autenticado' })

  // 2) Autorização: precisa ser admin ATIVO segundo a tabela perfis.
  const { data: eu_perfil } = await admin.from('perfis').select('is_admin, ativo').eq('id', u.user.id).maybeSingle()
  if (!eu_perfil?.is_admin || !eu_perfil.ativo) return json(403, { erro: 'proibido' })

  let body: Record<string, any>
  try {
    body = await req.json()
  } catch {
    return json(400, { erro: 'json_invalido' })
  }

  try {
    switch (body.acao) {
      case 'criar': {
        const usuario = String(body.usuario ?? '').trim().toLowerCase()
        const senha = String(body.senha ?? '')
        const nome = String(body.nome ?? '').trim()
        if (!/^[a-z0-9._-]+$/.test(usuario) || senha.length < 6 || !nome) return json(400, { erro: 'dados_invalidos' })
        const flags: Record<string, boolean> = {}
        for (const k of PERMS) flags[k] = body.permissoes?.[k] === true
        // Dados cadastrais informados (os demais ficam nulos).
        const cadastrais: Record<string, string> = {}
        for (const k of CADASTRAIS) {
          const v = body[k]
          if (typeof v === 'string' && v.trim() !== '') cadastrais[k] = v.trim()
        }

        const { data: criado, error } = await admin.auth.admin.createUser({
          email: `${usuario}@caldemat.local`,
          password: senha,
          email_confirm: true,
        })
        if (error || !criado?.user) return json(400, { erro: 'falha_criar', detalhe: error?.message })
        const { error: ep } = await admin
          .from('perfis')
          .upsert({ id: criado.user.id, nome, is_admin: body.is_admin === true, ativo: true, ...flags, ...cadastrais })
        if (ep) {
          await admin.auth.admin.deleteUser(criado.user.id) // não deixa usuário órfão sem perfil
          return json(500, { erro: 'falha_perfil', detalhe: ep.message })
        }
        return json(200, { ok: true, id: criado.user.id })
      }

      case 'resetar_senha': {
        const id = String(body.id ?? '')
        const nova = String(body.nova_senha ?? '')
        if (!id || nova.length < 6) return json(400, { erro: 'dados_invalidos' })
        const { error } = await admin.auth.admin.updateUserById(id, { password: nova })
        if (error) return json(400, { erro: 'falha_resetar', detalhe: error.message })
        return json(200, { ok: true })
      }

      case 'inativar':
      case 'atualizar': {
        // 'atualizar' = rebaixar/promover (is_admin) e/ou trocar permissões; 'inativar' = ativo=false.
        const id = String(body.id ?? '')
        if (!id) return json(400, { erro: 'dados_invalidos' })
        const { data: alvo } = await admin.from('perfis').select('is_admin, ativo').eq('id', id).maybeSingle()
        if (!alvo) return json(404, { erro: 'nao_encontrado' })

        const patch: Record<string, boolean> = {}
        if (body.acao === 'inativar') patch.ativo = false
        else {
          if (typeof body.is_admin === 'boolean') patch.is_admin = body.is_admin
          for (const k of PERMS) if (typeof body.permissoes?.[k] === 'boolean') patch[k] = body.permissoes[k]
        }

        // Lockout: só relevante se um admin ATIVO deixaria de ser admin ativo.
        const perdeAdmin = alvo.is_admin && alvo.ativo && (patch.ativo === false || patch.is_admin === false)
        if (perdeAdmin) {
          const total = await contarAdminsAtivos(admin)
          if (!podeRemoverOuRebaixarAdmin({ alvoEhAdmin: true, totalAdminsAtivos: total })) {
            return json(409, { erro: 'ultimo_admin' })
          }
        }

        const { error } = await admin.from('perfis').update(patch).eq('id', id)
        if (error) return json(500, { erro: 'falha_atualizar', detalhe: error.message })
        if (patch.ativo === false) {
          // Bloqueia login também no Auth (~100 anos).
          await admin.auth.admin.updateUserById(id, { ban_duration: '876000h' })
        }
        return json(200, { ok: true })
      }

      case 'ativar': {
        // Reativa: remove o ban no Auth e marca perfis.ativo=true (mesma autorização admin acima).
        const id = String(body.id ?? '')
        if (!id) return json(400, { erro: 'dados_invalidos' })
        const { data: alvo } = await admin.from('perfis').select('id').eq('id', id).maybeSingle()
        if (!alvo) return json(404, { erro: 'nao_encontrado' })
        const { error: eb } = await admin.auth.admin.updateUserById(id, { ban_duration: 'none' })
        if (eb) return json(400, { erro: 'falha_ativar', detalhe: eb.message })
        const { error } = await admin.from('perfis').update({ ativo: true }).eq('id', id)
        if (error) return json(500, { erro: 'falha_atualizar', detalhe: error.message })
        return json(200, { ok: true })
      }

      default:
        return json(400, { erro: 'acao_invalida' })
    }
  } catch (e) {
    return json(500, { erro: 'erro_interno', detalhe: e instanceof Error ? e.message : String(e) })
  }
}

if (import.meta.main) Deno.serve(handler)
