import { createBrowserClient } from '@supabase/ssr'

// Singleton no nível de módulo — garante UMA única instância do cliente Supabase
// por sessão de browser, independente de quantas vezes o AuthProvider montar/desmontar.
// Múltiplas instâncias = múltiplos onAuthStateChange listeners = race conditions.
let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (_client) return _client
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return _client
}
