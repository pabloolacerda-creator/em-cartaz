import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getPerfilAtual } from '../lib/auth'
import type { Perfil } from '../types'

const PerfilContext = createContext<Perfil | null>(null)

export function usePerfil(): Perfil {
  const p = useContext(PerfilContext)
  if (!p) throw new Error('usePerfil deve ser usado dentro de <RequireAuth>')
  return p
}

export default function RequireAuth({ children }: { children?: ReactNode }) {
  const [estado, setEstado] = useState<{ carregando: boolean; perfil: Perfil | null }>({
    carregando: true,
    perfil: null,
  })

  useEffect(() => {
    let ativo = true
    getPerfilAtual()
      .then((perfil) => ativo && setEstado({ carregando: false, perfil }))
      .catch(() => ativo && setEstado({ carregando: false, perfil: null }))
    return () => {
      ativo = false
    }
  }, [])

  if (estado.carregando) return null
  if (!estado.perfil || !estado.perfil.ativo) return <Navigate to="/app/login" replace />
  return <PerfilContext.Provider value={estado.perfil}>{children ?? <Outlet />}</PerfilContext.Provider>
}
