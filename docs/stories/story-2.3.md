# Story 2.3: Middleware de Autenticação

**Tipo:** Feature
**Prioridade:** Crítica
**Estimativa:** 1 hora
**Responsável:** @dev

---

## 🎯 Objetivo

Validar e testar o middleware de autenticação já criado na Story 1.3, garantindo proteção de rotas e verificação de `usuario.ativo`.

---

## 📋 Pré-requisitos

- [x] **Story 1.3 concluída:** middleware.ts criado
- [x] **Story 2.1 concluída:** Auth Context implementado
- [x] **Story 2.2 concluída:** Empresa Context implementado

---

## 📁 Arquivos a Validar

```
frontend/
└── middleware.ts                  # ✏️ Validar e ajustar se necessário
```

---

## 🔨 Tarefas

### 1. Revisar middleware.ts

O arquivo `middleware.ts` já foi criado na Story 1.3. Validar que contém:

**Funcionalidades obrigatórias:**
- ✅ Refresh de sessão automático
- ✅ Rotas públicas: `/login`, `/register`, `/recuperar-senha`, `/`
- ✅ Redirecionamento para `/dashboard` se autenticado em rota pública
- ✅ Redirecionamento para `/login` se não autenticado em rota protegida
- ✅ **Verificação de `usuario.ativo`**
- ✅ Signout automático se usuário inativo
- ✅ Matcher correto (exclui arquivos estáticos)

### 2. Ajustes no Middleware (se necessário)

Se o middleware precisa de ajustes, modificar `frontend/middleware.ts`:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session
  const { data: { session } } = await supabase.auth.getSession()

  // Rotas públicas
  const publicRoutes = ['/login', '/register', '/recuperar-senha', '/']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route)
  )

  // Se autenticado em rota de login, redirecionar para dashboard
  if (request.nextUrl.pathname.startsWith('/login') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Se não autenticado em rota protegida, redirecionar para login
  if (!isPublicRoute && !session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // ⚠️ CRÍTICO: Verificar usuario.ativo
  if (session) {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('ativo, perfil')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.error('Erro ao verificar usuário:', error)
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=db', request.url))
    }

    if (!usuario?.ativo) {
      console.warn('Usuário inativo tentou acessar:', usuario)
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=inactive', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 3. Criar Testes Manuais

Documentar cenários de teste:

**Cenário 1: Usuário não autenticado tenta acessar rota protegida**
- Ação: Navegar para `/dashboard` sem login
- Esperado: Redireciona para `/login`

**Cenário 2: Usuário autenticado acessa rota de login**
- Ação: Fazer login e tentar acessar `/login` novamente
- Esperado: Redireciona para `/dashboard`

**Cenário 3: Usuário inativo tenta acessar sistema**
- Ação: Login com usuário marcado como `ativo = false`
- Esperado: Redireciona para `/login?error=inactive`

**Cenário 4: Sessão expirada**
- Ação: Aguardar expiração do token JWT
- Esperado: Redireciona para `/login` automaticamente

**Cenário 5: Rotas públicas sem autenticação**
- Ação: Acessar `/`, `/login` sem estar autenticado
- Esperado: Acesso permitido

### 4. Implementar Mensagens de Erro no Login

Modificar `frontend/app/(auth)/login/page.tsx` para exibir mensagens de erro:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'inactive') {
      setErrorMessage('Sua conta está inativa. Entre em contato com o administrador.')
    } else if (error === 'db') {
      setErrorMessage('Erro ao verificar suas credenciais. Tente novamente.')
    }
  }, [searchParams])

  return (
    <div>
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {/* Resto do formulário de login */}
    </div>
  )
}
```

---

## ✅ Critérios de Aceitação (Done When...)

- [ ] `middleware.ts` validado e funcional
- [ ] Rotas públicas: `/login`, `/register`, `/recuperar-senha`, `/`
- [ ] Rotas protegidas exigem autenticação
- [ ] **Verificação de usuario.ativo implementada**
- [ ] Usuário inativo é deslogado e redirecionado
- [ ] Matcher exclui arquivos estáticos e imagens
- [ ] Mensagens de erro exibidas no login
- [ ] **Teste:** Acesso a `/dashboard` sem login redireciona para `/login`
- [ ] **Teste:** Acesso a `/login` autenticado redireciona para `/dashboard`
- [ ] **Teste:** Usuário inativo redireciona com mensagem de erro
- [ ] **Teste:** Sessão refresh funciona automaticamente
- [ ] **Teste:** Arquivos estáticos (_next, imagens) não passam pelo middleware

---

## 🔗 Dependências

- **Story 1.3:** middleware.ts criado
- **Story 2.1:** Auth Context implementado
- **Story 2.2:** Empresa Context implementado

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **Sempre verificar usuario.ativo** - Segurança crítica
2. **Não bloquear arquivos estáticos** - Matcher correto
3. **Refresh de sessão** - Obrigatório para Server Components
4. **Error handling** - Nunca deixar usuário sem feedback

### 🔍 Troubleshooting:

**Se middleware não executa:**
- Verificar `config.matcher` está correto
- Verificar arquivo está na raiz do projeto (não em /app)
- Reiniciar servidor dev

**Se loops infinitos:**
- Verificar rotas públicas incluem `/login`
- Verificar redirecionamento não cai em loop

**Se RLS bloqueia:**
- Verificar policy em `usuarios` permite SELECT por auth.uid()

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 2.4:** Páginas de Autenticação

---

**Status:** ⏳ Aguardando implementação
**Criado por:** @sm (River) - 2026-02-13
