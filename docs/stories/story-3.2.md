# Story 3.2: Sistema de Permissões

**Tipo:** Feature
**Prioridade:** Crítica
**Estimativa:** 2 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Implementar sistema de permissões baseado em perfil com funções helpers e HOCs para controle de acesso.

---

## 📋 Pré-requisitos

- [x] **Story 3.1 concluída:** Dashboard Layout implementado
- [x] Constantes de perfis já criadas na arquitetura

---

## 📁 Arquivos a Criar

```
frontend/
├── lib/
│   ├── constants/
│   │   └── perfis.ts              # ✅ Perfis e permissões
│   └── utils/
│       └── permissions.ts         # ✅ Helpers de permissões
└── components/
    └── common/
        └── protected-route.tsx    # ✅ HOC para rotas protegidas
```

---

## 🔨 Tarefas

### 1. Criar Constantes de Perfis

Criar `frontend/lib/constants/perfis.ts`:

```typescript
export const PERFIS = {
  admin: 'admin',
  juridico: 'juridico',
  financeiro: 'financeiro',
  compras: 'compras',
  logistica: 'logistica',
} as const

export type Perfil = typeof PERFIS[keyof typeof PERFIS]

export const PERMISSIONS = {
  [PERFIS.admin]: ['*'], // Acesso total
  [PERFIS.juridico]: ['contratos.*', 'reajustes.*'],
  [PERFIS.financeiro]: ['contratos.read', 'custos.*', 'margem.read'],
  [PERFIS.compras]: ['contratos.read', 'custos.*', 'af.*'],
  [PERFIS.logistica]: ['af.read', 'entregas.*'], // ⚠️ SEM custos!
} as const

export function canUser(perfil: Perfil, action: string): boolean {
  const permissions = PERMISSIONS[perfil]
  return permissions.includes('*') || permissions.includes(action)
}

export function canViewCosts(perfil: Perfil): boolean {
  return perfil !== PERFIS.logistica
}

export function canEditContratos(perfil: Perfil): boolean {
  return perfil === PERFIS.admin || perfil === PERFIS.juridico
}

export function canManageUsers(perfil: Perfil): boolean {
  return perfil === PERFIS.admin
}

export function canEmitAF(perfil: Perfil): boolean {
  return perfil === PERFIS.admin || perfil === PERFIS.compras
}

export function canRegisterEntrega(perfil: Perfil): boolean {
  return perfil !== PERFIS.financeiro // Todos exceto financeiro
}
```

### 2. Criar Utilities de Permissões

Criar `frontend/lib/utils/permissions.ts`:

```typescript
import { type Perfil } from '@/lib/constants/perfis'

export interface PermissionCheck {
  perfil: Perfil
  allowed: Perfil[]
}

export function hasPermission(perfil: Perfil | null, allowed: Perfil[]): boolean {
  if (!perfil) return false
  return allowed.includes(perfil)
}

export function requirePermission(
  perfil: Perfil | null,
  allowed: Perfil[],
  errorMessage?: string
): void {
  if (!hasPermission(perfil, allowed)) {
    throw new Error(errorMessage || 'Permissão negada')
  }
}

// Helper para uso em componentes
export function usePermission(perfil: Perfil | null, allowed: Perfil[]): boolean {
  return hasPermission(perfil, allowed)
}
```

### 3. Criar Protected Route HOC

Criar `frontend/components/common/protected-route.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { type Perfil } from '@/lib/constants/perfis'
import { hasPermission } from '@/lib/utils/permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedPerfis: Perfil[]
  redirectTo?: string
  showError?: boolean
}

export function ProtectedRoute({
  children,
  allowedPerfis,
  redirectTo = '/dashboard',
  showError = true,
}: ProtectedRouteProps) {
  const { usuario, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && usuario) {
      if (!hasPermission(usuario.perfil, allowedPerfis)) {
        if (!showError) {
          router.push(redirectTo)
        }
      }
    }
  }, [usuario, loading, allowedPerfis, redirectTo, router, showError])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!usuario) {
    return null // Middleware vai redirecionar
  }

  if (!hasPermission(usuario.perfil, allowedPerfis)) {
    if (showError) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-[500px]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-10 w-10 text-red-500" />
                <div>
                  <CardTitle>Acesso Negado</CardTitle>
                  <CardDescription>
                    Você não tem permissão para acessar esta página
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Seu perfil: <strong className="capitalize">{usuario.perfil}</strong>
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Esta página requer um dos seguintes perfis:{' '}
                  {allowedPerfis.map(p => p.toUpperCase()).join(', ')}
                </p>
              </div>
              <Button onClick={() => router.push(redirectTo)} className="w-full">
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    return null
  }

  return <>{children}</>
}
```

