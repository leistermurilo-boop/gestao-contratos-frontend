# Story 12.3: Build de Produção e Variáveis de Ambiente

**Tipo:** DevOps | **Prioridade:** Alta | **Estimativa:** 1h | **Responsável:** @dev/@devops
**Fase:** 12 — Deploy

## 🎯 Objetivo
Garantir que o build de produção passa sem erros, configurar todas as variáveis de ambiente para produção e documentar o processo de deploy.

## 📁 Arquivos
```
frontend/.env.local.example         # 🔄 Atualizar com novas vars (SUPABASE_SERVICE_ROLE_KEY)
frontend/next.config.js             # 🔍 Verificar configuração de produção
```

## 🔑 Variáveis de Ambiente

### `.env.local` (desenvolvimento) — NUNCA commitar
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[chave-anon]
SUPABASE_SERVICE_ROLE_KEY=[chave-service-role]   # ← NOVA (Story 11.2)
```

### Vercel (produção) — configurar no painel
```
NEXT_PUBLIC_SUPABASE_URL        → URL do projeto Supabase (produção)
NEXT_PUBLIC_SUPABASE_ANON_KEY   → Anon key (produção)
SUPABASE_SERVICE_ROLE_KEY       → Service role key (produção) — marcar como "Sensitive"
```

**⚠️ Supabase Produção vs Desenvolvimento:**
- Se o banco Supabase já é o de produção (branch main), usar as mesmas URLs
- Se tiver ambiente separado, configurar URLs distintas

## 🔨 Implementação

### 1. Verificar build local
```bash
cd frontend
npm run build
# Esperado: ✓ Compiled successfully
# Verificar: 0 TypeScript errors, 0 ESLint errors
```

**Erros comuns em build de produção:**
- `useSearchParams()` sem `Suspense` wrapper → envolver em `<Suspense>`
- Imports de módulos Node.js em Client Components → mover para Server ou API Route
- `any` type escapando pelo build → corrigir

### 2. Testar build localmente
```bash
npm run build && npm run start
# Acessar http://localhost:3000 e testar fluxo completo
```

### 3. Verificar `next.config.js`
```javascript
// Verificar se não há configurações problemáticas:
// - images.domains (se usar imagens externas)
// - experimental features desnecessárias
// - redirects obsoletos
```

### 4. Atualizar `.env.local.example`
```bash
# Garantir que SUPABASE_SERVICE_ROLE_KEY está documentado:
SUPABASE_SERVICE_ROLE_KEY=    # Obter em: Supabase → Settings → API → service_role
# ⚠️ NUNCA commitar a chave real — apenas este template
```

### 5. Verificar `.gitignore`
```
# Confirmar que .env.local está no .gitignore
.env.local
.env*.local
```

## ✅ Critérios
- [x] `npm run build` → 0 erros
- [x] `npm run start` → app funcional em produção local
- [x] `.env.example` atualizado com SUPABASE_SERVICE_ROLE_KEY
- [x] `.env.local` no `.gitignore` (nunca commitar chaves)
- [x] Variáveis documentadas para configuração no Vercel

## ⚠️ Regras Críticas
- NUNCA commitar `.env.local` com chaves reais
- `SUPABASE_SERVICE_ROLE_KEY` NUNCA deve aparecer em código cliente (apenas API Routes)
- Confirmar que `NEXT_PUBLIC_*` vars SÃO seguras para expor (anon_key é pública por design do Supabase)

**Status:** ✅ Concluída | **Criado:** @sm/@architect — 2026-02-21 | **Concluído:** 2026-02-20
