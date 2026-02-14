# Story 3.1: Dashboard Layout

**Tipo:** Feature
**Prioridade:** Alta
**Estimativa:** 4 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Criar layout principal do dashboard com sidebar de navegação, header e estrutura responsiva.

---

## 📋 Pré-requisitos

- [x] **Story 2.4 concluída:** Páginas de autenticação funcionais
- [ ] shadcn/ui componentes instalados: separator, tooltip, dropdown-menu

---

## 📁 Arquivos a Criar

```
frontend/
├── app/
│   └── (dashboard)/
│       ├── layout.tsx             # ✅ Layout do dashboard
│       └── dashboard/
│           └── page.tsx           # ✅ Página inicial (placeholder)
├── components/
│   └── layout/
│       ├── sidebar.tsx            # ✅ Sidebar de navegação
│       ├── header.tsx             # ✅ Header com perfil
│       ├── mobile-nav.tsx         # ✅ Navegação mobile
│       └── breadcrumb.tsx         # ✅ Breadcrumb de navegação
└── lib/
    └── constants/
        └── routes.ts              # ✅ Rotas da aplicação
```

---

## 🔨 Tarefas

### 1. Criar Constantes de Rotas

Criar `frontend/lib/constants/routes.ts`:

```typescript
import {
  Home,
  FileText,
  Package,
  DollarSign,
  FileCheck,
  Truck,
  Building2,
  Users,
  Settings
} from 'lucide-react'

export interface Route {
  label: string
  href: string
  icon: any
  perfis?: string[] // Se undefined, todos os perfis têm acesso
}

export const DASHBOARD_ROUTES: Route[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'Contratos',
    href: '/contratos',
    icon: FileText,
  },
  {
    label: 'Itens',
    href: '/contratos', // Navega para contratos e depois seleciona
    icon: Package,
  },
  {
    label: 'Custos',
    href: '/custos',
    icon: DollarSign,
    perfis: ['admin', 'juridico', 'financeiro', 'compras'], // ⚠️ Logística NÃO acessa
  },
  {
    label: 'Autorizações',
    href: '/autorizacoes',
    icon: FileCheck,
  },
  {
    label: 'Entregas',
    href: '/entregas',
    icon: Truck,
  },
]

export const ADMIN_ROUTES: Route[] = [
  {
    label: 'Empresas',
    href: '/empresas',
    icon: Building2,
    perfis: ['admin'],
  },
  {
    label: 'Usuários',
    href: '/usuarios',
    icon: Users,
    perfis: ['admin'],
  },
  {
    label: 'CNPJs',
    href: '/cnpjs',
    icon: Settings,
  },
]
```

### 2. Criar Sidebar

