import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

/**
 * GET /api/auth/signout
 *
 * Route server-side de logout. Necessária porque o signOut() client-side
 * não consegue limpar os cookies HTTP escritos pelo middleware (que têm
 * atributos path, secure, sameSite definidos pelo Supabase SSR).
 *
 * Padrão idêntico ao middleware: response criado antes, cookies escritos
 * diretamente nele via setAll(), garantindo Set-Cookie no response final.
 */
export async function GET(request: NextRequest) {
  // Criar o redirect ANTES de instanciar o client — o setAll() escreve
  // os cookies expirados direto nessa response (mesma técnica do middleware).
  const response = NextResponse.redirect(new URL('/login', request.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          // Escreve os cookies zerados/expirados diretamente na response de redirect.
          // O browser recebe Set-Cookie headers que removem os tokens de auth.
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options ?? {})
          )
        },
      },
    }
  )

  // scope: 'global' — revoga o refresh token em TODOS os dispositivos no Supabase Auth.
  // O SDK chama setAll() com os cookies zerados após a revogação.
  await supabase.auth.signOut({ scope: 'global' })

  return response
}
