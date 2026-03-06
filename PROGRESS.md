# PROGRESS.md - Estado do Projeto

**Data:** 2026-03-05 (última atualização — fim do dia)
**Sessão:** Fase 15 — Fix race condition pós-login (timeout 400ms → 2000ms)

---

## 📊 RESUMO EXECUTIVO — O QUE FOI FEITO (sessão 05/03/2026)

### Fix race condition pós-login — `DashboardLayout`:

**Sintoma:** Após login, dashboard às vezes redirecionava para `/login` ou travava em spinner.

**Causa:** `processSession` do AuthProvider pode levar até 1.5s (fetch Supabase + validação
usuário ativo). O debounce anterior de 400ms era insuficiente — `signIn()` retorna antes de
`processSession` completar, gerando janela breve de `user=null` no `DashboardLayout` que
disparava redirect prematuro para `/login`.

**Fix:** `frontend/app/(dashboard)/layout.tsx` — timeout 400ms → 2000ms.
**Commit:** `4915187` — push para main + Vercel deploy.

---

## 📊 RESUMO EXECUTIVO — O QUE FOI FEITO (sessão 25/02/2026 — COMPLETO)

### 🔐 Correção Definitiva de Autenticação (7 bugs + 1 bug de logout pós-testes):

**Análise técnica profunda — bugs identificados e corrigidos:**

**BUG 1 — `client.ts` sem singleton real**
- `createClient()` criava nova instância a cada montagem do AuthProvider
- Múltiplos `onAuthStateChange` listeners → race conditions
- Fix: variável `_client` no nível de módulo (singleton garantido)

**BUG 2 — Fallback usava `getSession()` (lê cache local)**
- `getSession()` detectava token expirado em storage como sessão válida
- Causava redirect indevido para `/dashboard` sem autenticação real
- Fix: substituído por `getUser()` que valida sempre no servidor Supabase

**BUG 3 — `processSession` descartava `TOKEN_REFRESHED`**
- Se `INITIAL_SESSION` e `TOKEN_REFRESHED` chegassem juntos, o segundo era descartado
- Usuário ficava com token prestes a expirar → logout inesperado segundos depois
- Fix: fila `pendingSessionRef` — sessão pendente reprocessada via `setTimeout(0)`

**BUG 4 — `signOut` não invalidava o Router Cache**
- `router.push('/login')` deixava páginas protegidas no App Router Cache (30s–5min)
- Fix: `window.location.href` (full reload) em vez de `router.push`

**BUG 5 — Dupla navegação no `signIn`**
- `signIn()` sempre navegava para `/dashboard`, e a página de login navegava de novo se havia `?redirect=`
- Duas navegações concorrentes → race condition + flash de tela
- Fix: `signIn()` não navega mais; navegação centralizada no `onSubmit` do login

**BUG 6 — `server.ts` com API `get/set/remove` (obsoleta)**
- Incompatível com `@supabase/ssr@0.5.x`; podia perder cookies em Server Components
- Fix: migrado para `getAll/setAll`

**BUG 7 — Cache-Control ausente nas rotas de auth**
- `/login`, `/cadastro`, `/recuperar-senha`, `/callback` sem `no-store`
- Edge CDN podia servir versão cacheada ignorando redirects do middleware
- Fix: `no-store` adicionado no `next.config.mjs`

**BUG 8 (identificado pós-testes) — Logout não limpava cookies HTTP**
- `supabase.auth.signOut()` client-side não consegue limpar cookies escritos pelo middleware
- Access token JWT permanecia válido no cookie (até 1h); fechar e reabrir → `/dashboard`
- Fix: nova API route `GET /api/auth/signout` (server-side, padrão idêntico ao middleware)
  - Cria Supabase client server-side com acesso real aos cookies HTTP
  - Revoga refresh token com `scope: 'global'`
  - Devolve `Set-Cookie` headers que zeram os tokens no browser + redirect `/login`

### 📁 Blueprint Módulo de Suporte (`docs/support/`):

5 documentos de planejamento criados (sem implementação — apenas preparação):
- `01_CRISP_INTEGRATION.md` — Chat in-app via Crisp SDK ($25/mês)
- `02_SUPPORT_AI_AGENT.md` — Agente Claude para resolver 40-50% dos tickets
- `03_SUPPORT_SECURITY_LGPD.md` — Compliance LGPD (consentimento, sanitização, audit log)
- `04_SUPPORT_PLAYBOOKS.md` — 7 playbooks operacionais para atendimento humano
- `05_IMPLEMENTATION_CHECKLIST.md` — Roadmap 4 fases / 4 semanas

