# Story 2.1: Auth Context

**Tipo:** Feature
**Prioridade:** Crítica
**Estimativa:** 3 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Criar contexto de autenticação global que gerencia login, logout, sessão do usuário e verificação de `usuario.ativo`.

---

## 📋 Pré-requisitos

- [x] **Story 1.3 concluída:** Supabase Client configurado
- [ ] Usuário de teste criado no Supabase Auth

---

## 📁 Arquivos a Criar

```
frontend/
├── contexts/
│   └── auth-context.tsx           # ✅ Contexto de autenticação
└── app/
    └── layout.tsx                 # ✏️ Modificar (adicionar AuthProvider)
```

---

## 🔨 Tarefas

### 1. Criar Auth Context

Criar `frontend/contexts/auth-context.tsx`:

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Perfil = 'admin' | 'juridico' | 'financeiro' | 'compras' | 'logistica'

interface Usuario {
  id: string
  empresa_id: string
  email: string
  nome: string
  perfil: Perfil
  ativo: boolean
}

interface AuthContextType {
  user: User | null
  usuario: Usuario | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const loadUser = async () => {
    try {
      // Buscar sessão atual
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)

        // Buscar dados do usuário na tabela usuarios
        const { data: usuarioData, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Erro ao buscar usuário:', error)
          await supabase.auth.signOut()
          setUser(null)
          setUsuario(null)
          return
        }

        // ⚠️ CRÍTICO: Verificar se usuário está ativo
        if (!usuarioData.ativo) {
          console.warn('Usuário inativo:', usuarioData.email)
          await supabase.auth.signOut()
          setUser(null)
          setUsuario(null)
          router.push('/login?error=inactive')
          return
        }

        setUsuario(usuarioData)
      } else {
        setUser(null)
        setUsuario(null)
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
      setUser(null)
      setUsuario(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUsuario(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    // Verificar se usuário está ativo
    if (data.user) {
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('ativo')
        .eq('id', data.user.id)
        .single()

      if (!usuarioData?.ativo) {
        await supabase.auth.signOut()
        throw new Error('Usuário inativo. Entre em contato com o administrador.')
      }
    }

    await loadUser()
    router.push('/dashboard')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUsuario(null)
    router.push('/login')
  }

  const refreshUser = async () => {
    await loadUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        usuario,
        loading,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### 2. Adicionar Provider ao Layout Root

Modificar `frontend/app/layout.tsx`:

```typescript
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gestão de Contratos",
  description: "Sistema de gestão de contratos multi-tenant",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 3. Criar Hook de Teste

Criar página de teste temporária em `frontend/app/test-auth/page.tsx`:

```typescript
'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuthPage() {
  const { user, usuario, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Auth Context - Teste</CardTitle>
          <CardDescription>Verificação de autenticação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
                <p className="text-sm font-semibold text-green-800">✅ Autenticado</p>
                <div className="text-xs text-green-700 space-y-1">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                </div>
              </div>

              {usuario && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                  <p className="text-sm font-semibold text-blue-800">👤 Dados do Usuário</p>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p><strong>Nome:</strong> {usuario.nome}</p>
                    <p><strong>Perfil:</strong> {usuario.perfil}</p>
                    <p><strong>Empresa ID:</strong> {usuario.empresa_id}</p>
                    <p><strong>Ativo:</strong> {usuario.ativo ? 'Sim' : 'Não'}</p>
                  </div>
                </div>
              )}

              <Button onClick={signOut} variant="destructive" className="w-full">
                Sair
              </Button>
            </>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">⚠️ Não autenticado</p>
              <p className="text-xs text-yellow-600 mt-1">Faça login para testar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## ✅ Critérios de Aceitação (Done When...)

- [ ] `contexts/auth-context.tsx` criado com AuthProvider
- [ ] Context expõe: user, usuario, loading, signIn, signOut, refreshUser
- [ ] AuthProvider adicionado ao layout root
- [ ] Hook `useAuth()` funciona em qualquer componente
- [ ] **Verificação de usuario.ativo implementada**
- [ ] Usuário inativo é deslogado automaticamente
- [ ] State de loading funciona corretamente
- [ ] onAuthStateChange escuta mudanças de sessão
- [ ] **Teste:** Login com usuário ativo exibe dados corretos
- [ ] **Teste:** Login com usuário inativo redireciona para /login?error=inactive
- [ ] **Teste:** signOut limpa state e redireciona
- [ ] **Teste:** Página /test-auth exibe dados do usuário autenticado

---

## 🔗 Dependências

- **Story 1.3:** Supabase Client configurado

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **NUNCA passar empresa_id manualmente** - RLS filtra automaticamente
2. **Sempre verificar usuario.ativo** - Deslogar se inativo
3. **Loading state é essencial** - Evita flash de conteúdo
4. **Error handling** - Tratar erros de auth gracefully

### 🔍 Troubleshooting:

**Se usuário não carrega:**
- Verificar RLS policy em `usuarios` permite SELECT
- Verificar tabela `usuarios` tem registro com auth.uid()
- Verificar session está ativa

**Se loop infinito:**
- Verificar dependencies do useEffect
- Não chamar loadUser() dentro do onAuthStateChange

**Se context undefined:**
- Verificar AuthProvider está no layout root
- Verificar useAuth() usado dentro de componente cliente

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 2.2:** Empresa Context

---

**Status:** ⏳ Aguardando implementação
**Criado por:** @sm (River) - 2026-02-13
