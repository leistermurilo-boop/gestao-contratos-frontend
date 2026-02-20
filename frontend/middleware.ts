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
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1. Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession()

  // 2. Define rotas públicas (não requerem autenticação)
  const isPublicRoute =
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/cadastro') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/recuperar-senha') ||
    request.nextUrl.pathname.startsWith('/callback') // Callback do Supabase (reset senha, OAuth)

  // 3. Se em /login e já autenticado → redireciona para dashboard
  if (request.nextUrl.pathname.startsWith('/login') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 4. Se rota protegida e não autenticado → redireciona para login com redirect param
  if (!isPublicRoute && !session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 5. ⚠️ CRÍTICO: Verificar usuario.ativo em TODA request autenticada
  if (session) {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('ativo')
      .eq('id', session.user.id)
      .single()

    // Erro de banco ou RLS → signOut + redirect com error=db
    if (error || !usuario) {
      console.error('Erro ao verificar usuário:', error)
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=db', request.url))
    }

    // Usuário inativo → signOut + redirect com error=inactive
    if (!usuario.ativo) {
      console.warn('Usuário inativo tentou acessar:', session.user.id)
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=inactive', request.url))
    }
  }

  // 6. Retornar response
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