### ✅ Testes em Produção (Playwright — 6/6 PASS):
- Proteção de rota `/dashboard` sem sessão → redireciona para `/login?redirect=` ✅
- Página de login carrega corretamente ✅
- Login com credenciais válidas → redireciona para `/dashboard` ✅
- Dashboard carrega com sidebar, KPIs, gráficos, perfil "Murilo Leister / Admin" ✅
- Logout → redireciona para `/login` ✅
- Proteção após logout → `/dashboard` bloqueado ✅

---

## 📁 ARQUIVOS MODIFICADOS/CRIADOS (sessão 25/02/2026)

```
docs/support/
├── 01_CRISP_INTEGRATION.md          ✅ Blueprint chat Crisp
├── 02_SUPPORT_AI_AGENT.md           ✅ Blueprint agente IA de suporte
├── 03_SUPPORT_SECURITY_LGPD.md      ✅ Compliance LGPD + audit log
├── 04_SUPPORT_PLAYBOOKS.md          ✅ 7 playbooks operacionais
└── 05_IMPLEMENTATION_CHECKLIST.md   ✅ Checklist 4 fases

frontend/
├── lib/supabase/
│   ├── client.ts                    🔄 Singleton de módulo (_client)
│   └── server.ts                    🔄 API getAll/setAll (compat. 0.5.x)
├── contexts/auth-context.tsx        🔄 fallback getUser + fila pendente +
│                                        signOut → /api/auth/signout
├── app/
│   ├── (auth)/login/page.tsx        🔄 Navegação pós-login centralizada
│   └── api/auth/signout/route.ts    ✅ API route server-side de logout
└── next.config.mjs                  🔄 no-store nas rotas de auth
```

---

## 📋 COMMITS REALIZADOS (sessão 25/02/2026)

| Hash | Commit |
|------|--------|
| `e202368` | docs: blueprint módulo de suporte — Crisp + IA + LGPD + Playbooks |
| `385a94a` | fix: corrigir instabilidade persistente no fluxo de autenticação |
| `dd86fab` | fix: corrigir logout — signOut server-side via API route |

---

## 📊 RESUMO EXECUTIVO — O QUE FOI FEITO (sessão 23/02/2026 — COMPLETO)

### 🔧 Hotfixes Pós-Deploy Aplicados:

**Estabilidade de sessão / autenticação:**
- `@supabase/ssr` atualizado `0.1.0` → `0.5.2` (bug INITIAL_SESSION não disparava ao expirar token)
- `@supabase/supabase-js` atualizado `2.39.8` → `2.97.0`
- `auth-context.tsx`: substituído timeout cego por fallback `getSession()` em 1s; flag de concorrência
- Error boundaries: `global-error.tsx`, `app/error.tsx`, `(dashboard)/error.tsx`
- `next.config.mjs`: Cache-Control `private, no-store` em todas as rotas `/dashboard/*`

**Bugs de navegação corrigidos:**
- 3 arquivos com prefixo `/contratos/...` trocado para `/dashboard/contratos/...` (custo-form, itens-table, custos-table)

**Visual / favicon:**
- Sidebar: logo DUO Governance exibido via `<Image>` (antes era texto "DG")
- Favicon: `app/icon.svg` criado (file convention Next.js App Router) — elimina ícone Vercel
- `layout.tsx`: metadata icons com `type: 'image/svg+xml'`

**Formulários corrigidos:**
- `getTodayISO()` → `getTodayLocal()` em `custo-form.tsx` e `entrega-form.tsx` (UTC→local, evita mostrar amanhã após 21h BRT)
- Default de campos numéricos: `0` → `''` (mostra placeholder ao invés de zero)

**Migrations aplicadas:**
- **Migration 012** — SECURITY DEFINER nas 6 trigger functions (`processar_novo_custo`, `atualizar_margem_item`, `processar_entrega`, `validar_saldo_af`, `validar_entrega`, `validar_nf_unica`) para bypassar RLS em operações internas
- **Migration 013** — `ALTER TABLE empresas ADD COLUMN logo_url TEXT`
- **Migration 014** — RLS policies INSERT/UPDATE/DELETE/SELECT no bucket `logos`

