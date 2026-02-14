# 🛠️ GUIA DE SETUP - Ambiente de Desenvolvimento

## 🎯 OBJETIVO
Preparar ambiente completo para desenvolvimento e deploy do sistema de Gestão de Contratos.

---

## 📋 PRÉ-REQUISITOS

### **Ferramentas Necessárias**
- [x] Node.js 18+ ([Download](https://nodejs.org/))
- [x] npm ou yarn ou pnpm
- [x] Git ([Download](https://git-scm.com/))
- [x] VS Code (recomendado) ([Download](https://code.visualstudio.com/))
- [x] Conta Supabase (gratuita) ([Sign Up](https://supabase.com/))

### **Extensões VS Code Recomendadas**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "supabase.supabase-vscode"
  ]
}
```

---

## 🗄️ PARTE 1: CONFIGURAÇÃO DO SUPABASE

### **1.1 Criar Projeto Supabase**

1. Acesse [supabase.com](https://supabase.com/)
2. Clique em "New Project"
3. Preencha:
   - Nome: `gestao-contratos-prod`
   - Password: (senha forte do banco)
   - Region: `South America (São Paulo)` (mais próximo)
   - Pricing: Free (para começar)

4. Aguarde ~2 minutos (criação do projeto)

### **1.2 Obter Credenciais**

Vá em **Project Settings** → **API**:
```env
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbG...
service_role key: eyJhbG... (NUNCA exponha no frontend!)
```

Salve estas informações! ⚠️

### **1.3 Executar Scripts SQL**

**Após você enviar os scripts, farei:**

1. Ir em **SQL Editor** no Supabase
2. Criar novo query
3. Colar o script completo
4. Executar (Run)
5. Verificar se executou sem erros

**Ordem de execução:**
1. `1_esquema_core.sql` (empresas, cnpjs, usuarios)
2. `2_contratos_itens.sql` (contratos, itens_contrato)
3. `3_schema_operacional.sql` (AF, entregas, custos)
4. `4_auditoria_reajustes.sql` (auditoria, reajustes)
5. `5_triggers.sql` (todos os triggers)
6. `6_functions.sql` (functions PostgreSQL)
7. `7_rls_policies.sql` (Row Level Security)
8. `8_indexes.sql` (indexes de performance)
9. `9_storage_buckets.sql` (configuração de storage)

### **1.4 Verificar Database**

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deve retornar 10 tabelas:
-- auditoria
-- autorizacoes_fornecimento
-- cnpjs
-- contratos
-- custos_item
-- empresas
-- entregas
-- itens_contrato
-- reajustes
-- usuarios
```

### **1.5 Configurar Storage**

Ir em **Storage** → Criar buckets:

1. **contratos**
   - Public: No
   - File size limit: 10 MB
   - Allowed MIME types: application/pdf

2. **autorizacoes-fornecimento**
   - Public: No
   - File size limit: 5 MB
   - Allowed MIME types: application/pdf

3. **notas-fiscais-entrada**
   - Public: No
   - File size limit: 5 MB
   - Allowed MIME types: application/pdf, image/png, image/jpeg

4. **notas-fiscais-saida**
   - Public: No
   - File size limit: 5 MB
   - Allowed MIME types: application/pdf, image/png, image/jpeg

5. **reajustes**
   - Public: No
   - File size limit: 10 MB
   - Allowed MIME types: application/pdf

### **1.6 Configurar Auth**

**Settings** → **Authentication**:
- [x] Enable Email Confirmations: No (para MVP)
- [x] Enable Email Signups: Yes
- [x] Site URL: `http://localhost:3000` (dev) / `https://seudominio.com` (prod)
- [x] Redirect URLs: `http://localhost:3000/auth/callback`

---

## 💻 PARTE 2: CONFIGURAÇÃO DO FRONTEND

### **2.1 Clonar/Criar Repositório**

```bash
# Opção 1: Criar novo projeto
npx create-next-app@latest gestao-contratos-frontend --typescript --tailwind --app --src-dir=false --import-alias="@/*"

cd gestao-contratos-frontend

# Opção 2: Clonar repositório (se já existir)
git clone <seu-repositorio>
cd gestao-contratos-frontend
```

### **2.2 Instalar Dependências**

```bash
# Core
npm install @supabase/supabase-js @supabase/ssr

# UI Components
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover
npm install @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast
npm install @radix-ui/react-label @radix-ui/react-slot

# Forms
npm install react-hook-form @hookform/resolvers zod

# Utils
npm install date-fns clsx tailwind-merge
npm install lucide-react
npm install react-hot-toast

# Charts
npm install recharts

# Tables
npm install @tanstack/react-table

# Dev dependencies
npm install -D @types/node @types/react @types/react-dom
```

### **2.3 Instalar shadcn/ui**

```bash
# Inicializar shadcn/ui
npx shadcn-ui@latest init

# Escolher:
# TypeScript: Yes
# Style: Default
# Base color: Slate
# CSS variables: Yes

# Adicionar componentes
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add form
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add label
```

### **2.4 Configurar Variáveis de Ambiente**

Criar `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# Apenas para backend/server components (NUNCA no frontend!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Criar `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

### **2.5 Gerar Types do Supabase**

```bash
# Instalar CLI do Supabase
npm install -D supabase

# Fazer login
npx supabase login

# Gerar types
npx supabase gen types typescript --project-id "seu-project-id" > types/database.types.ts
```

Ou manualmente:
1. Ir no Supabase Dashboard
2. **Project Settings** → **API Docs**
3. Copiar TypeScript types

### **2.6 Estrutura de Pastas**

Criar estrutura base:
```bash
mkdir -p app/\(auth\) app/\(dashboard\)
mkdir -p components/{ui,layout,forms,tables,charts,modals,common}
mkdir -p lib/{supabase,hooks,services,validations,utils,constants}
mkdir -p types contexts
```

---

## 🔧 PARTE 3: CONFIGURAÇÃO DE DESENVOLVIMENTO

### **3.1 TypeScript Config**

Atualizar `tsconfig.json`:
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

### **3.2 Tailwind Config**

Atualizar `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
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

### **3.3 ESLint & Prettier**

`.eslintrc.json`:
```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

`.prettierrc`:
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

---

## 🚀 PARTE 4: EXECUTAR O PROJETO

### **4.1 Modo Desenvolvimento**

```bash
npm run dev
```

Abrir: `http://localhost:3000`

### **4.2 Build de Produção**

```bash
# Criar build
npm run build

# Testar build localmente
npm run start
```

### **4.3 Verificar Funcionamento**

Checklist:
- [ ] App abre sem erros
- [ ] Consegue fazer login
- [ ] Dashboard carrega
- [ ] Consegue criar contrato
- [ ] Upload de arquivo funciona
- [ ] Dados persistem no Supabase
- [ ] RLS está bloqueando acessos indevidos

---

## 🔍 PARTE 5: DEBUGGING & VALIDAÇÃO

### **5.1 Verificar Conexão Supabase**

Criar `app/api/health/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.from('empresas').select('count')
    
    if (error) throw error
    
    return Response.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return Response.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 })
  }
}
```

Testar: `http://localhost:3000/api/health`

### **5.2 Verificar RLS**

No console do browser:
```javascript
// Tentar acessar dados de outra empresa
// DEVE retornar vazio ou erro
const { data } = await supabase
  .from('contratos')
  .select('*')
  .eq('empresa_id', 'uuid-de-outra-empresa')

console.log(data) // Deve ser []
```

### **5.3 Logs Úteis**

No Supabase Dashboard:
- **Database** → **Logs** (queries executadas)
- **Auth** → **Logs** (tentativas de login)
- **Storage** → **Logs** (uploads)

---

## 📦 PARTE 6: DEPLOY

### **6.1 Vercel (Recomendado para Next.js)**

```bash
# Instalar CLI da Vercel
npm install -g vercel

# Deploy
vercel

# Seguir instruções
# Adicionar environment variables no dashboard
```

### **6.2 Configurar Domínio Customizado**

1. Vercel Dashboard → Settings → Domains
2. Adicionar domínio
3. Atualizar DNS (A record / CNAME)
4. Aguardar propagação (~24h)

### **6.3 Atualizar Supabase**

No Supabase Dashboard:
- **Authentication** → **URL Configuration**
  - Site URL: `https://seudominio.com`
  - Redirect URLs: `https://seudominio.com/auth/callback`

---

## ✅ CHECKLIST FINAL

### **Database**
- [ ] Todas as tabelas criadas
- [ ] Triggers funcionando
- [ ] RLS policies ativas
- [ ] Storage buckets configurados
- [ ] Seeds de teste inseridos

### **Frontend**
- [ ] Dependências instaladas
- [ ] Environment variables configuradas
- [ ] Types do Supabase gerados
- [ ] Build sem erros
- [ ] Testes básicos passando

### **Segurança**
- [ ] RLS testado e funcionando
- [ ] Service role key NUNCA no frontend
- [ ] HTTPS em produção
- [ ] CORS configurado
- [ ] Rate limiting (Supabase)

### **Produção**
- [ ] Deploy bem-sucedido
- [ ] Domínio funcionando
- [ ] SSL ativo
- [ ] Monitoramento configurado
- [ ] Backups automáticos

---

## 🆘 TROUBLESHOOTING

### **Erro: "Failed to fetch"**
- Verificar NEXT_PUBLIC_SUPABASE_URL
- Verificar se projeto Supabase está ativo

### **Erro: "RLS policy violation"**
- Verificar se usuário está autenticado
- Verificar policies no Supabase
- Verificar claims do JWT

### **Erro: "Upload failed"**
- Verificar se bucket existe
- Verificar policies do storage
- Verificar tamanho do arquivo

### **Erro: "Build failed"**
- Verificar TypeScript errors
- Verificar environment variables
- Limpar cache: `rm -rf .next`

---

## 📚 RECURSOS ÚTEIS

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Pronto! Ambiente configurado e funcionando! 🚀**

Aguardando seus scripts SQL para começar o desenvolvimento! 💪
