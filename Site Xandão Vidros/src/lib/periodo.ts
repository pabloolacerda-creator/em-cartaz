export type Preset = 'hoje' | 'mes' | '7dias' | '30dias'
export type Periodo = { de: string | null; ate: string | null }

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function periodoPreset(preset: Preset, hojeISO: string): Periodo {
  const [a, m, d] = hojeISO.split('-').map(Number)
  switch (preset) {
    case 'hoje':
      return { de: hojeISO, ate: hojeISO }
    case 'mes':
      return { de: iso(new Date(a, m - 1, 1)), ate: iso(new Date(a, m, 0)) }
    case '7dias':
      return { de: iso(new Date(a, m - 1, d - 6)), ate: hojeISO }
    case '30dias':
      return { de: iso(new Date(a, m - 1, d - 29)), ate: hojeISO }
  }
}

// Compara só a parte de data (YYYY-MM-DD). Data vazia fica fora de qualquer filtro com limite.
export function dentroDoPeriodo(dataISO: string | null | undefined, p: Periodo): boolean {
  if (!p.de && !p.ate) return true
  if (!dataISO) return false
  const dia = dataISO.slice(0, 10)
  if (p.de && dia < p.de) return false
  if (p.ate && dia > p.ate) return false
  return true
}
