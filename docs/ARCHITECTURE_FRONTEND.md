# 🏛️ ARQUITETURA COMPLETA DO FRONTEND
**Sistema de Gestão de Contratos - Next.js 14**

**Arquiteto:** Aria (@architect)
**Data:** 2026-02-13
**Versão:** 1.0
**Status:** Especificação Completa - Pronto para Implementação

---

## 📋 ÍNDICE

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Estrutura Completa de Pastas e Arquivos](#2-estrutura-completa-de-pastas-e-arquivos)
3. [Dependências e Versões (package.json)](#3-dependências-e-versões-packagejson)
4. [Arquivos de Configuração](#4-arquivos-de-configuração)
5. [Stories de Desenvolvimento](#5-stories-de-desenvolvimento)
6. [Regras Críticas para @dev](#6-regras-críticas-para-dev)
7. [Padrões de Código e Convenções](#7-padrões-de-código-e-convenções)
8. [Arquivos Base Essenciais](#8-arquivos-base-essenciais)

---

## 1. VISÃO GERAL DA ARQUITETURA

### 1.1 Princípios Arquiteturais

**Multi-Tenant First:**
- ✅ Todo dado filtrado automaticamente por `empresa_id` via RLS
- ✅ Usuário NÃO passa `empresa_id` manualmente - RLS injeta automaticamente
- ✅ Frontend apenas consome dados já filtrados

**Backend as Source of Truth:**
- ✅ Cálculos (margem, CMP, saldo) NUNCA no frontend
- ✅ Frontend apenas exibe valores calculados pelo backend
- ✅ Validações críticas no backend + RLS

**Security by Design:**
- ✅ Perfil logística: componentes de custos não renderizam
- ✅ Upload: path obrigatório `empresa_id/filename`
- ✅ Soft delete: filtrar `deleted_at IS NULL` em queries
- ✅ Auth: Middleware verifica `usuario.ativo` a cada request

**Developer Experience:**
- ✅ Services layer centraliza lógica de negócio
- ✅ Hooks customizados para operações comuns
- ✅ Components library reutilizável (shadcn/ui)
- ✅ Types gerados automaticamente do Supabase

### 1.2 Stack Tecnológica

| Camada | Tecnologia | Versão | Justificativa |
|--------|------------|--------|---------------|
| **Framework** | Next.js | 14.2.3 | App Router, Server Components, otimizações automáticas |
| **Language** | TypeScript | 5.4.5 | Type safety, melhor DX, menos bugs |
| **Styling** | Tailwind CSS | 3.4.3 | Utility-first, performance, consistência |
| **UI Components** | shadcn/ui | latest | Componentes acessíveis, customizáveis, sem lock-in |
| **Backend** | Supabase | 2.39.8 | Auth + Database + Storage + Realtime |
| **Forms** | React Hook Form | 7.51.3 | Performance, validação, menos re-renders |
| **Validation** | Zod | 3.23.6 | Type-safe schemas, integração com RHF |
| **Charts** | Recharts | 2.12.6 | Declarativo, responsivo, bem mantido |
| **Icons** | Lucide React | 0.368.0 | Consistente, tree-shakeable, moderna |
| **Date** | date-fns | 3.6.0 | Modular, imutável, TypeScript nativo |
| **Notifications** | react-hot-toast | 2.4.1 | Leve, customizável, boa UX |
| **State** | Context API | nativo | Suficiente para o escopo, sem overhead de Zustand/Redux |

### 1.3 Arquitetura de Camadas

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Pages   │  │ Layouts  │  │Components│  │  Forms  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Hooks   │  │ Contexts │  │ Services │  │  Utils  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Supabase │  │   Auth   │  │ Storage  │  │   RLS   │ │
│  │  Client  │  │          │  │          │  │         │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 2. ESTRUTURA COMPLETA DE PASTAS E ARQUIVOS

```
frontend/
├── .env.local                          # Variáveis de ambiente (NÃO commitar)
├── .env.example                        # Template de variáveis
├── .eslintrc.json                      # ESLint config
├── .gitignore                          # Git ignore
├── next.config.mjs                     # Next.js config
├── package.json                        # Dependências
├── postcss.config.mjs                  # PostCSS config
├── tailwind.config.ts                  # Tailwind config
├── tsconfig.json                       # TypeScript config
├── components.json                     # shadcn/ui config
├── middleware.ts                       # Auth middleware
│
├── app/                                # Next.js 14 App Router
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Landing page (/)
│   ├── globals.css                     # Global styles
│   ├── favicon.ico                     # Favicon
│   │
│   ├── (auth)/                         # Auth routes group (public)
│   │   ├── layout.tsx                  # Auth layout (centered, no sidebar)
│   │   ├── login/
│   │   │   └── page.tsx                # Login page
│   │   ├── register/
│   │   │   └── page.tsx                # Register page (opcional)
│   │   └── recuperar-senha/
│   │       └── page.tsx                # Password reset
│   │
│   ├── (dashboard)/                    # Dashboard routes (authenticated)
│   │   ├── layout.tsx                  # Dashboard layout (sidebar + header)
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx                # Dashboard principal
│   │   │
│   │   ├── contratos/
│   │   │   ├── page.tsx                # Lista de contratos
│   │   │   ├── novo/
│   │   │   │   └── page.tsx            # Criar contrato
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Detalhes do contrato
│   │   │       ├── editar/
│   │   │       │   └── page.tsx        # Editar contrato
│   │   │       └── itens/
│   │   │           ├── page.tsx        # Lista de itens
│   │   │           ├── novo/
│   │   │           │   └── page.tsx    # Adicionar item
│   │   │           └── [itemId]/
│   │   │               ├── page.tsx    # Detalhes do item
│   │   │               └── editar/
│   │   │                   └── page.tsx # Editar item
│   │   │
│   │   ├── custos/                     # ⚠️ OCULTAR se perfil = logistica
│   │   │   ├── page.tsx                # Lista de custos por item
│   │   │   └── novo/
│   │   │       └── page.tsx            # Registrar custo
│   │   │
│   │   ├── autorizacoes/               # Autorizações de Fornecimento
│   │   │   ├── page.tsx                # Lista de AFs
│   │   │   ├── nova/
│   │   │   │   └── page.tsx            # Emitir AF
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Detalhes da AF
│   │   │
│   │   ├── entregas/
│   │   │   ├── page.tsx                # Lista de entregas
│   │   │   ├── nova/
│   │   │   │   └── page.tsx            # Registrar entrega
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Detalhes da entrega
│   │   │
│   │   ├── reajustes/                  # Módulo futuro (Fase 2)
│   │   │   └── page.tsx
│   │   │
│   │   ├── empresas/                   # ⚠️ Apenas perfil admin
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── usuarios/                   # ⚠️ Apenas perfil admin
│   │   │   ├── page.tsx
│   │   │   ├── novo/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   │
│   │   └── cnpjs/
│   │       ├── page.tsx
│   │       ├── novo/
│   │       │   └── page.tsx
│   │       └── [id]/
│   │           └── page.tsx
│   │
│   └── api/                            # API Routes (opcional)
│       └── upload/
│           └── route.ts                # Server-side upload handler
│
├── components/                         # Componentes React
│   ├── ui/                             # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   ├── tabs.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── tooltip.tsx
│   │   └── calendar.tsx
│   │
│   ├── layout/                         # Layout components
│   │   ├── sidebar.tsx                 # Sidebar navigation
│   │   ├── header.tsx                  # Top header
│   │   ├── footer.tsx                  # Footer (opcional)
│   │   ├── breadcrumb.tsx              # Breadcrumb navigation
│   │   └── mobile-nav.tsx              # Mobile navigation
│   │
│   ├── forms/                          # Formulários específicos
│   │   ├── contrato-form.tsx           # Form de contrato
│   │   ├── item-contrato-form.tsx      # Form de item
│   │   ├── custo-form.tsx              # Form de custo (ocultar se logistica)
│   │   ├── af-form.tsx                 # Form de AF
│   │   ├── entrega-form.tsx            # Form de entrega
│   │   ├── usuario-form.tsx            # Form de usuário
│   │   ├── empresa-form.tsx            # Form de empresa
│   │   └── cnpj-form.tsx               # Form de CNPJ
│   │
│   ├── tables/                         # Tabelas de dados
│   │   ├── data-table.tsx              # Componente genérico de tabela
│   │   ├── data-table-toolbar.tsx      # Toolbar com filtros
│   │   ├── data-table-pagination.tsx   # Paginação
│   │   ├── contratos-table.tsx         # Tabela específica de contratos
│   │   ├── itens-table.tsx             # Tabela de itens
│   │   ├── custos-table.tsx            # Tabela de custos
│   │   ├── af-table.tsx                # Tabela de AFs
│   │   └── entregas-table.tsx          # Tabela de entregas
│   │
│   ├── charts/                         # Gráficos
│   │   ├── margem-chart.tsx            # Gráfico de evolução de margem
│   │   ├── custos-evolution-chart.tsx  # Evolução de custos
│   │   ├── dashboard-cards.tsx         # Cards de métricas
│   │   └── vencimentos-chart.tsx       # Contratos próximos do vencimento
│   │
│   ├── modals/                         # Modais
│   │   ├── confirm-dialog.tsx          # Modal de confirmação
│   │   ├── upload-modal.tsx            # Modal de upload
│   │   └── details-modal.tsx           # Modal de detalhes
│   │
│   └── common/                         # Componentes comuns
│       ├── loading-spinner.tsx         # Spinner de loading
│       ├── error-boundary.tsx          # Error boundary
│       ├── file-upload.tsx             # Upload de arquivo
│       ├── status-badge.tsx            # Badge de status
│       ├── margem-indicator.tsx        # ⭐ Indicador visual de margem
│       ├── empty-state.tsx             # Estado vazio
│       ├── page-header.tsx             # Header de página
│       └── protected-route.tsx         # HOC para rotas protegidas
│
├── lib/                                # Bibliotecas e utilitários
│   ├── supabase/
│   │   ├── client.ts                   # Cliente Supabase (browser)
│   │   ├── server.ts                   # Cliente Supabase (server)
│   │   └── middleware.ts               # Auth middleware helper
│   │
│   ├── hooks/                          # Custom hooks
│   │   ├── use-contratos.ts            # Hook para contratos
│   │   ├── use-itens.ts                # Hook para itens
│   │   ├── use-custos.ts               # Hook para custos
│   │   ├── use-af.ts                   # Hook para AFs
│   │   ├── use-entregas.ts             # Hook para entregas
│   │   ├── use-user.ts                 # Hook para usuário logado
│   │   ├── use-empresa.ts              # Hook para empresa
│   │   └── use-upload.ts               # Hook para upload
│   │
│   ├── services/                       # Camada de serviços
│   │   ├── contratos.service.ts        # Service de contratos
│   │   ├── itens.service.ts            # Service de itens
│   │   ├── custos.service.ts           # Service de custos
│   │   ├── af.service.ts               # Service de AFs
│   │   ├── entregas.service.ts         # Service de entregas
│   │   ├── empresas.service.ts         # Service de empresas
│   │   ├── usuarios.service.ts         # Service de usuários
│   │   ├── cnpjs.service.ts            # Service de CNPJs
│   │   └── upload.service.ts           # ⭐ Service de upload
│   │
│   ├── validations/                    # Schemas Zod
│   │   ├── contrato.schema.ts          # Schema de contrato
│   │   ├── item.schema.ts              # Schema de item
│   │   ├── custo.schema.ts             # Schema de custo
│   │   ├── af.schema.ts                # Schema de AF
│   │   ├── entrega.schema.ts           # Schema de entrega
│   │   ├── usuario.schema.ts           # Schema de usuário
│   │   ├── empresa.schema.ts           # Schema de empresa
│   │   └── cnpj.schema.ts              # Schema de CNPJ
│   │
│   ├── utils/                          # Funções utilitárias
│   │   ├── formatters.ts               # Formatação (moeda, data, etc)
│   │   ├── validators.ts               # Validadores (CNPJ, CPF, etc)
│   │   ├── calculations.ts             # ⚠️ NUNCA recalcular margem/CMP aqui!
│   │   ├── date-utils.ts               # Utilitários de data
│   │   ├── permissions.ts              # ⭐ Verificação de permissões
│   │   └── cn.ts                       # Class name utility (tailwind-merge)
│   │
│   └── constants/                      # Constantes
│       ├── status.ts                   # Status (ativo, concluido, etc)
│       ├── perfis.ts                   # ⭐ Perfis de usuário
│       ├── routes.ts                   # Rotas da aplicação
│       └── buckets.ts                  # ⭐ Nomes dos buckets
│
├── types/                              # TypeScript types
│   ├── database.types.ts               # ⭐ Gerado pelo Supabase
│   ├── models.ts                       # Modelos de domínio
│   ├── api.types.ts                    # Types de API
│   └── permissions.types.ts            # Types de permissões
│
├── contexts/                           # React Contexts
│   ├── auth-context.tsx                # ⭐ Contexto de autenticação
│   ├── empresa-context.tsx             # ⭐ Contexto de empresa
│   └── theme-context.tsx               # Contexto de tema (dark/light)
│
└── public/                             # Assets estáticos
    ├── logo.svg                        # Logo da aplicação
    └── images/                         # Imagens

⭐ = Crítico para funcionamento
⚠️ = Atenção especial necessária
```

---

## 3. DEPENDÊNCIAS E VERSÕES (package.json)

```json
{
  "name": "gestao-contratos-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "generate-types": "supabase gen types typescript --project-id hstlbkudwnboebmarilp > types/database.types.ts"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "typescript": "5.4.5",

    "@supabase/supabase-js": "2.39.8",
    "@supabase/ssr": "0.1.0",

    "react-hook-form": "7.51.3",
    "@hookform/resolvers": "3.3.4",
    "zod": "3.23.6",

    "@radix-ui/react-dialog": "1.0.5",
    "@radix-ui/react-dropdown-menu": "2.0.6",
    "@radix-ui/react-label": "2.0.2",
    "@radix-ui/react-select": "2.0.0",
    "@radix-ui/react-separator": "1.0.3",
    "@radix-ui/react-slot": "1.0.2",
    "@radix-ui/react-tabs": "1.0.4",
    "@radix-ui/react-tooltip": "1.0.7",

    "recharts": "2.12.6",
    "lucide-react": "0.368.0",
    "date-fns": "3.6.0",
    "react-hot-toast": "2.4.1",

    "class-variance-authority": "0.7.0",
    "clsx": "2.1.1",
    "tailwind-merge": "2.3.0",
    "tailwindcss-animate": "1.0.7"
  },
  "devDependencies": {
    "@types/node": "20.12.7",
    "@types/react": "18.3.1",
    "@types/react-dom": "18.3.0",
    "tailwindcss": "3.4.3",
    "postcss": "8.4.38",
    "autoprefixer": "10.4.19",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.3"
  }
}
```

---

## 4. ARQUIVOS DE CONFIGURAÇÃO

### 4.1 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 4.2 tailwind.config.ts

```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom colors para o projeto
        success: {
          DEFAULT: "hsl(142, 76%, 36%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        warning: {
          DEFAULT: "hsl(38, 92%, 50%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        danger: {
          DEFAULT: "hsl(0, 84%, 60%)",
          foreground: "hsl(0, 0%, 100%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

### 4.3 next.config.mjs

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['hstlbkudwnboebmarilp.supabase.co'], // Supabase storage
    unoptimized: false,
  },
  // Configurações de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

### 4.4 .env.example

```bash
# Supabase (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL=https://hstlbkudwnboebmarilp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui

# NUNCA exponha service role key no frontend!
# SUPABASE_SERVICE_ROLE_KEY é apenas para backend/scripts

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4.5 components.json (shadcn/ui)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/lib/hooks"
  }
}
```

### 4.6 .eslintrc.json

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "no-unused-vars": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "react/no-unescaped-entities": "off",
    "@next/next/no-img-element": "off"
  }
}
```

### 4.7 .gitignore

```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode
.idea
```

---

## 5. STORIES DE DESENVOLVIMENTO

### Story 1: Setup e Configuração Base

**Story 1.1: Inicialização do Projeto Next.js 14**
- [ ] Criar projeto: `npx create-next-app@14.2.3 frontend`
- [ ] Instalar todas as dependências do package.json
- [ ] Configurar tsconfig.json
- [ ] Configurar estrutura de pastas base
- [ ] Criar .env.local com credenciais Supabase
- [ ] Testar: `npm run dev` deve iniciar sem erros

**Story 1.2: Configuração Tailwind CSS + shadcn/ui**
- [ ] Configurar Tailwind CSS (tailwind.config.ts)
- [ ] Configurar PostCSS (postcss.config.mjs)
- [ ] Criar app/globals.css com variáveis CSS
- [ ] Inicializar shadcn/ui: `npx shadcn-ui@latest init`
- [ ] Adicionar componentes base: button, input, card, dialog
- [ ] Testar: Criar página de teste com componentes

**Story 1.3: Setup Supabase Client**
- [ ] Criar lib/supabase/client.ts (browser)
- [ ] Criar lib/supabase/server.ts (server)
- [ ] Criar lib/supabase/middleware.ts
- [ ] Gerar types: `npm run generate-types`
- [ ] Testar conexão: query simples em empresas

---

### Story 2: Autenticação e Contextos

**Story 2.1: Auth Context**
- [ ] Criar contexts/auth-context.tsx
- [ ] Implementar login, logout, getSession
- [ ] Implementar verificação de usuario.ativo
- [ ] Expor: user, perfil, empresa_id, loading
- [ ] Testar: Login com usuário ativo e inativo

**Story 2.2: Empresa Context**
- [ ] Criar contexts/empresa-context.tsx
- [ ] Buscar dados da empresa do usuário logado
- [ ] Expor: empresa, config_json (margem_alerta, etc)
- [ ] Testar: Carregar configurações da empresa

**Story 2.3: Middleware de Autenticação**
- [ ] Criar middleware.ts na raiz
- [ ] Verificar session em rotas protegidas
- [ ] Redirecionar para /login se não autenticado
- [ ] Verificar usuario.ativo
- [ ] Testar: Acesso a /dashboard sem login

**Story 2.4: Páginas de Autenticação**
- [ ] Criar app/(auth)/layout.tsx
- [ ] Criar app/(auth)/login/page.tsx
- [ ] Criar formulário de login (email + senha)
- [ ] Implementar login com Supabase Auth
- [ ] Adicionar loading e error states
- [ ] Testar: Login com credenciais válidas

---

### Story 3: Layout Base e Navegação

**Story 3.1: Dashboard Layout**
- [ ] Criar app/(dashboard)/layout.tsx
- [ ] Criar components/layout/sidebar.tsx
- [ ] Criar components/layout/header.tsx
- [ ] Implementar navegação responsiva
- [ ] Adicionar mobile menu
- [ ] Testar: Navegação entre páginas

**Story 3.2: Sistema de Permissões**
- [ ] Criar lib/utils/permissions.ts
- [ ] Implementar função canUser(perfil, action)
- [ ] Criar constants/perfis.ts com PERMISSIONS
- [ ] Criar HOC ProtectedRoute
- [ ] Testar: Bloquear custos para logistica

**Story 3.3: Componentes Comuns**
- [ ] Criar components/common/loading-spinner.tsx
- [ ] Criar components/common/empty-state.tsx
- [ ] Criar components/common/page-header.tsx
- [ ] Criar components/common/status-badge.tsx
- [ ] Testar: Usar em diferentes páginas

---

### Story 4: Services Layer

**Story 4.1: Contrato Service**
- [ ] Criar lib/services/contratos.service.ts
- [ ] Implementar: getAll(), getById(), create(), update()
- [ ] Implementar softDelete (update deleted_at)
- [ ] **CRÍTICO**: Não passar empresa_id (RLS injeta)
- [ ] Filtrar deleted_at IS NULL
- [ ] Testar: CRUD completo

**Story 4.2: Item Service**
- [ ] Criar lib/services/itens.service.ts
- [ ] Implementar: getByContrato(), create(), update()
- [ ] **NUNCA** recalcular margem/saldo no frontend
- [ ] Filtrar deleted_at IS NULL
- [ ] Testar: CRUD de itens

**Story 4.3: Custo Service**
- [ ] Criar lib/services/custos.service.ts
- [ ] Implementar: getByItem(), create()
- [ ] **CRÍTICO**: Bloquear se perfil = logistica
- [ ] Implementar upload de NF entrada
- [ ] Testar: Registro de custo + upload

**Story 4.4: Upload Service**
- [ ] Criar lib/services/upload.service.ts
- [ ] **CRÍTICO**: Path obrigatório `empresa_id/filename`
- [ ] Implementar upload, download, delete
- [ ] Validar buckets (constants/buckets.ts)
- [ ] Testar: Upload em cada bucket

**Story 4.5: AF Service**
- [ ] Criar lib/services/af.service.ts
- [ ] Implementar: getAll(), create(), update()
- [ ] Validar saldo disponível antes de criar
- [ ] Testar: Emissão de AF

**Story 4.6: Entrega Service**
- [ ] Criar lib/services/entregas.service.ts
- [ ] Implementar: getByAF(), create()
- [ ] Validar quantidade vs saldo AF
- [ ] Implementar upload de NF saída
- [ ] Testar: Registro de entrega

---

### Story 5: Dashboard Principal

**Story 5.1: Métricas**
- [ ] Criar app/(dashboard)/dashboard/page.tsx
- [ ] Criar components/charts/dashboard-cards.tsx
- [ ] Exibir: total contratos, valor total, margem média, alertas
- [ ] **Valores vêm do backend (NÃO recalcular)**
- [ ] Testar: Carregamento de métricas

**Story 5.2: Gráficos**
- [ ] Criar components/charts/margem-chart.tsx
- [ ] Criar components/charts/vencimentos-chart.tsx
- [ ] Usar Recharts
- [ ] Responsivo
- [ ] Testar: Visualização de dados

**Story 5.3: Alertas**
- [ ] Listar contratos próximos do vencimento
- [ ] Listar itens com margem baixa (margem_alerta_disparado)
- [ ] Badge visual (verde/amarelo/vermelho)
- [ ] Testar: Alertas funcionando

---

### Story 6: Módulo de Contratos

**Story 6.1: Lista de Contratos**
- [ ] Criar app/(dashboard)/contratos/page.tsx
- [ ] Criar components/tables/contratos-table.tsx
- [ ] Implementar filtros (status, órgão, vencimento)
- [ ] Implementar busca
- [ ] Paginação
- [ ] Testar: Listagem e filtros

**Story 6.2: Criar Contrato**
- [ ] Criar app/(dashboard)/contratos/novo/page.tsx
- [ ] Criar components/forms/contrato-form.tsx
- [ ] Criar lib/validations/contrato.schema.ts
- [ ] Usar React Hook Form + Zod
- [ ] Upload de documento (bucket: contratos)
- [ ] **Path**: `empresa_id/contrato_${numero}.pdf`
- [ ] Testar: Criação com validações

**Story 6.3: Detalhes do Contrato**
- [ ] Criar app/(dashboard)/contratos/[id]/page.tsx
- [ ] Exibir todos os dados do contrato
- [ ] Listar itens do contrato
- [ ] Ações: Editar, Adicionar Item, Ver Anexo
- [ ] Testar: Navegação e ações

**Story 6.4: Editar Contrato**
- [ ] Criar app/(dashboard)/contratos/[id]/editar/page.tsx
- [ ] Reutilizar ContratoForm
- [ ] Preencher valores atuais
- [ ] Testar: Edição e validações

**Story 6.5: Soft Delete**
- [ ] Adicionar botão "Arquivar" (admin only)
- [ ] Implementar softDelete (deleted_at = NOW())
- [ ] Confirmar ação (confirm-dialog)
- [ ] Testar: Contrato arquivado não aparece

---

### Story 7: Módulo de Itens

**Story 7.1: Lista de Itens do Contrato**
- [ ] Criar app/(dashboard)/contratos/[id]/itens/page.tsx
- [ ] Criar components/tables/itens-table.tsx
- [ ] Exibir: número, descrição, quantidade, saldo, margem
- [ ] **Margem Indicator**: verde/amarelo/vermelho
- [ ] Testar: Listagem de itens

**Story 7.2: Adicionar Item**
- [ ] Criar app/(dashboard)/contratos/[id]/itens/novo/page.tsx
- [ ] Criar components/forms/item-contrato-form.tsx
- [ ] Validar quantidade > 0, valor_unitario > 0
- [ ] **NÃO** incluir custo (será registrado depois)
- [ ] Testar: Criação de item

**Story 7.3: Margem Indicator**
- [ ] Criar components/common/margem-indicator.tsx
- [ ] Cores: verde (>20%), amarelo (10-20%), vermelho (<10%)
- [ ] Props: margem, threshold
- [ ] Tooltip com valor exato
- [ ] Testar: Indicador visual

---

### Story 8: Módulo de Custos (⚠️ Ocultar se logistica)

**Story 8.1: Verificação de Perfil**
- [ ] Em lib/utils/permissions.ts
- [ ] Função: canViewCosts(perfil) → perfil !== 'logistica'
- [ ] No sidebar: ocultar link de custos
- [ ] No routing: bloquear acesso à página
- [ ] Testar: Logistica não acessa

**Story 8.2: Lista de Custos**
- [ ] Criar app/(dashboard)/custos/page.tsx
- [ ] Criar components/tables/custos-table.tsx
- [ ] Listar custos por item (com filtros)
- [ ] Exibir: data, custo unitário, CMP, fornecedor
- [ ] Testar: Listagem de custos

**Story 8.3: Registrar Custo**
- [ ] Criar app/(dashboard)/custos/novo/page.tsx
- [ ] Criar components/forms/custo-form.tsx
- [ ] Selecionar item do contrato
- [ ] Upload de NF entrada (bucket: notas-fiscais-entrada)
- [ ] **Path**: `empresa_id/nf_entrada_${item_id}_${date}.pdf`
- [ ] **Backend recalcula CMP e margem via trigger**
- [ ] Testar: Registro + upload

---

### Story 9: Módulo de Autorizações de Fornecimento

**Story 9.1: Lista de AFs**
- [ ] Criar app/(dashboard)/autorizacoes/page.tsx
- [ ] Criar components/tables/af-table.tsx
- [ ] Filtros: status, contrato, item
- [ ] Exibir: número, data, quantidade, saldo, status
- [ ] Testar: Listagem e filtros

**Story 9.2: Emitir AF**
- [ ] Criar app/(dashboard)/autorizacoes/nova/page.tsx
- [ ] Criar components/forms/af-form.tsx
- [ ] Validar saldo disponível (frontend + backend)
- [ ] Upload de anexo (bucket: autorizacoes-fornecimento)
- [ ] **Path**: `empresa_id/af_${numero}.pdf`
- [ ] Testar: Emissão com validações

**Story 9.3: Detalhes da AF**
- [ ] Criar app/(dashboard)/autorizacoes/[id]/page.tsx
- [ ] Exibir dados da AF
- [ ] Listar entregas vinculadas
- [ ] Mostrar saldo restante
- [ ] Testar: Visualização completa

---

### Story 10: Módulo de Entregas

**Story 10.1: Lista de Entregas**
- [ ] Criar app/(dashboard)/entregas/page.tsx
- [ ] Criar components/tables/entregas-table.tsx
- [ ] Filtros: data, AF, contrato
- [ ] Testar: Listagem

**Story 10.2: Registrar Entrega**
- [ ] Criar app/(dashboard)/entregas/nova/page.tsx
- [ ] Criar components/forms/entrega-form.tsx
- [ ] Selecionar AF
- [ ] Validar quantidade vs saldo AF
- [ ] Upload de NF saída (bucket: notas-fiscais-saida)
- [ ] **Path**: `empresa_id/nf_saida_${af_id}_${date}.pdf`
- [ ] **Backend atualiza saldo AF e item via trigger**
- [ ] Testar: Registro + upload + atualização

---

### Story 11: Módulos de Gestão (Admin)

**Story 11.1: Gestão de Empresas (Admin only)**
- [ ] Criar app/(dashboard)/empresas/page.tsx
- [ ] **Bloquear se perfil !== 'admin'**
- [ ] CRUD de empresas
- [ ] Testar: Apenas admin acessa

**Story 11.2: Gestão de Usuários (Admin only)**
- [ ] Criar app/(dashboard)/usuarios/page.tsx
- [ ] CRUD de usuários
- [ ] Criar components/forms/usuario-form.tsx
- [ ] Selecionar perfil (admin, financeiro, etc)
- [ ] Ativar/Desativar usuário
- [ ] Testar: Gestão completa

**Story 11.3: Gestão de CNPJs**
- [ ] Criar app/(dashboard)/cnpjs/page.tsx
- [ ] CRUD de CNPJs
- [ ] Validar formato (14 dígitos)
- [ ] Testar: CRUD completo

---

### Story 12: Refinamentos e Deploy

**Story 12.1: Responsividade**
- [ ] Testar todas páginas em mobile
- [ ] Ajustar sidebar (drawer no mobile)
- [ ] Ajustar tabelas (scroll horizontal)
- [ ] Testar: Mobile + Tablet + Desktop

**Story 12.2: Error Handling**
- [ ] Criar error boundaries
- [ ] Tratar erros de RLS (403)
- [ ] Mensagens de erro amigáveis
- [ ] Loading states em todas operações
- [ ] Testar: Cenários de erro

**Story 12.3: Performance**
- [ ] Lazy loading de componentes pesados
- [ ] Otimizar imagens
- [ ] Code splitting
- [ ] Testar: Lighthouse score > 90

**Story 12.4: Deploy Vercel**
- [ ] Criar conta Vercel
- [ ] Conectar repositório
- [ ] Configurar variáveis de ambiente
- [ ] Deploy de produção
- [ ] Testar: Sistema em produção

---

## 6. REGRAS CRÍTICAS PARA @dev

### 6.1 Multi-Tenant e RLS

```typescript
// ❌ ERRADO - NUNCA passar empresa_id manualmente
const { data } = await supabase
  .from('contratos')
  .select('*')
  .eq('empresa_id', empresaId)

// ✅ CORRETO - RLS filtra automaticamente
const { data } = await supabase
  .from('contratos')
  .select('*')
// empresa_id é injetado automaticamente pelo RLS
```

**REGRA 1:** NUNCA passar `empresa_id` em queries. RLS filtra automaticamente.

---

### 6.2 Soft Delete

```typescript
// ❌ ERRADO - Não filtra deleted_at
const { data } = await supabase
  .from('contratos')
  .select('*')

// ✅ CORRETO - Filtrar deleted_at IS NULL
const { data } = await supabase
  .from('contratos')
  .select('*')
  .is('deleted_at', null)
```

**REGRA 2:** SEMPRE filtrar `deleted_at IS NULL` em SELECT.

---

### 6.3 Cálculos no Backend

```typescript
// ❌ ERRADO - Recalcular margem no frontend
const margem = ((valorUnitario - custoMedio) / valorUnitario) * 100

// ✅ CORRETO - Apenas exibir valor do backend
const { margem_atual } = item // Backend já calculou via trigger
```

**REGRA 3:** NUNCA recalcular margem, CMP ou saldo. Backend calcula via triggers.

---

### 6.4 Upload de Arquivos

```typescript
// ❌ ERRADO - Path sem empresa_id
const path = `${filename}`
const path = `uploads/${filename}`

// ✅ CORRETO - Path obrigatório: empresa_id/filename
const empresaId = empresa.id // Do contexto
const path = `${empresaId}/${Date.now()}_${file.name}`

await supabase.storage
  .from('contratos')
  .upload(path, file)
```

**REGRA 4:** Upload SEMPRE com path `empresa_id/filename`. RLS bloqueia caso contrário.

---

### 6.5 Perfil Logística

```typescript
// ❌ ERRADO - Renderizar componente de custos
<Link href="/custos">Custos</Link>

// ✅ CORRETO - Verificar perfil antes
const { perfil } = useAuth()
const canViewCosts = perfil !== 'logistica'

{canViewCosts && (
  <Link href="/custos">Custos</Link>
)}
```

**REGRA 5:** Perfil logística NÃO pode ver custos. Bloquear na UI e no routing.

---

### 6.6 Validações

```typescript
// ❌ ERRADO - Confiar apenas no frontend
// Frontend pode ser bypassado

// ✅ CORRETO - Validações críticas no backend
// Frontend: UX (feedback rápido)
// Backend: Segurança (RLS + triggers + constraints)
```

**REGRA 6:** Validações críticas no backend. Frontend apenas UX.

---

### 6.7 Autenticação

```typescript
// ❌ ERRADO - Não verificar usuario.ativo
const { user } = useAuth()
// Usuário pode estar desativado mas ainda autenticado!

// ✅ CORRETO - Middleware verifica ativo
// middleware.ts já bloqueia usuários inativos
// Mas verificar também no AuthContext para UI
const { user, ativo } = useAuth()
if (!ativo) {
  await supabase.auth.signOut()
  redirect('/login')
}
```

**REGRA 7:** Sempre verificar `usuario.ativo` no middleware e no contexto.

---

### 6.8 Service Role Key

```typescript
// ❌ ERRADO - Service role key no frontend
const supabase = createClient(URL, SERVICE_ROLE_KEY)
// Isso BYPASSA TODAS as RLS policies!

// ✅ CORRETO - Usar ANON KEY
const supabase = createClient(URL, ANON_KEY)
// RLS aplicado automaticamente
```

**REGRA 8:** NUNCA usar SERVICE_ROLE_KEY no frontend. Apenas ANON_KEY.

---

### 6.9 Types do Supabase

```typescript
// ❌ ERRADO - Types manuais
interface Contrato {
  id: string
  numero_contrato: string
  // ... pode ficar desatualizado
}

// ✅ CORRETO - Types gerados
import { Database } from '@/types/database.types'
type Contrato = Database['public']['Tables']['contratos']['Row']

// Gerar types: npm run generate-types
```

**REGRA 9:** Usar types gerados do Supabase. Regenerar após mudanças no schema.

---

### 6.10 Error Handling

```typescript
// ❌ ERRADO - Não tratar erros
const { data } = await supabase.from('contratos').select('*')

// ✅ CORRETO - Tratar erros
const { data, error } = await supabase.from('contratos').select('*')
if (error) {
  console.error('Erro ao buscar contratos:', error)
  toast.error('Erro ao carregar contratos')
  return
}
```

**REGRA 10:** SEMPRE tratar erros de queries Supabase.

---

## 7. PADRÕES DE CÓDIGO E CONVENÇÕES

### 7.1 Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `ContratoForm` |
| Arquivos componente | kebab-case | `contrato-form.tsx` |
| Hooks | prefixo `use` | `useContratos` |
| Services | sufixo `.service` | `contratos.service.ts` |
| Types | PascalCase | `ContratoDTO` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE` |
| Functions | camelCase | `formatCurrency` |

### 7.2 Estrutura de Componente

```typescript
// Imports externos
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Imports internos UI
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Imports internos services/hooks
import { useContratos } from '@/lib/hooks/use-contratos'

// Types
interface ContratoFormProps {
  contratoId?: string
  onSuccess?: () => void
}

// Componente
export function ContratoForm({ contratoId, onSuccess }: ContratoFormProps) {
  // State
  const [loading, setLoading] = useState(false)

  // Hooks
  const router = useRouter()
  const { createContrato } = useContratos()

  // Handlers
  const handleSubmit = async (data: ContratoDTO) => {
    // ...
  }

  // Render
  return (
    <Card>
      {/* JSX */}
    </Card>
  )
}
```

### 7.3 Imports Absolutos

```typescript
// ❌ ERRADO - Imports relativos
import { Button } from '../../../components/ui/button'

// ✅ CORRETO - Imports absolutos
import { Button } from '@/components/ui/button'
```

### 7.4 Async/Await

```typescript
// ✅ Padrão
try {
  setLoading(true)
  const data = await service.create(dto)
  toast.success('Sucesso!')
  router.push('/contratos')
} catch (error) {
  console.error('Erro:', error)
  toast.error('Erro ao salvar')
} finally {
  setLoading(false)
}
```

---

## 8. ARQUIVOS BASE ESSENCIAIS

### 8.1 lib/supabase/client.ts

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 8.2 lib/supabase/server.ts

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
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### 8.3 middleware.ts

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

  const { data: { session } } = await supabase.auth.getSession()

  // Rotas públicas
  if (request.nextUrl.pathname.startsWith('/login')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // Rotas protegidas
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verificar usuario.ativo
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('ativo, perfil')
    .eq('id', session.user.id)
    .single()

  if (!usuario?.ativo) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=inactive', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### 8.4 lib/constants/perfis.ts

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
  [PERFIS.logistica]: ['af.read', 'entregas.*'], // SEM custos!
} as const

export function canUser(perfil: Perfil, action: string): boolean {
  const permissions = PERMISSIONS[perfil]
  return permissions.includes('*') || permissions.includes(action)
}

export function canViewCosts(perfil: Perfil): boolean {
  return perfil !== PERFIS.logistica
}
```

### 8.5 lib/constants/buckets.ts

```typescript
export const BUCKETS = {
  CONTRATOS: 'contratos',
  REAJUSTES: 'reajustes',
  NF_ENTRADA: 'notas-fiscais-entrada',
  NF_SAIDA: 'notas-fiscais-saida',
  AF: 'autorizacoes-fornecimento',
} as const

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS]
```

---

## 📊 RESUMO EXECUTIVO

### ✅ Entregáveis

1. **Estrutura completa de pastas**: 100% definida
2. **package.json com versões exatas**: Pronto para instalação
3. **Arquivos de configuração**: tsconfig, tailwind, next.config, etc
4. **12 Stories numeradas**: Roadmap de implementação
5. **10 Regras críticas**: Guia obrigatório para @dev

### 🎯 Próximos Passos

**Para @dev:**
1. Criar diretório `/frontend`
2. Executar `npx create-next-app@14.2.3 frontend`
3. Instalar dependências do package.json
4. Copiar arquivos de configuração
5. Seguir Stories 1.1 em diante

**Estimativa:**
- Setup (Stories 1-3): 2-3 dias
- Services + Dashboard (Stories 4-5): 2-3 dias
- Módulos principais (Stories 6-10): 5-6 dias
- Gestão + Deploy (Stories 11-12): 2 dias
- **Total: ~12 dias** (conforme roadmap original)

---

**Arquitetura completa documentada. Pronta para implementação.** 🏗️

— Aria, arquitetando o futuro 🏛️
