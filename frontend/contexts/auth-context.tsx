'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { type AuthChangeEvent, type Session, type User } from '@supabase/supabase-js'
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
          // NÃO chamar supabase.auth.signOut() client-side — limpa os cookies via
          // document.cookie e destrói a sessão. Redirecionar para signout server-side
          // que revoga o token corretamente sem apagar cookies de forma parcial.
          window.location.href = '/api/auth/signout'
        }
        return
      }

      if (!usuarioData?.ativo) {
        console.warn('Usuário inativo:', usuarioData?.email)
        setUser(null)
        setUsuario(null)
        // Mesma razão: usar signout server-side para garantir revogação completa
        window.location.href = '/api/auth/signout?error=inactive'
        return
      }

      setUsuario(usuarioData)
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
    let active = true
    // Garante processamento único na inicialização — evita duplo processSession
    // se getSession() e INITIAL_SESSION chegarem próximos um do outro.
    let resolved = false
    // Rastreia se setLoading(false) já foi chamado — usado pelo hard safety timeout
    // para decidir se deve intervir sem depender do estado React (leitura async).
    let loadingSettled = false

    // Resolver a sessão inicial — chamado pelo primeiro caminho que obtiver resultado.
    // Caminhos possíveis (em ordem de rapidez):
    //   A) getSession() retorna sessão válida (cookie em memória já inicializado)
    //   B) INITIAL_SESSION dispara com sessão válida (init async do cliente concluída)
    //   C) SIGNED_IN / TOKEN_REFRESHED chega antes de INITIAL_SESSION (raro)
    //   D) Safety timeout 4s → getUser() como último recurso
    //
    // Se getSession() retornar null, NÃO resolvemos — aguardamos INITIAL_SESSION que
    // pode ter a sessão quando a init async do createBrowserClient terminar.
    // INITIAL_SESSION resolve com null apenas se o browser client confirmar sem sessão.
    const initResolve = async (session: Session | null) => {
      if (!active || resolved) return
      resolved = true
      try {
        await processSession(session)
      } catch (err) {
        // processSession tem try/catch/finally próprio — este catch é last-resort
        // para erros síncronos inesperados antes do try interno (improvável mas possível).
        console.error('Erro inesperado em initResolve:', err)
        if (active) {
          loadingSettled = true
          setLoading(false)
        }
      }
      // Marcar que o ciclo de loading foi concluído (setLoading(false) foi chamado
      // pelo finally de processSession ou pelo catch acima).
      loadingSettled = true
    }

    // Registrar onAuthStateChange PRIMEIRO — garante que INITIAL_SESSION
    // não seja disparado antes do listener existir.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!active) return
        if (event === 'INITIAL_SESSION') {
          // INITIAL_SESSION é a fonte de verdade para a sessão inicial.
          // Chega depois da init async do createBrowserClient terminar de ler os cookies.
          await initResolve(session)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (!resolved) {
            // SIGNED_IN chegou antes de INITIAL_SESSION (ex: login simultâneo)
            await initResolve(session)
          } else {
            // Pós-inicialização: sessão atualizada (ex: refresh de token)
            await processSession(session)
          }
        } else if (event === 'SIGNED_OUT') {
          resolved = true
          setUser(null)
          setUsuario(null)
          setLoading(false)
        }
      }
    )

    // Fast path: se o createBrowserClient já tiver a sessão em memória
    // (comum na 1ª carga), getSession() retorna antes de INITIAL_SESSION.
    // Se retornar null — ignorar e aguardar INITIAL_SESSION (o cliente ainda
    // pode estar inicializando os cookies assincronamente).
    supabase.auth.getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (data.session) initResolve(data.session)
      })
      .catch(() => { /* ignorar — INITIAL_SESSION cobrirá */ })

    // Safety timeout em dois estágios:
    //
    // Estágio 1 (4s): se resolved=false, nenhum caminho resolveu ainda →
    //   tentar getUser() (request ao servidor) como último recurso.
    //   Cobre: INITIAL_SESSION nunca disparou (bug do SDK) ou getSession() travado.
    //
    // Estágio 2 (8s): se resolved=true mas loadingSettled=false, initResolve
    //   foi chamada mas processSession não completou (stalled ou erro silencioso) →
    //   forçar setLoading(false) para desbloquear o spinner.
    //   Cobre: resolved=true bloqueia todos os caminhos mas loading ainda está preso.
    const safetyTimeout = setTimeout(async () => {
      if (!active) return

      if (!resolved) {
        // Estágio 1: nenhum caminho resolveu — tentar servidor
        try {
          const { data: { user: u } } = await supabase.auth.getUser()
          if (!active || resolved) return
          if (u) {
            const { data: { session } } = await supabase.auth.getSession()
            await initResolve(session ?? null)
          } else {
            await initResolve(null)
          }
        } catch {
          if (active && !resolved) await initResolve(null)
        }
      } else if (!loadingSettled) {
        // Estágio 2: initResolve foi chamada mas loading ainda está preso
        // (processSession stalled ou erro antes do finally) — forçar fim do spinner.
        console.error('Auth safety: loading não resolveu em 8s após initResolve, forçando fim')
        loadingSettled = true
        setLoading(false)
      }
    }, 4000)

    // Hard safety (8s): se depois de 4s + tempo de getUser() o loading ainda estiver
    // preso com resolved=true, forçar fim definitivo.
    const hardSafetyTimeout = setTimeout(() => {
      if (!active || loadingSettled) return
      console.error('Auth hard safety: forçando setLoading(false) após 8s')
      loadingSettled = true
      setLoading(false)
    }, 8000)

    return () => {
      active = false
      clearTimeout(safetyTimeout)
      clearTimeout(hardSafetyTimeout)
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
