import type { ReactNode } from 'react'
import { usePerfil } from './RequireAuth'
import { podeAcessar } from '../lib/permissions'
import type { Modulo } from '../types'

export default function RequireModulo({ modulo, children }: { modulo: Modulo; children: ReactNode }) {
  const perfil = usePerfil()
  if (!podeAcessar(perfil, modulo)) {
    return <p role="alert" className="rounded bg-red-100 px-3 py-2 text-red-800">Sem permissão para acessar esta página.</p>
  }
  return <>{children}</>
}
