# Story 1.1: Inicialização do Projeto Next.js 14

**Tipo:** Setup
**Prioridade:** Crítica
**Estimativa:** 2 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Inicializar o projeto Next.js 14.2.3 com TypeScript, estrutura de pastas base e configuração inicial completa.

---

## 📋 Pré-requisitos

- [ ] Node.js 18+ instalado
- [ ] npm/yarn/pnpm disponível
- [ ] Git configurado
- [ ] Acesso ao repositório

---

## 📁 Arquivos a Criar

```
C:\projetos\gestao-contratos\frontend\
├── .env.local                     # Variáveis de ambiente (criar manualmente)
├── .env.example                   # Template de variáveis
├── package.json                   # Dependências
├── tsconfig.json                  # TypeScript config
├── next.config.mjs                # Next.js config
├── .gitignore                     # Git ignore
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   ├── globals.css                # Global styles
│   └── favicon.ico                # Favicon
├── components/                    # Componentes (vazio inicialmente)
├── lib/                           # Bibliotecas (vazio inicialmente)
├── types/                         # Types (vazio inicialmente)
├── contexts/                      # Contexts (vazio inicialmente)
└── public/                        # Assets estáticos
```

---

## 🔨 Tarefas

### 1. Criar Projeto Next.js

```bash
cd C:\projetos\gestao-contratos
npx create-next-app@14.2.3 frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**Responda ao prompt:**
- ✓ Would you like to use TypeScript? **Yes**
- ✓ Would you like to use ESLint? **Yes**
- ✓ Would you like to use Tailwind CSS? **Yes**
- ✓ Would you like to use `src/` directory? **No**
- ✓ Would you like to use App Router? **Yes**
- ✓ Would you like to customize the default import alias? **No** (usa @/*)

### 2. Instalar Dependências Completas

Substituir `package.json` pelo conteúdo completo:

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

Instalar:

```bash
cd frontend
npm install
```

### 3. Configurar TypeScript (tsconfig.json)

Substituir `tsconfig.json`:

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

### 4. Criar Estrutura de Pastas Base

```bash
cd frontend
mkdir -p components/ui components/layout components/forms components/tables components/charts components/modals components/common
mkdir -p lib/supabase lib/hooks lib/services lib/validations lib/utils lib/constants
mkdir -p types contexts public/images
mkdir -p app/\(auth\)/login app/\(auth\)/register app/\(auth\)/recuperar-senha
mkdir -p app/\(dashboard\)/dashboard
```

### 5. Criar .env.local

Criar `frontend/.env.local` (⚠️ **NÃO commitar**):

```bash
# Supabase (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL=https://hstlbkudwnboebmarilp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdGxia3Vkd25ib2VibWFyaWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Mzk4NjgsImV4cCI6MjA4NjMxNTg2OH0.DnajpQdO-w5YA_zIOhvhjBSJMkQARvdATgUAt4RIcPY

# NUNCA exponha service role key no frontend!
# SUPABASE_SERVICE_ROLE_KEY é apenas para backend/scripts

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 6. Criar .env.example

Criar `frontend/.env.example` (commitar este):

```bash
# Supabase (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL=sua-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 7. Atualizar .gitignore

Garantir que `.env.local` está no `.gitignore`:

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

## ✅ Critérios de Aceitação (Done When...)

- [ ] Projeto Next.js 14.2.3 inicializado em `/frontend`
- [ ] Todas as dependências do `package.json` instaladas sem erros
- [ ] `tsconfig.json` configurado com paths `@/*`
- [ ] Estrutura de pastas base criada (components, lib, types, contexts, public)
- [ ] `.env.local` criado com credenciais Supabase válidas
- [ ] `.env.example` criado como template
- [ ] `.gitignore` atualizado para excluir `.env.local`
- [ ] **Teste:** `npm run dev` inicia servidor em `http://localhost:3000` sem erros
- [ ] **Teste:** Página inicial do Next.js é exibida no navegador

---

## 🔗 Dependências

**Nenhuma** - Esta é a primeira story do setup.

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **NUNCA commitar `.env.local`** - Contém credenciais sensíveis
2. **Usar ANON_KEY** - Nunca SERVICE_ROLE_KEY no frontend
3. **Versões exatas** - Respeitar as versões do package.json

### 🔍 Troubleshooting:

**Se `npm install` falhar:**
- Verificar conexão com internet
- Limpar cache: `npm cache clean --force`
- Deletar `node_modules` e `package-lock.json`, tentar novamente

**Se `npm run dev` falhar:**
- Verificar porta 3000 não está em uso
- Verificar `.env.local` existe e tem valores corretos
- Verificar erros no console

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 1.2:** Configuração Tailwind CSS + shadcn/ui

---

**Status:** ⏳ Aguardando implementação
**Criado por:** @sm (River) - 2026-02-13
