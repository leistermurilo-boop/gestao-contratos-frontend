# Story 1.3: Setup Supabase Client

**Tipo:** Setup
**Prioridade:** Crítica
**Estimativa:** 2 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Configurar clientes Supabase (browser e server), gerar types do banco de dados e validar conexão com o backend.

---

## 📋 Pré-requisitos

- [x] **Story 1.1 concluída:** Projeto Next.js inicializado
- [x] **Story 1.2 concluída:** Tailwind CSS + shadcn/ui configurados
- [ ] `.env.local` com credenciais Supabase válidas
- [ ] Supabase CLI instalado (opcional para geração de types)

---

## 📁 Arquivos a Criar

```
frontend/
├── lib/
│   └── supabase/
│       ├── client.ts              # ✅ Cliente Supabase (browser)
│       ├── server.ts              # ✅ Cliente Supabase (server)
│       └── middleware.ts          # ✅ Helper para middleware
├── types/
│   └── database.types.ts          # ✅ Types gerados do banco
└── middleware.ts                  # ✅ Auth middleware (raiz do projeto)
```

---

## 🔨 Tarefas

### 1. Criar Cliente Supabase (Browser)

Criar `frontend/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 2. Criar Cliente Supabase (Server)

Criar `frontend/lib/supabase/server.ts`:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

### 3. Criar Middleware de Autenticação

Criar `frontend/middleware.ts` (na raiz do projeto):

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

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // Rotas públicas (não requerem autenticação)
  const publicRoutes = ['/login', '/register', '/recuperar-senha', '/']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Se estiver em rota pública e já autenticado, redirecionar para dashboard
  if (isPublicRoute && request.nextUrl.pathname.startsWith('/login')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // Rotas protegidas requerem autenticação
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ⚠️ CRÍTICO: Verificar se usuário está ativo
  if (session) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('ativo, perfil')
      .eq('id', session.user.id)
      .single()

    if (!usuario?.ativo) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=inactive', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 4. Instalar Supabase CLI (Opcional)

Para gerar types automaticamente:

```bash
# Windows (usando npm)
npm install -g supabase

# Ou usando Chocolatey
choco install supabase
```

### 5. Gerar Types do Database

**Opção A: Via Supabase CLI (Recomendado)**

```bash
cd frontend
npm run generate-types
```

**Opção B: Manual (se CLI não funcionar)**

1. Acessar: https://hstlbkudwnboebmarilp.supabase.co
2. Ir em: Project Settings > API > Generate Types (TypeScript)
3. Copiar conteúdo gerado
4. Colar em `frontend/types/database.types.ts`

### 6. Criar Estrutura Básica de Types

Se a geração automática falhar, criar `frontend/types/database.types.ts` manualmente:

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          nome: string
          created_at: string
          updated_at: string
          config_json: Json | null
        }
        Insert: {
          id?: string
          nome: string
          created_at?: string
          updated_at?: string
          config_json?: Json | null
        }
        Update: {
          id?: string
          nome?: string
          created_at?: string
          updated_at?: string
          config_json?: Json | null
        }
      }
      usuarios: {
        Row: {
          id: string
          empresa_id: string
          email: string
          nome: string
          perfil: 'admin' | 'juridico' | 'financeiro' | 'compras' | 'logistica'
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          empresa_id: string
          email: string
          nome: string
          perfil: 'admin' | 'juridico' | 'financeiro' | 'compras' | 'logistica'
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          email?: string
          nome?: string
          perfil?: 'admin' | 'juridico' | 'financeiro' | 'compras' | 'logistica'
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      contratos: {
        Row: {
          id: string
          empresa_id: string
          cnpj_id: string
          numero_contrato: string
          orgao_publico: string
          cnpj_orgao: string | null
          esfera: 'municipal' | 'estadual' | 'federal' | null
          objeto: string | null
          valor_total: number
          data_assinatura: string
          data_vigencia_inicio: string
          data_vigencia_fim: string
          prorrogado: boolean
          data_vigencia_fim_prorrogacao: string | null
          indice_reajuste: string | null
          status: 'ativo' | 'concluido' | 'rescindido' | 'suspenso' | 'arquivado'
          deleted_at: string | null
          deleted_by: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        // Insert and Update types...
      }
      // Adicionar outros tipos conforme necessário
    }
  }
}
```

### 7. Criar Página de Teste de Conexão

Modificar `frontend/app/page.tsx` para testar conexão:

```typescript
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function Home() {
  const supabase = await createClient()

  // Testar conexão com query simples
  const { data: empresas, error } = await supabase
    .from('empresas')
    .select('id, nome')
    .limit(1)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Teste de Conexão Supabase</CardTitle>
          <CardDescription>Sistema de Gestão de Contratos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-semibold">❌ Erro na conexão:</p>
              <p className="text-xs text-red-600 mt-1">{error.message}</p>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 font-semibold">✅ Conexão estabelecida!</p>
              {empresas && empresas.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Empresa encontrada: {empresas[0].nome}
                </p>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>📡 URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p>🔑 Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
```

---

## ✅ Critérios de Aceitação (Done When...)

- [ ] `lib/supabase/client.ts` criado (cliente browser)
- [ ] `lib/supabase/server.ts` criado (cliente server)
- [ ] `middleware.ts` criado na raiz do projeto
- [ ] Middleware verifica autenticação e redireciona corretamente
- [ ] Middleware verifica `usuario.ativo` antes de permitir acesso
- [ ] `types/database.types.ts` gerado com types do Supabase
- [ ] Página de teste criada em `app/page.tsx`
- [ ] **Teste:** `npm run dev` inicia sem erros
- [ ] **Teste:** Página exibe "✅ Conexão estabelecida!" e nome de uma empresa
- [ ] **Teste:** Acesso a rotas protegidas redireciona para `/login`
- [ ] **Teste:** Query no Supabase retorna dados (sem erro de RLS)

---

## 🔗 Dependências

- **Story 1.1:** Projeto Next.js inicializado
- **Story 1.2:** Tailwind CSS + shadcn/ui configurados

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **NUNCA usar SERVICE_ROLE_KEY no frontend** - Apenas ANON_KEY
2. **RLS já está ativo no backend** - Queries filtram automaticamente por empresa_id
3. **Middleware verifica usuario.ativo** - Usuários inativos são deslogados automaticamente
4. **Cookies são essenciais** - Client precisa de cookies para manter sessão

### 🔍 Troubleshooting:

**Se conexão falhar:**
- Verificar `.env.local` tem URL e ANON_KEY corretos
- Verificar internet conectada
- Verificar Supabase project não está pausado

**Se RLS bloquear queries:**
- Verificar usuário está autenticado (session existe)
- Verificar RLS policies estão corretas no Supabase
- Testar query no SQL Editor do Supabase Dashboard

**Se middleware não funciona:**
- Verificar `matcher` no config do middleware
- Verificar cookies estão sendo setados
- Verificar `publicRoutes` inclui rotas de auth

**Se types não gerarem:**
- Instalar Supabase CLI global: `npm install -g supabase`
- Verificar projeto ID correto em `package.json`
- Usar opção manual (copiar do Dashboard)

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 2.1:** Auth Context (Contexto de Autenticação)

---

## 📚 Referências

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

**Status:** ⏳ Aguardando implementação
**Criado por:** @sm (River) - 2026-02-13
