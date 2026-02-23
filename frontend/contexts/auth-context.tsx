'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { type Session, type User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { type Perfil } from '@/lib/constants/perfis'

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
  const supabase = useMemo(() => createClient(), [])

  // Proteção de concorrência: impede execuções sobrepostas de processSession
  const processingRef = useRef(false)

  /**
   * Processa uma sessão recebida do onAuthStateChange.
   * Recebe a session diretamente para evitar uma segunda chamada getSession().
   * Usa flag de concorrência para garantir que apenas uma execução rode por vez.
   */
  const processSession = async (session: Session | null) => {
    // Se já há uma execução em andamento, ignora a nova — evita race condition
    if (processingRef.current) return
    processingRef.current = true

    try {
      if (!session?.user) {
        setUser(null)
        setUsuario(null)
        return
      }

      setUser(session.user)

      const { data: usuarioData, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        // PGRST116 = nenhuma linha encontrada → usuário não existe na tabela
        // Outros erros (timeout, rede) → NÃO fazer signOut, apenas manter estado
        if (error.code === 'PGRST116') {
          console.error('Usuário autenticado mas sem registro na tabela usuarios:', session.user.id)
          setUser(null)
          setUsuario(null)
          // signOut sem await para não bloquear — falha silenciosa aceitável aqui
          supabase.auth.signOut().catch(() => null)
        }
        // Erro de rede ou outro erro temporário: não deslogar, loading termina normalmente
        return
      }

      if (!usuarioData?.ativo) {
        console.warn('Usuário inativo:', usuarioData?.email)
        setUser(null)
        setUsuario(null)
        // signOut sem await — se falhar, o estado já está limpo
        supabase.auth.signOut().catch(() => null)
        router.push('/login?error=inactive')
        return
      }

      setUsuario(usuarioData)
    } catch (err) {
      // Erro inesperado: logar mas não deslogar (pode ser problema de rede temporário)
      console.error('Erro inesperado em processSession:', err)
    } finally {
      processingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    let initialSessionHandled = false

    // onAuthStateChange como fonte principal de verdade.
    // INITIAL_SESSION dispara imediatamente ao subscrevere com a sessão atual.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          initialSessionHandled = true
          await processSession(session)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await processSession(session)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUsuario(null)
          setLoading(false)
        }
      }
    )

    // Fallback: se INITIAL_SESSION não disparar em 1s (edge case de rede/SDK),
    // busca a sessão diretamente via getSession() para não ficar em loading infinito.
    const fallback = setTimeout(async () => {
      if (!initialSessionHandled) {
        const { data: { session } } = await supabase.auth.getSession()
        await processSession(session)
      }
    }, 1000)

    return () => {
      clearTimeout(fallback)
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) throw error

    // Verificar ativo antes de navegar (onAuthStateChange vai processar em paralelo,
    // mas queremos bloquear a navegação se o usuário estiver inativo)
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

    router.push('/dashboard')
  }

  const signOut = async () => {
    // Limpar estado local antes do signOut para evitar janela de estado inconsistente
    setUser(null)
    setUsuario(null)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    await processSession(session)
  }

  return (
    <AuthContext.Provider value={{ user, usuario, loading, signIn, signOut, refreshUser }}>
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
