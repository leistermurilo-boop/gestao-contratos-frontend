'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Perfil = 'admin' | 'juridico' | 'financeiro' | 'compras' | 'logistica'

interface Usuario {
  id: string
  empresa_id: string
  email: string
  nome: string
  perfil: Perfil
  ativo: boolean
}

interface AuthContextType {
  user: User | null
  usuario: Usuario | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const loadUser = async () => {
    try {
      // Buscar sessão atual
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)

        // Buscar dados do usuário na tabela usuarios
        const { data: usuarioData, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Erro ao buscar usuário:', error)
          await supabase.auth.signOut()
          setUser(null)
          setUsuario(null)
          return
        }

        // ⚠️ CRÍTICO: Verificar se usuário está ativo
        if (!usuarioData.ativo) {
          console.warn('Usuário inativo:', usuarioData.email)
          await supabase.auth.signOut()
          setUser(null)
          setUsuario(null)
          router.push('/login?error=inactive')
          return
        }

        setUsuario(usuarioData)
      } else {
        setUser(null)
        setUsuario(null)
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
      setUser(null)
      setUsuario(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUsuario(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    // Verificar se usuário está ativo
    if (data.user) {
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('ativo')
        .eq('id', data.user.id)
        .single()

      if (!usuarioData?.ativo) {
        await supabase.auth.signOut()
        throw new Error('Usuário inativo. Entre em contato com o administrador.')
      }
    }

    await loadUser()
    router.push('/dashboard')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUsuario(null)
    router.push('/login')
  }

  const refreshUser = async () => {
    await loadUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        usuario,
        loading,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
