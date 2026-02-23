import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // IMPORTANTE: usar supabaseResponse como variável única — nunca criar novo
  // NextResponse.next() dentro de setAll(), pois isso descartaria cookies já escritos.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // setAll() é chamado em lote — todos os cookies (access + refresh token)
        // são escritos na mesma instância de supabaseResponse, sem perdas.
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options ?? {})
          )
        },
      },
    }
  )

  // getUser() valida o token com o servidor Supabase (mais seguro que getSession()).
  // Se o access token expirou, utiliza o refresh token para renová-lo automaticamente
  // e os novos cookies são escritos via setAll() acima.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/recuperar-senha') ||
    pathname.startsWith('/callback')

  // Usuário autenticado tentando acessar /login → redireciona para dashboard
  if (pathname.startsWith('/login') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Rota protegida sem sessão → redireciona para login
  if (!isPublicRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // IMPORTANTE: retornar supabaseResponse (não NextResponse.next()) para garantir
  // que os Set-Cookie headers com os tokens renovados cheguem ao browser.
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
