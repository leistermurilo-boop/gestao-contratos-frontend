# Story 3.3: Componentes Comuns

**Tipo:** Feature
**Prioridade:** Média
**Estimativa:** 3 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Criar componentes reutilizáveis comuns: loading spinner, empty state, page header, status badge, error boundary.

---

## 📋 Pré-requisitos

- [x] **Story 3.2 concluída:** Sistema de permissões implementado
- [ ] shadcn/ui componentes instalados: badge, skeleton

---

## 📁 Arquivos a Criar

```
frontend/
└── components/
    └── common/
        ├── loading-spinner.tsx    # ✅ Spinner de loading
        ├── empty-state.tsx        # ✅ Estado vazio
        ├── page-header.tsx        # ✅ Header de página
        ├── status-badge.tsx       # ✅ Badge de status
        ├── error-boundary.tsx     # ✅ Error boundary
        └── margem-indicator.tsx   # ✅ Indicador visual de margem
```

---

## 🔨 Tarefas

### 1. Criar Loading Spinner

Criar `frontend/components/common/loading-spinner.tsx`:

```typescript
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullScreen?: boolean
  text?: string
}

export function LoadingSpinner({
  size = 'md',
  className,
  fullScreen = false,
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  const spinner = (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        {spinner}
      </div>
    )
  }

  return spinner
}
```

### 2. Criar Empty State

Criar `frontend/components/common/empty-state.tsx`:

```typescript
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {Icon && <Icon className="h-12 w-12 text-muted-foreground mb-4" />}
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction} className="mt-6">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

### 3. Criar Page Header

Criar `frontend/components/common/page-header.tsx`:

```typescript
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick}>
          {action.icon && <action.icon className="mr-2 h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

### 4. Criar Status Badge

Criar `frontend/components/common/status-badge.tsx`:

```typescript
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'

type StatusType = 'ativo' | 'concluido' | 'rescindido' | 'suspenso' | 'arquivado' |
                  'solicitado' | 'analise' | 'aprovado' | 'rejeitado' | 'implementado'

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusConfig: Record<StatusType, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  ativo: {
    label: 'Ativo',
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  concluido: {
    label: 'Concluído',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
  rescindido: {
    label: 'Rescindido',
    variant: 'destructive',
    className: '',
  },
  suspenso: {
    label: 'Suspenso',
    variant: 'outline',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  arquivado: {
    label: 'Arquivado',
    variant: 'outline',
    className: 'bg-gray-100 text-gray-600',
  },
  solicitado: {
    label: 'Solicitado',
    variant: 'outline',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  analise: {
    label: 'Em Análise',
    variant: 'outline',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  aprovado: {
    label: 'Aprovado',
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  rejeitado: {
    label: 'Rejeitado',
    variant: 'destructive',
    className: '',
  },
  implementado: {
    label: 'Implementado',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
```

### 5. Criar Margem Indicator

Criar `frontend/components/common/margem-indicator.tsx`:

```typescript
'use client'

import { cn } from '@/lib/utils/cn'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MargemIndicatorProps {
  margem: number | null
  threshold?: number
  showIcon?: boolean
  showValue?: boolean
  className?: string
}

export function MargemIndicator({
  margem,
  threshold = 10,
  showIcon = true,
  showValue = true,
  className,
}: MargemIndicatorProps) {
  if (margem === null || margem === undefined) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>
        N/A
      </span>
    )
  }

  // ⚠️ Cores baseadas na margem
  const getColor = () => {
    if (margem < threshold) return 'text-red-600 bg-red-50 border-red-200'
    if (margem < threshold * 2) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const getIcon = () => {
    if (margem < threshold) return TrendingDown
    if (margem < threshold * 2) return Minus
    return TrendingUp
  }

  const Icon = getIcon()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded border text-sm font-medium',
              getColor(),
              className
            )}
          >
            {showIcon && <Icon className="h-3 w-3" />}
            {showValue && <span>{margem.toFixed(2)}%</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p><strong>Margem:</strong> {margem.toFixed(2)}%</p>
            <p><strong>Alerta:</strong> {threshold}%</p>
            {margem < threshold && (
              <p className="text-red-500 font-semibold">⚠️ Abaixo do esperado!</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

### 6. Criar Error Boundary

Criar `frontend/components/common/error-boundary.tsx`:

```typescript
'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-10 w-10 text-red-500" />
                <div>
                  <CardTitle>Algo deu errado</CardTitle>
                  <CardDescription>
                    Ocorreu um erro inesperado
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 font-mono">
                  {this.state.error?.message || 'Erro desconhecido'}
                </p>
              </div>
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                className="w-full"
              >
                Recarregar Página
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 7. Instalar Componentes Faltantes

```bash
cd frontend
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add skeleton
```

---

## ✅ Critérios de Aceitação (Done When...)

- [ ] LoadingSpinner criado com variantes de tamanho
- [ ] EmptyState criado com ícone e ação opcional
- [ ] PageHeader criado com título e ação
- [ ] StatusBadge criado com todos status
- [ ] MargemIndicator criado com cores baseadas em threshold
- [ ] ErrorBoundary criado (class component)
- [ ] Todos componentes responsivos
- [ ] **Teste:** LoadingSpinner exibe corretamente
- [ ] **Teste:** EmptyState exibe mensagem e botão
- [ ] **Teste:** MargemIndicator mostra vermelho/amarelo/verde correto
- [ ] **Teste:** StatusBadge renderiza todos status
- [ ] **Teste:** ErrorBoundary captura erros de componentes filhos

---

## 🔗 Dependências

- **Story 3.2:** Sistema de permissões implementado

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **Margem Indicator** - Cores críticas para UX
2. **Error Boundary** - Previne crash total da aplicação
3. **Componentes genéricos** - Reutilizar em todo projeto

### 🔍 Troubleshooting:

**Se MargemIndicator não mostra cores:**
- Verificar threshold passado corretamente
- Verificar margem é número válido

**Se ErrorBoundary não captura erros:**
- Verificar é class component (não function)
- Verificar erros são throw dentro do render

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 4.1:** Contrato Service

---

**Status:** ⏳ Aguardando implementação
**Criado por:** @sm (River) - 2026-02-13
