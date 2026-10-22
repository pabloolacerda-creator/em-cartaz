import { describe, it, expect } from 'vitest'
import { periodoPreset, dentroDoPeriodo } from './periodo'

describe('periodoPreset', () => {
  const hoje = '2026-02-15'
  it('hoje', () => expect(periodoPreset('hoje', hoje)).toEqual({ de: '2026-02-15', ate: '2026-02-15' }))
  it('esse mês', () => expect(periodoPreset('mes', hoje)).toEqual({ de: '2026-02-01', ate: '2026-02-28' }))
  it('últimos 7 dias', () => expect(periodoPreset('7dias', hoje)).toEqual({ de: '2026-02-09', ate: '2026-02-15' }))
  it('últimos 30 dias', () => expect(periodoPreset('30dias', hoje)).toEqual({ de: '2026-01-17', ate: '2026-02-15' }))
})

describe('dentroDoPeriodo', () => {
  const p = { de: '2026-02-01', ate: '2026-02-28' }
  it('dentro', () => expect(dentroDoPeriodo('2026-02-10T10:00:00Z', p)).toBe(true))
  it('depois do fim', () => expect(dentroDoPeriodo('2026-03-01', p)).toBe(false))
  it('antes do início', () => expect(dentroDoPeriodo('2026-01-31', p)).toBe(false))
  it('sem limites aceita tudo', () => expect(dentroDoPeriodo('2020-01-01', { de: null, ate: null })).toBe(true))
  it('data vazia fora do filtro', () => expect(dentroDoPeriodo(null, p)).toBe(false))
})