**Feature: Logotipo da empresa:**
- `buckets.ts`: bucket `LOGOS` adicionado (PNG/JPG/SVG/WebP, 2MB)
- `next.config.mjs`: `remotePatterns` para Supabase Storage
- `empresa-context.tsx` + `database.types.ts`: campo `logo_url` exposto no contexto
- `sidebar.tsx`: exibe `empresa.logo_url` no topo quando disponível (fallback: DUO logo)
- `empresas/page.tsx`: card de upload de logotipo com preview inline (admin only)

**Diagnóstico definitivo de logout + page refresh (3 causas raiz corrigidas):**

- **CAUSA 1 — `middleware.ts`** (raiz do logout):
  API `get/set/remove` do `@supabase/ssr@0.5.x` recriava `NextResponse` a cada `set()`, descartando cookies anteriores. Na renovação de token, o browser recebia apenas 1 dos 2 cookies → sessão expirada na próxima request → redirect para `/login`.
  Fix: migrado para `getAll()`/`setAll()` + `getUser()` + return `supabaseResponse`.

- **CAUSA 2 — `router.refresh()` em 7 formulários** (raiz do page refresh):
  Todos os formulários chamavam `router.refresh()` antes de `router.push()`. O `refresh()` força round-trip ao servidor na página atual → flash/reload visível → depois navega.
  Fix: removido de `af-form`, `contrato-form` (2x), `item-form`, `custo-form`, `entrega-form`, `contratos/[id]/page`.

- **CAUSA 3 — dashboard layout sem debounce** (logout esporádico):
  `useEffect` disparava `router.push('/login')` imediatamente ao detectar `user=null` durante `TOKEN_REFRESHED` (janela de ~ms). Fix: 400ms de grace period via `useRef`, cancelado se `user` restaurado.

**Blueprint DUO Intelligence (pesquisa/planejamento):**
- `docs/blueprint-duo-intelligence.md` criado com plano técnico completo:
  - Pilar 1: Botão "IA Plus" — extração de itens de PDF via Claude claude-sonnet-4-6 nativo
  - Pilar 2: "Maestro" — newsletter executiva com PNCP + IBGE + BC + Claude
  - Pilar 3: LGPD — isolamento multi-tenant + DPA notice
  - Estimativas de custo, roadmap de implementação e referências técnicas

---

## 📊 RESUMO EXECUTIVO — O QUE FOI FEITO (sessão 20/02/2026)

### ✅ Stories Completas (ESTA SESSÃO):

- **Story 12.1** — Correção de roteamento (contratos movidos para `/dashboard/contratos/`) + link Meu Perfil sidebar
- **Story 11.4** — Reajustes: service, form inline, StatusBadge estendido
- **Story 11.3** — Perfil do Usuário: edição de nome e senha
- **Story 11.2** — Gestão de Usuários: convite via API Route (`/api/usuarios/invite`)
- **Story 11.1** — Gestão de CNPJs: form inline, toggle ativo
- **Story 12.2** — Matriz de permissões (`docs/tests/matriz-permissoes.md`)
- **Story 12.3** — Build de produção: fix `useSearchParams()` + Suspense na `/login`, `.env.example` atualizado
- **Story 12.4** — Deploy Vercel: `vercel.json` criado, deploy executado com sucesso

### 🚀 Deploy em produção:
```
URL: https://gestao-contratos-frontend.vercel.app
Status: Online e navegável
Testado: login via janela anônima, navegação em todas as abas
```

---

## 📁 ARQUIVOS MODIFICADOS/CRIADOS (sessão 23/02/2026)

