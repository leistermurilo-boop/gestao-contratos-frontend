import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

/**
 * GET /api/auth/resync
 *
 * Resincronia de sessão browser ↔ servidor.
 *
 * Problema: após rotação de token pelo middleware (race condition de múltiplas
 * requisições simultâneas consumindo o refresh token de uso único), o browser
 * Supabase client pode ficar sem tokens legíveis, causando AuthSessionMissingError
 * no INITIAL_SESSION — mesmo que o servidor ainda tenha sessão válida.
 *
 * Solução: valida a sessão server-side e reescreve os tokens como cookies
 * não-httpOnly, tornando-os legíveis pelo createBrowserClient.
 *
 * Chamado pelo auth-context quando INITIAL_SESSION é null + AuthSessionMissingError.
 * Após resposta { ok: true }, a página é recarregada para o browser client
 * inicializar com os novos cookies.
 */
export async function GET(request: NextRequest) {
  const cookiesToWrite: Array<{ name: string; value: string; options?: CookieOptions }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          // Coleta os cookies que o SDK quer escrever (tokens renovados)
          cookiesToSet.forEach(c => cookiesToWrite.push(c))
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  const response = NextResponse.json({ ok: !error && !!user })

  // Reescreve os tokens como cookies httpOnly: false para que createBrowserClient
  // consiga lê-los via document.cookie na próxima inicialização.
  // Sem isso, tokens escritos pelo middleware (server-side) ficam inacessíveis ao JS.
  cookiesToWrite.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, { ...options, httpOnly: false })
  })

  return response
}
