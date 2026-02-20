'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './auth-context'

interface Empresa {
  id: string
  razao_social: string
  nome_fantasia: string | null
  created_at: string
  updated_at: string
  config_json: {
    margem_alerta?: number
    prazo_vencimento_alerta?: number
    // Outras configs futuras
  } | null
}

interface EmpresaContextType {
  empresa: Empresa | null
  loading: boolean
  margemAlerta: number // Helper computed
  refreshEmpresa: () => Promise<void>
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined)

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)
  const { usuario } = useAuth()
  const supabase = createClient()

  const loadEmpresa = async () => {
    if (!usuario) {
      setEmpresa(null)
      setLoading(false)
      return
    }

    try {
      // ⚠️ REGRA RLS: Banco decide isolamento via user_belongs_to_empresa(id)
      // Query sem filtro empresa_id - RLS retorna apenas empresa permitida
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .single()

      if (error) {
        console.error('Erro ao buscar empresa:', error)
        setEmpresa(null)
        return
      }

      setEmpresa(data)
    } catch (error) {
      console.error('Erro ao carregar empresa:', error)
      setEmpresa(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (usuario) {
      loadEmpresa()
    } else {
      setEmpresa(null)
      setLoading(false)
    }
  }, [usuario])

  const refreshEmpresa = async () => {
    await loadEmpresa()
  }

  // Helper computed: margem_alerta com fallback
  const margemAlerta = empresa?.config_json?.margem_alerta ?? 10.0

  return (
    <EmpresaContext.Provider
      value={{
        empresa,
        loading,
        margemAlerta,
        refreshEmpresa,
      }}
    >
      {children}
    </EmpresaContext.Provider>
  )
}

export function useEmpresa() {
  const context = useContext(EmpresaContext)
  if (context === undefined) {
    throw new Error('useEmpresa must be used within an EmpresaProvider')
  }
  return context
}