Criar `frontend/components/layout/sidebar.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useEmpresa } from '@/contexts/empresa-context'
import { cn } from '@/lib/utils/cn'
import { DASHBOARD_ROUTES, ADMIN_ROUTES, type Route } from '@/lib/constants/routes'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function Sidebar() {
  const pathname = usePathname()
  const { usuario } = useAuth()
  const { empresa } = useEmpresa()

  const canAccessRoute = (route: Route) => {
    if (!route.perfis) return true // Rota pública para todos perfis
    return route.perfis.includes(usuario?.perfil || '')
  }

  const filteredDashboardRoutes = DASHBOARD_ROUTES.filter(canAccessRoute)
  const filteredAdminRoutes = ADMIN_ROUTES.filter(canAccessRoute)

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      {/* Logo e Empresa */}
      <div className="p-6">
        <h1 className="text-xl font-bold">Gestão de Contratos</h1>
        {empresa && (
          <p className="text-sm text-slate-400 mt-1">{empresa.nome}</p>
        )}
      </div>

      <Separator className="bg-slate-700" />

      {/* Navegação Principal */}
      <nav className="flex-1 space-y-1 p-4">
        <TooltipProvider>
          {filteredDashboardRoutes.map((route) => {
            const Icon = route.icon
            const isActive = pathname === route.href || pathname.startsWith(route.href + '/')

            return (
              <Tooltip key={route.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={route.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-slate-800',
                      isActive ? 'bg-slate-800 text-white' : 'text-slate-300'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{route.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{route.label}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </nav>

      {/* Navegação Admin (se houver rotas) */}
      {filteredAdminRoutes.length > 0 && (
        <>
          <Separator className="bg-slate-700" />
          <nav className="space-y-1 p-4">
            <p className="text-xs font-semibold text-slate-400 px-3 mb-2">Administração</p>
            <TooltipProvider>
              {filteredAdminRoutes.map((route) => {
                const Icon = route.icon
                const isActive = pathname === route.href || pathname.startsWith(route.href + '/')

                return (
                  <Tooltip key={route.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={route.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-slate-800',
                          isActive ? 'bg-slate-800 text-white' : 'text-slate-300'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{route.label}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{route.label}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </TooltipProvider>
          </nav>
        </>
      )}

      {/* Footer com perfil */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-xs font-semibold">
              {usuario?.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{usuario?.nome}</p>
            <p className="text-xs text-slate-400 capitalize">{usuario?.perfil}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3. Criar Header

Criar `frontend/components/layout/header.tsx`:

```typescript
'use client'

import { Menu, Bell, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { usuario, signOut } = useAuth()

  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="text-sm font-semibold">
                  {usuario?.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium">{usuario?.nome}</p>
                <p className="text-xs text-muted-foreground capitalize">{usuario?.perfil}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

### 4. Criar Layout do Dashboard

Criar `frontend/app/(dashboard)/layout.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex">
        <Sidebar />
      </aside>

      {/* Sidebar - Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 5. Criar Página Dashboard Placeholder

Criar `frontend/app/(dashboard)/dashboard/page.tsx`:

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral dos contratos e métricas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
          </CardContent>
        </Card>
        {/* Mais cards aqui em stories futuras */}
      </div>
    </div>
  )
}
```

### 6. Instalar Componentes Faltantes

```bash
cd frontend
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add dropdown-menu
```

---

## ✅ Critérios de Aceitação (Done When...)

- [ ] Layout do dashboard criado com sidebar + header
- [ ] Sidebar mostra rotas filtradas por perfil
- [ ] **Custos ocultos para perfil logística**
- [ ] Rotas admin visíveis apenas para admin
- [ ] Header com menu dropdown funcional
- [ ] Botão de logout funciona
- [ ] Navegação responsiva (mobile menu)
- [ ] Rota ativa destacada na sidebar
- [ ] Nome da empresa exibido na sidebar
- [ ] **Teste:** Perfil logística NÃO vê link "Custos"
- [ ] **Teste:** Perfil admin vê rotas de administração
- [ ] **Teste:** Menu mobile abre e fecha corretamente
- [ ] **Teste:** Logout redireciona para /login

---

## 🔗 Dependências

- **Story 2.4:** Páginas de autenticação funcionais

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **Filtrar rotas por perfil** - canAccessRoute()
2. **Logística NÃO vê custos** - CRÍTICO para segurança
3. **Rotas admin apenas para admin** - Verificar perfil
4. **Mobile responsivo** - Menu funcional em telas pequenas

### 🔍 Troubleshooting:

**Se sidebar não aparece:**
- Verificar layout está em `app/(dashboard)/layout.tsx`
- Verificar AuthProvider e EmpresaProvider no layout root

**Se rotas não filtram:**
- Verificar usuario.perfil está disponível
- Verificar DASHBOARD_ROUTES.perfis configurado corretamente

**Se mobile menu não funciona:**
- Verificar z-index do overlay
- Verificar onClick fecha o menu

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 3.2:** Sistema de Permissões

---

**Status:** ⏳ Aguardando implementação
**Criado por:** @sm (River) - 2026-02-13
