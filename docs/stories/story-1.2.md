# Story 1.2: Configuração Tailwind CSS + shadcn/ui + Identidade Visual

**Tipo:** Setup
**Prioridade:** Crítica
**Estimativa:** 3 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Configurar Tailwind CSS 3.4.3 com design system customizado, inicializar shadcn/ui para componentes reutilizáveis, e implementar a identidade visual oficial "DUO Governance".

---

## 🎨 IDENTIDADE VISUAL "DUO Governance"

### 1. PALETA DE CORES OFICIAL

```typescript
brand: {
  navy: '#0F172A',      // Cor principal: sidebar, header, textos
  emerald: '#10B981',   // Cor de destaque: botões, badges, links ativos
}
```

**Aplicação das cores:**
- **Sidebar:** Background `bg-brand-navy`, texto `text-gray-300`, link ativo `text-brand-emerald`
- **Header:** Background `bg-white`, texto `text-brand-navy`
- **Botões primários:** Background `bg-brand-emerald`, hover `bg-brand-emerald/90`
- **Badges de sucesso/ativo:** Background `bg-brand-emerald/10`, texto `text-brand-emerald`

### 2. TIPOGRAFIA

**Fonte:** Inter (Google Fonts)

- Pesos: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Aplicar como fonte sans-serif padrão em todo o sistema

### 3. LOGOTIPOS (Arquivos já disponíveis na raiz do projeto)

**IMPORTANTE:** O usuário já forneceu os arquivos SVG finais:

- **`Logo.svg`** → Logo completo "DUO GOVERNANCE" (para sidebar e login)
- **`Favicon.svg`** → Símbolo simplificado D+O (para favicon do navegador)

**Ação do @dev nesta story:**
1. Copiar `Logo.svg` da raiz para `frontend/public/logo.svg`
2. Copiar `Favicon.svg` da raiz para `frontend/public/favicon.svg`
3. Criar variante branca do logo para sidebar: `frontend/public/logo-white.svg` (se necessário)

### 4. POSICIONAMENTO DO LOGO (para stories futuras)

**A) Tela de Login (Story 2.4):**
- Logo centralizado ACIMA dos campos de email/senha
- Tamanho: `height: 60px` (largura automática)
- Margin-bottom: `32px`
- Arquivo: `/logo.svg` (versão colorida)
- Impacto: "Software profissional de prateleira"

**B) Sidebar (Story 3.1):**
- Logo no TOPO da sidebar
- Posição: Fixo no topo, padding `16px`
- Tamanho: `height: 40px` (largura automática)
- Arquivo: `/logo-white.svg` (versão clara para fundo navy)
- Sempre visível durante navegação

**C) Favicon (app/layout.tsx - Story 1.1 ou nesta story):**
- Arquivo: `/favicon.svg`
- Aparece na aba do navegador

---

## 📋 Pré-requisitos

- [x] **Story 1.1 concluída:** Projeto Next.js inicializado
- [ ] Servidor de desenvolvimento parado (`Ctrl+C` no terminal)

---

## 📁 Arquivos a Criar/Modificar

```
frontend/
├── tailwind.config.ts             # ✏️ Modificar (cores brand + fonte Inter)
├── postcss.config.mjs             # ✅ Já existe (verificar)
├── app/
│   ├── globals.css                # ✏️ Modificar (import Inter + variáveis CSS)
│   ├── layout.tsx                 # ✏️ Modificar (favicon + metadata)
│   └── page.tsx                   # ✏️ Modificar (página de teste com logo)
├── components.json                # ✅ Criar (shadcn/ui config)
├── lib/utils/cn.ts                # ✅ Criar (utility para class names)
├── components/ui/                 # ✅ Criar (componentes shadcn)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── label.tsx
└── public/                        # ✅ Copiar logos
    ├── logo.svg                   # ⭐ Logo completo DUO Governance
    └── favicon.svg                # ⭐ Favicon DUO Governance
```

**Arquivos fonte (na raiz do projeto):**
```
gestao-contratos/
├── Logo.svg                       # ⭐ Já existe - copiar para frontend/public/
└── Favicon.svg                    # ⭐ Já existe - copiar para frontend/public/
```

---

## 🔨 Tarefas

### 1. Configurar Tailwind Config Completo com Identidade Visual