```
database/migrations/
├── MIGRATION 012.sql   ✅ SECURITY DEFINER nas 6 trigger functions
├── MIGRATION 013.sql   ✅ ADD COLUMN logo_url em empresas
└── MIGRATION 014.sql   ✅ RLS policies bucket logos

docs/
└── blueprint-duo-intelligence.md         ✅ Blueprint IA: Extrator PDF + Maestro Newsletter

frontend/
├── middleware.ts                          🔄 getAll/setAll + getUser() — FIX LOGOUT DEFINITIVO
├── package.json                           🔄 @supabase/ssr 0.5.2 + supabase-js 2.97.0
├── next.config.mjs                        🔄 Cache-Control + remotePatterns Supabase Storage
├── app/
│   ├── (dashboard)/layout.tsx            🔄 debounce 400ms no redirect — FIX LOGOUT ESPORÁDICO
│   ├── icon.svg                           ✅ Favicon (file convention App Router)
│   ├── layout.tsx                         🔄 metadata icons com type svg
│   ├── error.tsx                          ✅ Error boundary root
│   ├── global-error.tsx                   ✅ Error boundary global
│   └── (dashboard)/error.tsx             ✅ Error boundary dashboard
├── contexts/
│   ├── auth-context.tsx                   🔄 INITIAL_SESSION fallback + concorrência
│   └── empresa-context.tsx               🔄 + logo_url no Empresa interface
├── types/database.types.ts                🔄 + logo_url em empresas Row/Insert/Update
├── lib/constants/buckets.ts               🔄 + LOGOS bucket
├── components/
│   ├── layout/sidebar.tsx                 🔄 logo empresa (logo_url) + DUO fallback
│   ├── forms/af-form.tsx                  🔄 remove router.refresh() — FIX PAGE REFRESH
│   ├── forms/contrato-form.tsx            🔄 remove router.refresh() (2x)
│   ├── forms/item-form.tsx                🔄 remove router.refresh()
│   ├── forms/custo-form.tsx               🔄 remove router.refresh() + getTodayLocal()
│   ├── forms/entrega-form.tsx             🔄 remove router.refresh() + getTodayLocal()
│   └── tables/
│       ├── itens-table.tsx               🔄 fix /dashboard/contratos/ prefix
│       └── custos-table.tsx              🔄 fix /dashboard/contratos/ prefix
└── app/(dashboard)/dashboard/
    ├── contratos/[id]/page.tsx            🔄 remove router.refresh()
    └── empresas/page.tsx                  🔄 card upload logotipo
```

---

## 📁 ARQUIVOS MODIFICADOS/CRIADOS (ESTA SESSÃO)

```
frontend/
├── app/(dashboard)/dashboard/
│   ├── contratos/                     🔄 MOVIDO de (dashboard)/contratos/
│   │   ├── [id]/                      (correção de roteamento 12.1)
│   │   │   ├── page.tsx
│   │   │   ├── editar/page.tsx
│   │   │   └── itens/[itemId]/
│   │   │       ├── custos/page.tsx
│   │   │       ├── custos/novo/page.tsx
│   │   │       └── editar/page.tsx
│   ├── empresas/page.tsx              ✅ Story 11.1 — Gestão de CNPJs
│   ├── usuarios/page.tsx              ✅ Story 11.2 — Gestão de Usuários
│   ├── perfil/page.tsx                ✅ Story 11.3 — Perfil do Usuário
│   └── reajustes/page.tsx             ✅ Story 11.4 — Reajustes
├── api/usuarios/invite/route.ts       ✅ Story 11.2 — API Route convite
├── app/(auth)/login/page.tsx          🔄 Fix Suspense [Story 12.3]
├── vercel.json                        ✅ Story 12.4
├── .env.example                       🔄 + SUPABASE_SERVICE_ROLE_KEY
└── lib/services/
    ├── cnpjs.service.ts               ✅ Story 11.1
    └── reajustes.service.ts           ✅ Story 11.4

docs/
├── tests/
│   └── matriz-permissoes.md          ✅ Story 12.2
└── stories/
    ├── story-12.1.md                 ✅ Concluída
    ├── story-12.2.md                 ✅ Concluída
    ├── story-12.3.md                 ✅ Concluída
    └── story-12.4.md                 🚀 Deploy executado
```

---

## 📋 COMMITS REALIZADOS (sessão 23/02/2026)

| Hash | Commit |
|------|--------|
| `b634106` | docs: Migration 014 - RLS policies para bucket logos |
| `756ece9` | feat: upload e exibição de logotipo da empresa no sidebar [Migration 013] |
| `9617497` | fix: corrigir timezone bug e UX de inputs numéricos nos formulários de custo/entrega |
| `90548ab` | fix: estabilidade de sessão, favicon, logo sidebar e 404 custos via contratos |

## 📋 COMMITS REALIZADOS (sessão 20/02/2026)

| Hash | Commit |
|------|--------|
| `1e50baf` | fix: corrigir roteamento contratos + link Meu Perfil sidebar [Story 12.1] |
| `ff2eb6f` | feat: implementar Reajustes com service, form inline e atualização de status [Story 11.4] |
| `4293f39` | feat: implementar página Perfil do Usuário com edição de nome e senha [Story 11.3] |
| `1e34005` | feat: implementar Gestão de Usuários com convite via API Route [Story 11.2] |
| `13908e9` | feat: implementar Gestão de CNPJs com form inline e toggle ativo [Story 11.1] |
| `7b6dce2` | docs: criar matriz de permissões para testes de perfil [Story 12.2] |
| `e9dd3b1` | fix: corrigir build de produção + atualizar env vars [Story 12.3] |
| `51c2f08` | feat: adicionar vercel.json para configuração de deploy [Story 12.4] |

