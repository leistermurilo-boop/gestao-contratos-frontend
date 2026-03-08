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
  // createClient() retorna singleton de módulo — seguro chamar sem useMemo
  const supabase = useMemo(() => createClient(), [])

  // Proteção de concorrência com suporte a sessão pendente.
  // Se TOKEN_REFRESHED chega enquanto INITIAL_SESSION ainda processa, a sessão
  // mais recente é armazenada e reprocessada ao final — nunca descartada.
  const processingRef = useRef(false)
  const pendingSessionRef = useRef<Session | null | undefined>(undefined)

  const processSession = async (session: Session | null) => {
    // Se já processando, armazena a sessão mais recente para processar depois
    if (processingRef.current) {
      pendingSessionRef.current = session
      return
    }
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
          supabase.auth.signOut().catch(() => null)
        }
        return
      }

      if (!usuarioData?.ativo) {
        console.warn('Usuário inativo:', usuarioData?.email)
        setUser(null)
        setUsuario(null)
        supabase.auth.signOut().catch(() => null)
        router.push('/login?error=inactive')
        return
      }

      setUsuario(usuarioData)
      // Resync bem-sucedido: limpar flag para não bloquear tentativas futuras
      sessionStorage.removeItem('auth_resync_attempted')
    } catch (err) {
      console.error('Erro inesperado em processSession:', err)
    } finally {
      processingRef.current = false
      setLoading(false)

      // Se uma sessão mais recente chegou durante o processamento (ex: TOKEN_REFRESHED
      // enquanto INITIAL_SESSION estava em andamento), processar agora.
      if (pendingSessionRef.current !== undefined) {
        const pending = pendingSessionRef.current
        pendingSessionRef.current = undefined
        // setTimeout(0) garante que o stack atual termina antes de iniciar nova execução
        setTimeout(() => processSession(pending), 0)
      }
    }
  }

  useEffect(() => {
    let initialSessionHandled = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          initialSessionHandled = true
          if (!session) {
            // Se session é null no INITIAL_SESSION, pode ser race condition de rotação
            // concorrente de tokens (outro request rotacionou antes e invalidou este).
            // Verificar com o servidor se ainda há sessão válida antes de deslogar.
            // P3: try-catch obrigatório — se getUser() lançar exceção (timeout de rede,
            // falha de DNS, etc.), processSession nunca seria chamado e loading ficaria
            // true para sempre, causando spinner infinito.
            try {
              const { data: { user: serverUser }, error } = await supabase.auth.getUser()
              if (error) {
                // AuthSessionMissingError: browser client não tem tokens (ex: rotação de token
                // consumiu refresh token de uso único em race condition de múltiplas requisições).
                // Verificar com servidor se ainda há sessão válida antes de deslogar.
                if (!sessionStorage.getItem('auth_resync_attempted')) {
                  sessionStorage.setItem('auth_resync_attempted', '1')
                  let resynced = false
                  try {
                    const controller = new AbortController()
                    const timeoutId = setTimeout(() => controller.abort(), 3000)
                    const res = await fetch('/api/auth/resync', { signal: controller.signal })
                    clearTimeout(timeoutId)
                    const { ok } = await res.json()
                    if (ok) resynced = true
                  } catch {
                    // AbortError (timeout 3s) ou falha de rede — não bloquear
                  }
                  if (resynced) {
                    window.location.reload()
                    return
                  }
                  sessionStorage.removeItem('auth_resync_attempted')
                }
                // Sem sessão no servidor (ou segunda tentativa após resync) — encerrar loading.
                console.error('Erro ao recuperar usuário no INITIAL_SESSION:', error)
                setLoading(false)
                return
              }
              if (serverUser) {
                const { data: { session: freshSession } } = await supabase.auth.getSession()
                await processSession(freshSession)
                return
              }
            } catch (err) {
              // Exceção capturada → garantir que loading não fica preso
              console.error('Exceção ao recuperar sessão no INITIAL_SESSION:', err)
              setLoading(false)
              return
            }
          }
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

    // Fallback: se INITIAL_SESSION não disparar em 1s, validar sessão com o servidor.
    // IMPORTANTE: usar getUser() (valida com servidor), NÃO getSession() (lê cache local).
    // getSession() pode retornar sessão com token expirado que ainda está no storage,
    // causando redirecionamento indevido para /dashboard sem autenticação real.
    const fallback = setTimeout(async () => {
      if (!initialSessionHandled) {
        const { data: { user: serverUser }, error } = await supabase.auth.getUser()
        if (!error && serverUser) {
          // Token válido no servidor — buscar sessão local para o processSession
          const { data: { session } } = await supabase.auth.getSession()
          await processSession(session)
        } else {
          // Sem sessão válida no servidor
          setUser(null)
          setUsuario(null)
          setLoading(false)
        }
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

    // Verificar ativo antes de retornar — bloqueia navegação para usuários inativos
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

    // Navegação é responsabilidade de quem chama signIn (login/page.tsx).
    // Isso evita dupla navegação quando há ?redirect= na URL.
  }

  const signOut = async () => {
    // Limpar estado local imediatamente (UX responsivo)
    setUser(null)
    setUsuario(null)
    // Redirecionar para a API route server-side de signout.
    // NÃO chamar supabase.auth.signOut() client-side porque:
    //   1. O client não consegue limpar cookies escritos pelo middleware server-side
    //      (atributos path/secure/sameSite podem não coincidir)
    //   2. O access token JWT permanece válido até expirar mesmo após signOut() local
    // A route /api/auth/signout:
    //   → cria client server-side com acesso real aos cookies HTTP
    //   → revoga o refresh token no Supabase Auth (scope: global)
    //   → escreve Set-Cookie headers que zeram os tokens no browser
    //   → redireciona para /login com cookies limpos
    window.location.href = '/api/auth/signout'
  }

  const refreshUser = async () => {
    // P2: Usar getUser() (valida com servidor) em vez de getSession() (lê cache local).
    // getSession() pode retornar sessão com token expirado do storage local,
    // fazendo processSession tratar uma sessão inválida como válida.
    try {
      const { data: { user: serverUser }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Erro ao validar usuário em refreshUser:', error)
        await processSession(null)
        return
      }
      if (serverUser) {
        const { data: { session } } = await supabase.auth.getSession()
        await processSession(session)
      } else {
        await processSession(null)
      }
    } catch (err) {
      console.error('Exceção em refreshUser:', err)
      await processSession(null)
    }
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