Substituir `frontend/tailwind.config.ts`:

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
        // ⭐ Cores da Identidade Visual "DUO Governance"
        brand: {
          navy: '#0F172A',      // Cor principal: sidebar, header, textos
          emerald: '#10B981',   // Cor de destaque: botões, badges, links ativos
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
      // ⭐ Fonte da Identidade Visual "DUO Governance"
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
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

### 2. Configurar Global Styles com Fonte Inter (app/globals.css)

Substituir `frontend/app/globals.css`:

```css
/* ⭐ Importar fonte Inter (Google Fonts) - Identidade Visual DUO Governance */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 3. Verificar PostCSS Config

Verificar que `frontend/postcss.config.mjs` existe e contém:

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

export default config
```

### 4. Criar Class Name Utility

Criar `frontend/lib/utils/cn.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 5. Inicializar shadcn/ui

Executar no terminal:

```bash
cd frontend
npx shadcn-ui@latest init
```

**Responder ao prompt:**
- ✓ Which style would you like to use? **Default**
- ✓ Which color would you like to use as base color? **Slate**
- ✓ Would you like to use CSS variables for colors? **Yes**

Isso criará `frontend/components.json`:

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

### 6. Adicionar Componentes Base do shadcn/ui

Instalar os 5 componentes mais utilizados:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add label
```

Isso criará:
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/card.tsx`
- `components/ui/dialog.tsx`
- `components/ui/label.tsx`

### 7. Copiar Arquivos de Logo (Identidade Visual)

**IMPORTANTE:** Os arquivos `Logo.svg` e `Favicon.svg` já estão disponíveis na raiz do projeto.

Copiar os arquivos de logo para o diretório `public/`:

**No Windows (PowerShell):**
```powershell
cd frontend
Copy-Item ..\Logo.svg public\logo.svg
Copy-Item ..\Favicon.svg public\favicon.svg
```

**No Linux/macOS (Bash):**
```bash
cd frontend
cp ../Logo.svg public/logo.svg
cp ../Favicon.svg public/favicon.svg
```

**Verificar:**
```bash
ls public/
# Deve listar: logo.svg, favicon.svg
```

### 8. Configurar Favicon no Layout

Editar `frontend/app/layout.tsx` para incluir o favicon:

```typescript
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "DUO Governance - Gestão de Contratos",
  description: "Sistema de gestão de contratos multi-tenant",
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}
```

### 9. Criar Página de Teste com Logo

Modificar `frontend/app/page.tsx` para testar os componentes e o logo:

```typescript
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8 bg-gray-50">
      {/* ⭐ Logo DUO Governance */}
      <div className="mb-8">
        <Image
          src="/logo.svg"
          alt="DUO Governance"
          width={240}
          height={60}
          className="h-15 w-auto"
          priority
        />
      </div>

      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-brand-navy">Gestão de Contratos</CardTitle>
          <CardDescription>Sistema de gestão multi-tenant com Supabase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full bg-brand-emerald hover:bg-brand-emerald/90">
            Entrar
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>

      {/* ⭐ Teste de cores da marca */}
      <div className="flex gap-4 mt-8">
        <div className="w-24 h-24 bg-brand-navy rounded-lg flex items-center justify-center text-white text-xs">
          Navy
        </div>
        <div className="w-24 h-24 bg-brand-emerald rounded-lg flex items-center justify-center text-white text-xs">
          Emerald
        </div>
      </div>
    </main>
  )
}
```

---

## ✅ Critérios de Aceitação (Done When...)

### Tailwind CSS e shadcn/ui:
- [ ] `tailwind.config.ts` atualizado com cores customizadas (success, warning, danger)
- [ ] `postcss.config.mjs` configurado corretamente
- [ ] `app/globals.css` atualizado com variáveis CSS e modo dark
- [ ] `lib/utils/cn.ts` criado (utility para class names)
- [ ] `components.json` criado pela CLI do shadcn/ui
- [ ] 5 componentes base instalados: button, input, card, dialog, label

### Identidade Visual "DUO Governance":
- [ ] Cores `brand-navy` (#0F172A) e `brand-emerald` (#10B981) adicionadas ao `tailwind.config.ts`
- [ ] Fonte Inter importada no `globals.css` via Google Fonts
- [ ] `fontFamily.sans: ['Inter', 'sans-serif']` configurado no `tailwind.config.ts`
- [ ] `Logo.svg` copiado para `frontend/public/logo.svg`
- [ ] `Favicon.svg` copiado para `frontend/public/favicon.svg`
- [ ] Favicon configurado em `app/layout.tsx` (metadata.icons.icon)
- [ ] Título e descrição atualizados em `app/layout.tsx` (DUO Governance)

### Página de Teste:
- [ ] Página de teste criada em `app/page.tsx` com logo DUO Governance
- [ ] Logo exibido no topo da página (Image component do Next.js)
- [ ] Card de login usa `text-brand-navy` no título
- [ ] Botão "Entrar" usa `bg-brand-emerald` e `hover:bg-brand-emerald/90`
- [ ] Boxes de teste exibem cores brand-navy e brand-emerald

### Testes:
- [ ] **Teste:** `npm run dev` inicia sem erros de CSS
- [ ] **Teste:** Página exibe logo DUO Governance no topo
- [ ] **Teste:** Favicon DUO Governance aparece na aba do navegador
- [ ] **Teste:** Fonte Inter aplicada em todos os textos (verificar no DevTools)
- [ ] **Teste:** Card de login estilizado com cores da marca
- [ ] **Teste:** Botões exibem variantes (default, secondary, destructive, outline, ghost)
- [ ] **Teste:** Cores customizadas aplicadas (verificar no DevTools: brand-navy, brand-emerald)
- [ ] **Teste:** Boxes coloridos exibem navy (#0F172A) e emerald (#10B981)

---

## 🔗 Dependências

- **Story 1.1:** Projeto Next.js inicializado

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **Identidade Visual "DUO Governance":**
   - SEMPRE usar `brand-navy` e `brand-emerald` nas cores principais
   - SEMPRE usar fonte Inter em todo o sistema
   - Logo deve aparecer em TODAS as telas (login, sidebar, etc)
   - Favicon deve estar visível na aba do navegador

2. **Cores customizadas:** success (verde), warning (amarelo), danger (vermelho) serão usadas para indicadores de margem

3. **Modo dark:** Configurado mas não implementado na UI ainda (Fase 2)

4. **Utility cn():** Sempre usar para combinar classes Tailwind com lógica condicional

5. **Logo:**
   - Use `next/image` (Image component) para carregar o logo
   - Sempre adicione `priority` ao logo principal (above the fold)
   - Altura fixa (`height: 60px` login, `height: 40px` sidebar), largura automática

### 🔍 Troubleshooting:

**Se componentes shadcn não aparecem estilizados:**
- Verificar `globals.css` importado em `app/layout.tsx`
- Verificar variáveis CSS (--primary, --border, etc) definidas em `:root`

**Se `npx shadcn-ui@latest add` falhar:**
- Verificar `components.json` existe
- Verificar internet conectada
- Tentar novamente ou reportar erro

**Se cores brand-navy/brand-emerald não aplicam:**
- Verificar `tailwind.config.ts` tem as cores na seção `theme.extend.colors.brand`
- Fazer hard refresh (Ctrl+Shift+R)
- Reiniciar servidor dev
- Verificar no DevTools: elemento deve ter `background-color: rgb(15, 23, 42)` para navy

**Se fonte Inter não carrega:**
- Verificar `@import url(...)` no topo do `globals.css`
- Verificar internet conectada (Google Fonts precisa de internet)
- Verificar no DevTools → Computed → font-family: deve mostrar "Inter"

**Se logo não aparece:**
- Verificar arquivos `Logo.svg` e `Favicon.svg` existem em `frontend/public/`
- Verificar caminho no código: `/logo.svg` (relativo ao public/)
- Verificar console do navegador por erros 404
- Verificar Image component do Next.js (deve usar `next/image`, não `<img>`)

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 1.3:** Setup Supabase Client

---

## 📚 Referências Futuras

A identidade visual implementada nesta story será usada em:

- **Story 2.4 (Login):** Logo centralizado acima do formulário
- **Story 3.1 (Sidebar):** Logo no topo da sidebar (versão branca)
- **Story 3.2 (Permissões):** Badges com cores brand-emerald
- **Story 5.x (Dashboard):** Gráficos com paleta brand
- **Story 6.x+ (Módulos):** Botões primários com brand-emerald

**Código de Exemplo para Sidebar (Story 3.1):**
```tsx
<aside className="w-64 bg-brand-navy min-h-screen">
  <div className="p-4 border-b border-white/10">
    <Image
      src="/logo-white.svg"
      alt="DUO Governance"
      width={160}
      height={40}
      className="h-10 w-auto"
    />
  </div>
  <nav className="p-4">
    <Link
      href="/dashboard"
      className="flex items-center gap-2 text-gray-300 hover:text-brand-emerald hover:bg-white/5 px-3 py-2 rounded-md"
    >
      Dashboard
    </Link>
  </nav>
</aside>
```

**Código de Exemplo para Login (Story 2.4):**
```tsx
<div className="min-h-screen flex items-center justify-center bg-gray-50">
  <div className="max-w-md w-full space-y-8">
    <div className="text-center">
      <Image
        src="/logo.svg"
        alt="DUO Governance"
        width={240}
        height={60}
        className="h-15 w-auto mx-auto mb-8"
        priority
      />
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-brand-navy">Bem-vindo</CardTitle>
      </CardHeader>
      <CardContent>
        <form>
          {/* campos */}
          <Button className="w-full bg-brand-emerald hover:bg-brand-emerald/90">
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</div>
```

---

**Status:** ⏳ Aguardando implementação
**Criado por:** @sm (River) - 2026-02-13
**Atualizado por:** @sm (River) - 2026-02-18 (Identidade Visual DUO Governance)
