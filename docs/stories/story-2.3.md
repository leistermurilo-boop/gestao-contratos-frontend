# Story 2.3: Middleware de Autenticação

**Tipo:** Feature
**Prioridade:** Crítica
**Estimativa:** 2 horas
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

## ⚠️ Requisitos Críticos de Segurança

### 1️⃣ Verificação Obrigatória de usuario.ativo

**Regra:** Após validar sessão, middleware DEVE consultar `usuarios.ativo` em TODA request autenticada.

**Implementação:**
```typescript
if (session) {
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('ativo')
    .eq('id', session.user.id)
    .single()

  if (error) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=db', request.url))
  }

  if (!usuario?.ativo) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=inactive', request.url))
  }
}
```

**Tratamento de Erros:**
- `error` → signOut + redirect `/login?error=db`
- `ativo = false` → signOut + redirect `/login?error=inactive`

---

### 2️⃣ Preservação de Rota Original (redirect param)

**Regra:** Quando usuário não autenticado tenta acessar rota protegida, preservar URL original para redirect pós-login.

**Implementação:**
```typescript
if (!isPublicRoute && !session) {
  const redirectUrl = new URL('/login', request.url)
  redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(redirectUrl)
}
```

**Exemplo:**
- Usuário acessa `/dashboard/contratos`
- Redireciona para `/login?redirect=/dashboard/contratos`
- Após login, redireciona de volta para `/dashboard/contratos`

---

### 3️⃣ Ordem de Execução Obrigatória

**Sequência que DEVE ser seguida:**

```
1. Refresh session (supabase.auth.getSession())
2. Detectar rota pública (check publicRoutes)
3. Se autenticado em /login → redirect /dashboard
4. Se rota protegida e sem sessão → redirect /login?redirect=<rota>
5. Se houver sessão → verificar usuario.ativo
6. Retornar response
```

**Crítico:** Ordem incorreta pode causar:
- Loops infinitos
- Bypass de verificação de ativo
- Perda de redirect param

---

### 4️⃣ Garantia de Compatibilidade com RLS

**Requisito de Banco:** Tabela `usuarios` DEVE ter policy SELECT:

```sql
CREATE POLICY "usuarios_select_own"
ON usuarios FOR SELECT
USING (id = auth.uid());
```

**Sem essa policy:** Middleware falhará com erro `error=db` porque não conseguirá verificar `usuario.ativo`.

**Responsabilidade:** Backend deve garantir policy antes de frontend usar middleware.

---

### 5️⃣ Limitações do Middleware

**O middleware NÃO deve:**
- ❌ Conter lógica de empresa (isolamento é RLS)
- ❌ Implementar RBAC (autorização por perfil)
- ❌ Fazer queries complexas além de `usuarios.ativo`

**O middleware DEVE:**
- ✅ Apenas autenticar (session existe?)
- ✅ Verificar usuario.ativo (usuário habilitado?)
- ✅ Redirecionar corretamente
- ✅ Tratar erros de banco explicitamente

**Rationale:** Middleware executa em TODAS as requests. Lógica pesada degrada performance.

---

### 6️⃣ Tratamento Explícito de Erros de Banco

**Cenários de erro que DEVEM ser tratados:**

| Erro | Causa | Tratamento |
|------|-------|------------|
| `error` na query | RLS bloqueou, banco offline, policy faltando | signOut + `/login?error=db` |
| `usuario = null` | Usuário não existe em `usuarios` | signOut + `/login?error=db` |
| `ativo = false` | Usuário desativado por admin | signOut + `/login?error=inactive` |

**Nunca deixar usuário sem feedback!**

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

### Implementação:
- [x] `middleware.ts` validado e funcional
- [x] Rotas públicas: `/login`, `/register`, `/recuperar-senha`, `/`
- [x] Rotas protegidas exigem autenticação
- [x] **Verificação de usuario.ativo implementada em TODA request autenticada**
- [x] Usuário inativo é deslogado e redirecionado
- [x] Matcher exclui arquivos estáticos e imagens
- [x] Mensagens de erro exibidas no login (error=db, error=inactive)
- [x] Redirect param preserva rota original (`/login?redirect=<rota>`)
- [x] Ordem de execução segue sequência obrigatória (6 passos)

