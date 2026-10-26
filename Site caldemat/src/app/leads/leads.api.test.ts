import { describe, it, expect, vi, beforeEach } from 'vitest'

const from = vi.fn()
vi.mock('../../lib/supabase', () => ({ supabase: { from: (...a: any[]) => from(...a) } }))

import { criarLead, listarLeads, atualizarStatusLead, lerUtms } from './leads.api'

const thenable = (result: any) => {
  const o: any = {}
  for (const k of ['select', 'eq', 'order', 'insert', 'update']) o[k] = vi.fn(() => o)
  o.then = (res: any, rej: any) => Promise.resolve(result).then(res, rej)
  return o
}

describe('leads.api', () => {
  beforeEach(() => from.mockReset())

  it('criarLead insere em leads e NÃO chama select (insert público, anon sem select)', async () => {
    const q = thenable({ data: null, error: null })
    from.mockReturnValue(q)
    await criarLead({ nome: 'João', whatsapp: '65999990000', cidade: 'Sorriso-MT' })
    expect(from).toHaveBeenCalledWith('leads')
    expect(q.insert).toHaveBeenCalledWith({ nome: 'João', whatsapp: '65999990000', cidade: 'Sorriso-MT' })
    expect(q.select).not.toHaveBeenCalled()
  })

  it('listarLeads ordena por criado_em desc', async () => {
    const rows = [{ id: '1', nome: 'A' }]
    const q = thenable({ data: rows, error: null })
    from.mockReturnValue(q)
    expect(await listarLeads()).toEqual(rows)
    expect(from).toHaveBeenCalledWith('leads')
    expect(q.order).toHaveBeenCalledWith('criado_em', { ascending: false })
  })

  it('atualizarStatusLead atualiza status por id', async () => {
    const q = thenable({ data: null, error: null })
    from.mockReturnValue(q)
    await atualizarStatusLead('L1', 'contatado')
    expect(q.update).toHaveBeenCalledWith({ status: 'contatado' })
    expect(q.eq).toHaveBeenCalledWith('id', 'L1')
  })

  it('lerUtms extrai utm_source/medium/campaign (ausentes viram null)', () => {
    expect(lerUtms('?utm_source=google&utm_medium=cpc')).toEqual({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: null,
    })
  })

  it('lança quando supabase retorna erro', async () => {
    const err = new Error('falhou')
    from.mockReturnValue(thenable({ data: null, error: err }))
    await expect(listarLeads()).rejects.toBe(err)
    await expect(criarLead({ nome: 'a', whatsapp: 'b' })).rejects.toBe(err)
    await expect(atualizarStatusLead('1', 'novo')).rejects.toBe(err)
  })
})
