# Story 2.4: Páginas de Autenticação

**Tipo:** Feature
**Prioridade:** Crítica
**Estimativa:** 3 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Criar páginas de login e recuperação de senha com formulários funcionais usando React Hook Form + Zod.

---

## 📋 Pré-requisitos

- [x] **Story 2.1 concluída:** Auth Context implementado
- [x] **Story 2.3 concluída:** Middleware configurado
- [ ] shadcn/ui componentes instalados: button, input, label, alert

---

## 📁 Arquivos a Criar

```
frontend/
├── app/
│   └── (auth)/
│       ├── layout.tsx             # ✅ Layout de autenticação (centralizado)
│       ├── login/
│       │   └── page.tsx           # ✅ Página de login
│       └── recuperar-senha/
│           └── page.tsx           # ✅ Página de recuperação de senha
└── lib/
    └── validations/
        └── auth.schema.ts         # ✅ Schemas de validação
```

---

## 🔨 Tarefas

### 1. Criar Layout de Autenticação

Criar `frontend/app/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
```

### 2. Criar Schemas de Validação

Criar `frontend/lib/validations/auth.schema.ts`:

```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const recuperarSenhaSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
})

export type RecuperarSenhaFormData = z.infer<typeof recuperarSenhaSchema>
```

### 3. Criar Página de Login

Criar `frontend/app/(auth)/login/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'inactive') {
      setError('Sua conta está inativa. Entre em contato com o administrador.')
    } else if (errorParam === 'db') {
      setError('Erro ao verificar suas credenciais. Tente novamente.')
    }

    const successParam = searchParams.get('success')
    if (successParam === 'reset') {
      setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.')
    }
  }, [searchParams])

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true)
      setError(null)
      await signIn(data.email, data.password)
      // Redirect é feito pelo Auth Context
    } catch (err: any) {
      console.error('Erro no login:', err)
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Gestão de Contratos</CardTitle>
        <CardDescription>
          Entre com suas credenciais para acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/recuperar-senha"
                className="text-sm text-blue-600 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground text-center">
          Sistema multi-tenant com Supabase
        </div>
      </CardFooter>
    </Card>
  )
}
```

### 4. Criar Página de Recuperação de Senha

Criar `frontend/app/(auth)/recuperar-senha/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { recuperarSenhaSchema, type RecuperarSenhaFormData } from '@/lib/validations/auth.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function RecuperarSenhaPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecuperarSenhaFormData>({
    resolver: zodResolver(recuperarSenhaSchema),
  })

  const onSubmit = async (data: RecuperarSenhaFormData) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push('/login?success=reset')
      }, 3000)
    } catch (err: any) {
      console.error('Erro ao recuperar senha:', err)
      setError(err.message || 'Erro ao enviar email de recuperação.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Enviado!</CardTitle>
          <CardDescription>
            Verifique sua caixa de entrada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Um link de recuperação foi enviado para seu email.
              Você será redirecionado para a página de login em instantes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
        <CardDescription>
          Digite seu email para receber um link de recuperação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:underline mx-auto"
        >
          Voltar para o login
        </Link>
      </CardFooter>
    </Card>
  )
}
```

### 5. Adicionar Componente Alert (se não existir)

Se o componente `Alert` não foi instalado ainda:

```bash
cd frontend
npx shadcn-ui@latest add alert
```

---

## ✅ Critérios de Aceitação (Done When...)

- [ ] Layout de autenticação criado (centralizado)
- [ ] Schemas de validação criados (Zod)
- [ ] Página de login funcional com React Hook Form
- [ ] Página de recuperação de senha funcional
- [ ] Validações de frontend funcionando (email, senha mínima)
- [ ] Mensagens de erro exibidas corretamente
- [ ] Loading states implementados
- [ ] Link "Esqueceu a senha?" funciona
- [ ] **Teste:** Login com credenciais válidas redireciona para /dashboard
- [ ] **Teste:** Login com credenciais inválidas exibe erro
- [ ] **Teste:** Validação de email e senha funcionam
- [ ] **Teste:** Recuperação de senha envia email
- [ ] **Teste:** Usuário inativo exibe mensagem de erro

---

## 🔗 Dependências

- **Story 2.1:** Auth Context implementado
- **Story 2.3:** Middleware configurado

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **Nunca expor SERVICE_ROLE_KEY** - Usar apenas ANON_KEY
2. **Validação frontend é UX** - Backend (RLS) é segurança
3. **Loading states são essenciais** - Feedback visual
4. **Error handling** - Mensagens claras para o usuário

### 🔍 Troubleshooting:

**Se login falha:**
- Verificar .env.local tem credenciais corretas
- Verificar usuário existe no Supabase Auth
- Verificar RLS policies permitem SELECT em usuarios

**Se recuperação de senha não envia:**
- Verificar email configurado no Supabase (Project Settings > Auth > Email Templates)
- Verificar SMTP configurado
- Verificar redirectTo é URL válida

**Se validações não funcionam:**
- Verificar @hookform/resolvers instalado
- Verificar zod instalado
- Verificar zodResolver no useForm

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 3.1:** Dashboard Layout

---

**Status:** ⏳ Aguardando implementação
**Criado por:** @sm (River) - 2026-02-13