---

## 📊 STATUS ATUAL DAS STORIES

### ✅ Fase 1: Setup (COMPLETO — 100%)
- [x] Story 1.1: Inicialização Next.js
- [x] Story 1.2: Tailwind + shadcn/ui + Identidade Visual
- [x] Story 1.3: Setup Supabase Client

### ✅ Fase 2: Autenticação (COMPLETO — 100%)
- [x] Story 2.1: Auth Context
- [x] Story 2.2: Empresa Context
- [x] Story 2.3: Middleware de Autenticação
- [x] Story 2.4: Páginas de Autenticação

### ✅ Fase 3: Layout (COMPLETO — 100%)
- [x] Story 3.1: Dashboard Layout com Sidebar e Header
- [x] Story 3.2: Sistema de Permissões por Perfil
- [x] Story 3.3: Componentes Comuns Reutilizáveis

### ✅ Fase 4: Services (COMPLETO — 100%)
- [x] Story 4.1: Contrato Service
- [x] Story 4.2: Item Service
- [x] Story 4.3: Custo Service
- [x] Story 4.4: Upload Service
- [x] Story 4.5: AF Service
- [x] Story 4.6: Entrega Service

### ✅ Fase 5: Dashboard (COMPLETO — 100%)
- [x] Story 5.1: Métricas do Dashboard
- [x] Story 5.2: Gráficos do Dashboard
- [x] Story 5.3: Alertas do Dashboard

### ✅ Fase 6: Contratos (COMPLETO — 100%)
- [x] Story 6.1: Lista de Contratos
- [x] Story 6.2: Criar Contrato
- [x] Story 6.3: Detalhes do Contrato
- [x] Story 6.4: Editar Contrato
- [x] Story 6.5: Soft Delete Contrato

### ✅ Fase 7: Itens do Contrato (COMPLETO — 100%)
- [x] Story 7.1: Lista de Itens
- [x] Story 7.2: Criar/Editar Item
- [x] Story 7.3: Soft Delete Item (inline)

### ✅ Fase 8: Módulo de Custos (COMPLETO — 100%)
- [x] Story 8.1: Lista Global de Custos
- [x] Story 8.2: Histórico de Custos por Item
- [x] Story 8.3: Registrar Custo

### ✅ Fase 9: Módulo de AFs (COMPLETO — 100%)
- [x] Story 9.1: Lista de AFs + estender StatusBadge
- [x] Story 9.2: Emitir AF
- [x] Story 9.3: Detalhes da AF

### ✅ Fase 10: Módulo de Entregas (COMPLETO — 100%)
- [x] Story 10.1: Lista Global de Entregas
- [x] Story 10.2: Registrar Entrega

### ✅ Fase 11: Configurações (COMPLETO — 100%)
- [x] Story 11.1: Gestão de CNPJs
- [x] Story 11.2: Gestão de Usuários
- [x] Story 11.3: Perfil do Usuário
- [x] Story 11.4: Reajustes

### ✅ Fase 12: Deploy (COMPLETO — 100%)
- [x] Story 12.1: Quality Gates + Correção de Roteamento
- [x] Story 12.2: Testes de Perfil (Matriz de Permissões)
- [x] Story 12.3: Build de Produção + Env Vars
- [x] Story 12.4: Deploy Vercel

---

## 🎯 PRÓXIMA FASE — Suporte ao Cliente + Testes de Perfil

### Pendente (por prioridade):

1. **Implementar módulo de suporte** — blueprints prontos em `docs/support/`
   - Fase 1: Crisp Integration (1-2 dias)
   - Fase 2: LGPD + Agente IA (3-4 dias)
   - Fase 3: Polish + Monitoring
   - Ref: `docs/support/05_IMPLEMENTATION_CHECKLIST.md`

2. **Testes da matriz de permissões** — executar checklist `docs/tests/matriz-permissoes.md` com 5 perfis

3. **Validar registro de custos** — testar após Migration 012 (SECURITY DEFINER triggers)

4. **Validar logo da empresa** — testar upload em `/dashboard/empresas` e exibição no sidebar

