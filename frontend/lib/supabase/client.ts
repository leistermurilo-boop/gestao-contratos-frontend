import { createBrowserClient } from '@supabase/ssr'

// Singleton no nível de módulo — garante UMA única instância do cliente Supabase
// por sessão de browser, independente de quantas vezes o AuthProvider montar/desmontar.
// Múltiplas instâncias = múltiplos onAuthStateChange listeners = race conditions.
let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (_client) return _client
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Bypass do navigator.locks — seguro com cookie-based storage (SSR).
        // O lock de WebLocks só é necessário quando múltiplas abas competem
        // por localStorage. Com @supabase/ssr o middleware serializa os refreshes
        // de token no servidor via cookies, tornando o lock redundante.
        // Sem este bypass: múltiplos caminhos concorrentes de auth-context
        // (getSession + INITIAL_SESSION + safety timeout) travam o lock
        // exclusivo por até 10s → login falha com "LockManager timed out".
        lock: (_name: string, _timeout: number, fn: () => Promise<unknown>) => fn(),
      },
    }
  )
  return _client
}
