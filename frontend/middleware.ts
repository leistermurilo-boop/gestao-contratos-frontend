import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // Padrão correto: atualiza request E response para que cookies
        // refreshados sejam propagados corretamente no mesmo ciclo de request.
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1. Refresh de sessão — obrigatório para manter tokens atualizados nos cookies.
  //    NÃO fazer queries adicionais ao banco aqui: o Edge Runtime não é adequado
  //    para lógica de negócio e queries podem causar race conditions e loops.
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // 2. Rotas públicas — não requerem autenticação
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/recuperar-senha') ||
    pathname.startsWith('/callback')

  // 3. Usuário autenticado tentando acessar /login → redireciona para dashboard
  if (pathname.startsWith('/login') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 4. Rota protegida sem sessão → redireciona para login
  if (!isPublicRoute && !session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 5. Retornar response com cookies de sessão atualizados
  //    A verificação de usuario.ativo é feita no AuthContext (client-side),
  //    que já implementa signOut + redirect para /login?error=inactive.
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