### Workflow para retorno:
1. Testar logout: fechar aba → reabrir → deve pedir login (Bug 8 corrigido em 25/02)
2. Fazer cadastros reais em produção (contratos, itens, AF, custos, entregas)
3. Testar os 5 perfis conforme a matriz (`docs/tests/matriz-permissoes.md`)
4. Anotar bugs/ajustes encontrados
5. Decidir: polish do sistema atual ou começar módulo de suporte (Crisp)

---

## 🧪 STATUS DE TESTES

### ✅ Confirmado em produção:
- Login funcional via `https://gestao-contratos-frontend.vercel.app/login`
- Navegação em todas as abas (janela anônima)
- Build 0 erros, TypeScript limpo
- Favicon DUO Governance exibido (sem ícone Vercel)
- Logo DUO Governance no sidebar (sem texto "DG")
- Sessão estável sem necessidade de limpar cookies
- Formulário de custo: data local correta + campos numéricos com placeholder

### ⏳ Aguardando testes manuais (usuário):
- Registro de custo salva corretamente (após Migration 012)
- Upload de logotipo da empresa (`/dashboard/empresas`)
- Logo da empresa exibido no sidebar após upload
- CRUD completo com dados reais
- Triggers de saldo (AF e entrega)
- Testes de perfil (5 usuários × matriz de permissões)
- API Route `/api/usuarios/invite` em produção

---

## 📊 ESTATÍSTICAS DO PROJETO

### Progresso Geral:
```
Stories Completas:    43 / 43 (100% — TODAS AS STORIES IMPLEMENTADAS)
  Fase 1  (Setup):      3/3  ✅ 100%
  Fase 2  (Auth):       4/4  ✅ 100%
  Fase 3  (Layout):     3/3  ✅ 100%
  Fase 4  (Services):   6/6  ✅ 100%
  Fase 5  (Dashboard):  3/3  ✅ 100%
  Fase 6  (Contratos):  5/5  ✅ 100%
  Fase 7  (Itens):      3/3  ✅ 100%
  Fase 8  (Custos):     3/3  ✅ 100%
  Fase 9  (AFs):        3/3  ✅ 100%
  Fase 10 (Entregas):   2/2  ✅ 100%
  Fase 11 (Config):     4/4  ✅ 100%
  Fase 12 (Deploy):     4/4  ✅ 100%
```

---

## 🔑 INFORMAÇÕES TÉCNICAS CRÍTICAS

### URLs:
```
Produção:     https://gestao-contratos-frontend.vercel.app
Local (dev):  http://localhost:3000
```

### Supabase:
```
Projeto ID:   hstlbkudwnboebmarilp
Site URL:     https://gestao-contratos-frontend.vercel.app
Redirect URL: https://gestao-contratos-frontend.vercel.app/callback
              http://localhost:3000/callback
```

### Variáveis de ambiente Vercel (configuradas):
```
NEXT_PUBLIC_SUPABASE_URL        ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY   ✅
SUPABASE_SERVICE_ROLE_KEY       ✅ (Sensitive — Production only)
```

---

## ✅ CHECKLIST DE RETORNO

Ao retornar para continuar o projeto:

- [ ] Ler este arquivo (PROGRESS.md)
- [ ] Verificar último commit: `git log --oneline | head -5`
- [ ] Acessar produção: `https://gestao-contratos-frontend.vercel.app`
- [ ] Testar logout: fazer login → logout → fechar aba → reabrir → deve pedir login novamente
- [ ] Testar registro de custo (valida Migration 012)
- [ ] Testar upload de logo em `/dashboard/empresas` (valida Migrations 013+014 + bucket logos)
- [ ] Executar matriz de permissões (`docs/tests/matriz-permissoes.md`)
- [ ] Decidir próxima prioridade: suporte (Crisp) ou polish do sistema atual

---

## 📚 REFERÊNCIAS RÁPIDAS

```
docs/tests/matriz-permissoes.md     # Checklist de testes de perfil
frontend/vercel.json                # Configuração Vercel
frontend/.env.example               # Template de variáveis de ambiente
docs/stories/                       # Specs de todas as stories (1–12)
```

```bash
# Desenvolvimento local
cd C:\projetos\gestao-contratos\frontend && npm run dev

# Build de produção
npm run build

# Ver commits
git log --oneline | head -10
```

---

**Última atualização:** 2026-02-25
**Status:** 🚀 43/43 STORIES + AUTH ESTÁVEL — EM PRODUÇÃO
**URL produção:** https://gestao-contratos-frontend.vercel.app
**Próxima ação:** Implementar módulo de suporte (Crisp) → Testes de perfil → Polish
