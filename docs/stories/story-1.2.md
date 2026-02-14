# Story 1.2: Configuração Tailwind CSS + shadcn/ui

**Tipo:** Setup
**Prioridade:** Crítica
**Estimativa:** 2 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Configurar Tailwind CSS 3.4.3 com design system customizado e inicializar shadcn/ui para componentes reutilizáveis.

---

## 📋 Pré-requisitos

- [x] **Story 1.1 concluída:** Projeto Next.js inicializado
- [ ] Servidor de desenvolvimento parado (`Ctrl+C` no terminal)

---

## 📁 Arquivos a Criar/Modificar

```
frontend/
├── tailwind.config.ts             # ✏️ Modificar (configuração completa)
├── postcss.config.mjs             # ✅ Já existe (verificar)
├── app/globals.css                # ✏️ Modificar (variáveis CSS)
├── components.json                # ✅ Criar (shadcn/ui config)
├── lib/utils/cn.ts                # ✅ Criar (utility para class names)
└── components/ui/                 # ✅ Criar (componentes shadcn)
    ├── button.tsx
    ├── input.tsx
    ├── card.tsx
    ├── dialog.tsx
    └── label.tsx
```

---

## 🔨 Tarefas

### 1. Configurar Tailwind Config Completo

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

### 2. Configurar Global Styles (app/globals.css)

Substituir `frontend/app/globals.css`:

```css
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

### 7. Criar Página de Teste

Modificar `frontend/app/page.tsx` para testar os componentes:

```typescript
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Gestão de Contratos</CardTitle>
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
          <Button className="w-full">Entrar</Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    </main>
  )
}
```

---

## ✅ Critérios de Aceitação (Done When...)

- [ ] `tailwind.config.ts` atualizado com cores customizadas (success, warning, danger)
- [ ] `app/globals.css` atualizado com variáveis CSS e modo dark
- [ ] `postcss.config.mjs` configurado corretamente
- [ ] `lib/utils/cn.ts` criado (utility para class names)
- [ ] `components.json` criado pela CLI do shadcn/ui
- [ ] 5 componentes base instalados: button, input, card, dialog, label
- [ ] Página de teste criada em `app/page.tsx`
- [ ] **Teste:** `npm run dev` inicia sem erros de CSS
- [ ] **Teste:** Página exibe card de login estilizado
- [ ] **Teste:** Botões exibem variantes (default, secondary, destructive, outline, ghost)
- [ ] **Teste:** Cores customizadas aplicadas (verificar no DevTools)

---

## 🔗 Dependências

- **Story 1.1:** Projeto Next.js inicializado

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **Cores customizadas:** success (verde), warning (amarelo), danger (vermelho) serão usadas para indicadores de margem
2. **Modo dark:** Configurado mas não implementado na UI ainda (Fase 2)
3. **Utility cn():** Sempre usar para combinar classes Tailwind com lógica condicional

### 🔍 Troubleshooting:

**Se componentes shadcn não aparecem estilizados:**
- Verificar `globals.css` importado em `app/layout.tsx`
- Verificar variáveis CSS (--primary, --border, etc) definidas em `:root`

**Se `npx shadcn-ui@latest add` falhar:**
- Verificar `components.json` existe
- Verificar internet conectada
- Tentar novamente ou reportar erro

**Se cores não aplicam:**
- Verificar `tailwind.config.ts` tem as cores customizadas
- Fazer hard refresh (Ctrl+Shift+R)
- Reiniciar servidor dev

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 1.3:** Setup Supabase Client

---

**Status:** ⏳ Aguardando implementação
**Criado por:** @sm (River) - 2026-02-13
