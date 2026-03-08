import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

/**
 * GET /api/auth/resync
 *
 * Resincronia de sessão: quando o browser client não encontra tokens
 * (INITIAL_SESSION null + AuthSessionMissingError), o servidor ainda pode
 * ter sessão válida em cookies httpOnly inacessíveis ao JS.
 *
 * Este endpoint:
 * 1. Valida a sessão server-side via getUser()
 * 2. Se válida, copia TODOS os cookies sb-* como httpOnly:false
 *    → Caso com rotação: setAll() escreve tokens novos (têm prioridade)
 *    → Caso sem rotação: copia cookies existentes do request diretamente
 * 3. Retorna { ok: true } para que auth-context recarregue a página
 *
 * Após o reload, createBrowserClient encontra os cookies não-httpOnly
 * e INITIAL_SESSION dispara com sessão válida.
 */
export async function GET(request: NextRequest) {
  const rotatedCookies: Array<{ name: string; value: string; options?: CookieOptions }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          // Captura tokens rotacionados (access token expirado → novo par gerado)
          cookiesToSet.forEach(c => rotatedCookies.push(c))
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ ok: false })
  }

  const response = NextResponse.json({ ok: true })

  if (rotatedCookies.length > 0) {
    // Token foi rotacionado: escrever novos tokens como não-httpOnly
    rotatedCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, { ...options, httpOnly: false })
    })
  } else {
    // Token ainda válido (sem rotação): copiar cookies sb-* existentes como não-httpOnly
    // para que createBrowserClient consiga lê-los via document.cookie
    const isProduction = process.env.NODE_ENV === 'production'
    request.cookies.getAll()
      .filter(c => c.name.startsWith('sb-'))
      .forEach(c => {
        response.cookies.set(c.name, c.value, {
          path: '/',
          sameSite: 'lax',
          secure: isProduction,
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 7, // 7 dias (cobre refresh token window)
        })
      })
  }

  return response
}