### 4. Exemplo de Uso em Página

Criar exemplo em `frontend/app/(dashboard)/custos/page.tsx`:

```typescript
import { ProtectedRoute } from '@/components/common/protected-route'
import { PERFIS } from '@/lib/constants/perfis'

export default function CustosPage() {
  return (
    <ProtectedRoute
      allowedPerfis={[
        PERFIS.admin,
        PERFIS.juridico,
        PERFIS.financeiro,
        PERFIS.compras,
        // ⚠️ LOGÍSTICA NÃO INCLUÍDO
      ]}
    >
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Custos</h1>
        <p className="text-muted-foreground">
          Gestão de custos dos itens de contrato
        </p>
        {/* Conteúdo da página */}
      </div>
    </ProtectedRoute>
  )
}
```

### 5. Hook Customizado para Permissões

Adicionar em `frontend/lib/hooks/use-permissions.ts`:

```typescript
'use client'

import { useAuth } from '@/contexts/auth-context'
import { type Perfil } from '@/lib/constants/perfis'
import {
  canViewCosts,
  canEditContratos,
  canManageUsers,
  canEmitAF,
  canRegisterEntrega,
} from '@/lib/constants/perfis'

export function usePermissions() {
  const { usuario } = useAuth()

  return {
    perfil: usuario?.perfil || null,
    canViewCosts: usuario ? canViewCosts(usuario.perfil) : false,
    canEditContratos: usuario ? canEditContratos(usuario.perfil) : false,
    canManageUsers: usuario ? canManageUsers(usuario.perfil) : false,
    canEmitAF: usuario ? canEmitAF(usuario.perfil) : false,
    canRegisterEntrega: usuario ? canRegisterEntrega(usuario.perfil) : false,
    isAdmin: usuario?.perfil === 'admin',
  }
}
```

---

## ✅ Critérios de Aceitação (Done When...)

- [x] `lib/constants/perfis.ts` criado com todos perfis
- [x] PERMISSIONS mapping criado corretamente
- [x] Helpers de permissão funcionais (canViewCosts, etc)
- [x] `lib/utils/permissions.ts` criado
- [x] ProtectedRoute HOC criado
- [x] **Logística bloqueado de ver custos**
- [x] Hook usePermissions funcional
- [x] Mensagem de "Acesso Negado" estilizada
- [x] **Teste:** Logística acessa /custos e vê mensagem de erro
- [x] **Teste:** Admin acessa todas páginas
- [x] **Teste:** canViewCosts retorna false para logística
- [x] **Teste:** ProtectedRoute redireciona corretamente

---

## 🔗 Dependências

- **Story 3.1:** Dashboard Layout implementado

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **Logística NUNCA vê custos** - Verificar em múltiplas camadas
2. **Permissões no frontend são UX** - Backend RLS é segurança real
3. **Admin tem acesso total** - Simplificar verificações
4. **Mensagens claras** - Usuário precisa saber por que foi bloqueado

### 🔍 Troubleshooting:

**Se permissões não funcionam:**
- Verificar usuario.perfil está disponível
- Verificar tipo Perfil corresponde ao valor do banco

**Se ProtectedRoute não bloqueia:**
- Verificar hasPermission retorna boolean correto
- Verificar allowedPerfis está correto

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 3.3:** Componentes Comuns

---

**Status:** ✅ Concluída - 2026-02-19
**Criado por:** @sm (River) - 2026-02-13
