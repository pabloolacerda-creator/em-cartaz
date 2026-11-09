import { describe, it, expect } from 'vitest'
import { familia, compativel, converter, unidadesCompativeis } from './unidadesConv'

describe('conversão de unidades', () => {
  it('agrupa por família', () => {
    expect(familia('m')).toBe('comprimento')
    expect(familia('cm')).toBe('comprimento')
    expect(familia('Quilo(s)')).toBe('peso')
    expect(familia('Unidade(s)')).toBe('contagem')
    expect(familia('m²')).toBe('area')
  })

  it('converte dentro da mesma família', () => {
    expect(converter(100, 'cm', 'm')).toBe(1)
    expect(converter(1, 'm', 'cm')).toBe(100)
    expect(converter(2, 'Dúzia(s)', 'Unidade(s)')).toBe(24)
    expect(converter(500, 'Grama(s)', 'Quilo(s)')).toBe(0.5)
    expect(converter(5, 'm', 'm')).toBe(5)
  })

  it('recusa conversão entre famílias diferentes', () => {
    expect(converter(1, 'm', 'Quilo(s)')).toBeNull()
    expect(compativel('m', 'Quilo(s)')).toBe(false)
    expect(compativel('m', 'cm')).toBe(true)
  })

  it('lista unidades compatíveis com a do material', () => {
    const comp = unidadesCompativeis('m')
    expect(comp).toContain('cm')
    expect(comp).toContain('mm')
    expect(comp).toContain('m')
    expect(comp).not.toContain('Quilo(s)')
  })
})