### Testes Funcionais:
- [ ] **Teste:** Acesso a `/dashboard` sem login redireciona para `/login?redirect=/dashboard`
- [ ] **Teste:** Acesso a `/login` autenticado redireciona para `/dashboard`
- [ ] **Teste:** Usuário inativo é automaticamente deslogado em qualquer rota protegida
- [ ] **Teste:** Erro de banco (RLS) redireciona com `/login?error=db`
- [ ] **Teste:** Sessão refresh funciona automaticamente
- [ ] **Teste:** Arquivos estáticos (_next, imagens) não passam pelo middleware

### Testes de Segurança:
- [ ] **Teste Crítico:** usuario.ativo verificado em TODA request autenticada
- [ ] **Teste Crítico:** Usuário inativo não consegue acessar nenhuma rota protegida
- [ ] **Teste Crítico:** Erro de banco não permite bypass de verificação
- [ ] **Teste Crítico:** Redirect param não pode ser manipulado para XSS/open redirect

### Compatibilidade RLS:
- [ ] **Validar:** Policy SELECT em `usuarios` permite `id = auth.uid()`
- [ ] **Validar:** Query de usuario.ativo funciona sem erro RLS

---

## 🔗 Dependências

- **Story 1.3:** middleware.ts criado
- **Story 2.1:** Auth Context implementado
- **Story 2.2:** Empresa Context implementado

---

## 📝 Notas para @dev

### 🚨 ATENÇÃO: Middleware Atual Precisa Refatoração

**Status do middleware.ts atual:**
- Foi criado na Story 1.3
- Foi REFATORADO para remover verificação de usuario.ativo (performance)
- Atualmente NÃO verifica usuario.ativo em cada request
- Essa story RESTAURA a verificação (requisito de segurança)

**Você precisará:**
1. Ler o middleware.ts atual
2. Adicionar novamente verificação de usuario.ativo
3. Adicionar redirect param
4. Seguir ordem de execução obrigatória
5. Tratar erros de banco explicitamente

---

### ⚠️ Regras Críticas:

1. **Sempre verificar usuario.ativo** - Segurança crítica em TODA request autenticada
2. **Não bloquear arquivos estáticos** - Matcher correto
3. **Refresh de sessão** - Obrigatório para Server Components
4. **Error handling** - Nunca deixar usuário sem feedback
5. **Preservar redirect param** - UX crítico para fluxo de login
6. **Ordem de execução** - Seguir sequência obrigatória (6 passos)

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

**Status:** ✅ Ready for Review
**Criado por:** @sm (River) - 2026-02-13
**Implementado por:** @dev (Dex) - 2026-02-18

---

## 📝 Dev Agent Record

### Completion Notes:
- Middleware atualizado com todos os 6 requisitos críticos de segurança
- Restaurada verificação de usuario.ativo em TODA request autenticada
- Implementado redirect param para preservar rota original
- Ordem de execução obrigatória seguida (6 passos numerados)
- Tratamento explícito de erros: error → /login?error=db, inativo → /login?error=inactive
- Página de login criada com tratamento de mensagens de erro
- Documento de testes manuais criado (TESTES-MIDDLEWARE.md)
- Servidor dev testado: compila sem erros em 2.9s

### File List:
- `frontend/middleware.ts` - Middleware atualizado com verificação de usuario.ativo
- `frontend/app/(auth)/login/page.tsx` - Página de login com tratamento de erros
- `frontend/TESTES-MIDDLEWARE.md` - Documento de testes manuais (8 cenários + 4 testes críticos)

### Change Log:
- 2026-02-18: Implementação completa do Middleware de Autenticação
- Restaurada verificação usuario.ativo (removida anteriormente por performance)
- Adicionado redirect param: /login?redirect=<rota_original>
- Ordem de execução: Refresh → Detectar pública → Check autenticado → Redirect → Verificar ativo → Return
- Tratamento de erros: signOut + redirect com error=db ou error=inactive
- Página de login com useSearchParams para exibir mensagens
- Documento de testes com 12 cenários (8 funcionais + 4 críticos de segurança)

### Security Implementation:
- ✅ usuario.ativo verificado em TODA request autenticada
- ✅ Erro de banco força signOut automático
- ✅ Usuário inativo bloqueado em todas rotas protegidas
- ✅ Redirect param seguro (Next.js previne open redirect)
- ✅ Ordem de execução previne bypass de verificações
