import { describe, it, expect, vi, beforeEach } from 'vitest'

const m = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
}))

vi.mock('./supabase', () => ({
  supabase: {
    auth: { signInWithPassword: m.signInWithPassword, signOut: m.signOut, getUser: m.getUser },
    from: m.from,
  },
}))

import { usuarioParaEmail, entrar, sair, getPerfilAtual } from './auth'

beforeEach(() => {
  vi.resetAllMocks()
  m.eq.mockReturnValue({ maybeSingle: m.maybeSingle })
  m.select.mockReturnValue({ eq: m.eq })
  m.from.mockReturnValue({ select: m.select })
})

describe('usuarioParaEmail', () => {
  it('minúsculas e domínio local', () => {
    expect(usuarioParaEmail('Joao')).toBe('joao@xandaovidros.local')
  })
  it('remove espaços nas pontas', () => {
    expect(usuarioParaEmail('  Maria ')).toBe('maria@xandaovidros.local')
  })
})

describe('entrar', () => {
  it('erro do supabase vira mensagem genérica', async () => {
    m.signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    expect(await entrar('joao', 'errada')).toEqual({ erro: 'Usuário ou senha inválidos' })
  })
  it('mesma mensagem para qualquer tipo de erro', async () => {
    m.signInWithPassword.mockResolvedValue({ error: { message: 'User not found' } })
    const a = await entrar('naoexiste', 'x')
    m.signInWithPassword.mockResolvedValue({ error: { message: 'Wrong password' } })
    const b = await entrar('joao', 'y')
    expect(a).toEqual(b)
  })
  it('sucesso retorna {} com email mapeado', async () => {
    m.signInWithPassword.mockResolvedValue({ error: null })
    expect(await entrar('Joao', 'segredo')).toEqual({})
    expect(m.signInWithPassword).toHaveBeenCalledWith({
      email: 'joao@xandaovidros.local',
      password: 'segredo',
    })
  })
})

describe('sair', () => {
  it('chama signOut', async () => {
    m.signOut.mockResolvedValue({ error: null })
    await sair()
    expect(m.signOut).toHaveBeenCalledOnce()
  })
})

describe('getPerfilAtual', () => {
  it('null sem sessão', async () => {
    m.getUser.mockResolvedValue({ data: { user: null }, error: null })
    expect(await getPerfilAtual()).toBeNull()
    expect(m.from).not.toHaveBeenCalled()
  })
  it('retorna a linha de perfis do usuário', async () => {
    const perfil = { id: 'u1', nome: 'Joao', is_admin: false, ativo: true }
    m.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    m.maybeSingle.mockResolvedValue({ data: perfil, error: null })
    expect(await getPerfilAtual()).toEqual(perfil)
    expect(m.from).toHaveBeenCalledWith('perfis')
    expect(m.eq).toHaveBeenCalledWith('id', 'u1')
  })
  it('null se não há linha de perfil', async () => {
    m.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    m.maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await getPerfilAtual()).toBeNull()
  })
})
