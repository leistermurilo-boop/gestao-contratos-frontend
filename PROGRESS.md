# PROGRESS.md - Estado do Projeto

**Data:** 2026-03-09 (última atualização)
**Sessão:** Fix definitivo de auth — F5 + LockManager + spinner eterno

---

## 🎉 RESULTADO FINAL DA SESSÃO 09/03/2026 — AUTH 100% RESOLVIDO

### Stress test aprovado (5/5 F5 + login):

| Teste | Resultado |
|-------|-----------|
| Login após logout | ✅ ~4s, sem timeout |
| LockManager timed out | ✅ Não ocorreu |
| Erros de lock no console | ✅ Zero |
| F5 #1 a #5 no /dashboard | ✅ 5/5 — sem spinner |

---

## 📊 RESUMO EXECUTIVO — O QUE FOI FEITO (sessão 09/03/2026)

### 🔐 Fix definitivo de autenticação — 8 commits, problema F5 resolvido

**Causa raiz identificada e corrigida (era uma cadeia de 6 bugs interdependentes):**

#### Fix 1 — `middleware.ts`: cookies com `httpOnly: false`
O middleware escrevia cookies com `httpOnly: true` (padrão Supabase SSR). O `createBrowserClient` lê via `document.cookie` que não enxerga cookies httpOnly → `INITIAL_SESSION = null` em todo F5 após refresh de token.
**Commit:** `e98d454`

#### Fix 2 — `auth-context.tsx`: flag `auth_resync_attempted` antes do reload
Flag era setada antes do `window.location.reload()` e só removida em falha. Se o reload ainda falhava, a flag bloqueava qualquer resync futuro até fechar a aba.
**Commit:** `e98d454`

#### Fix 3 — `auth-context.tsx`: `signOut()` client-side em erros PGRST116/inativo
`supabase.auth.signOut()` client-side apagava todos os cookies via `document.cookie` em erros transientes de rede, causando ZERO cookies no próximo F5.
**Commit:** `e98d454`

#### Fix 4 — `dashboard/layout.tsx`: `router.push('/login')` em vez de `/api/auth/signout`
O layout chamava `/api/auth/signout` quando `!loading && !user`, que invoca `signOut({ scope: 'global' })` e revoga o refresh token globalmente. ESTA ERA A CAUSA DOS ZERO COOKIES.
**Commit:** `7e31afa`

#### Fix 5 — `middleware.ts`: `/api/auth/` na lista de rotas públicas + `redirect: 'manual'`
O middleware redirecionava `fetch('/api/auth/resync')` para `/login?redirect=/api/auth/resync`. O fetch seguia o redirect e ficava PENDING para sempre → spinner eterno.
**Commit:** `7d93890`

#### Fix 6 — `auth-context.tsx`: abandonar `INITIAL_SESSION` como único caminho
Em `@supabase/supabase-js@2.97.0`, `INITIAL_SESSION` pode disparar antes do listener ser registrado. Reescrito para usar `getSession()` + `INITIAL_SESSION` como dual-path, com `initResolve()` que processa o primeiro caminho com resultado válido.
**Commits:** `2f1a02d`, `8b9c677`, `7b66fe9`, `392c908`

#### Fix 7 — `auth-context.tsx`: race condition em `initResolve` + safety timeouts em dois estágios
`resolved = true` era setado antes do `await processSession()`. Se processSession falhava silenciosamente, o safety timeout via `resolved = true` e não fazia nada → spinner eterno.
Adicionado `loadingSettled` flag, try/catch em `initResolve`, safety em 2 estágios (4s + 8s).
**Commit:** `756a15d`

#### Fix 8 — `lib/supabase/client.ts`: bypass do `navigator.locks`
Os múltiplos caminhos concorrentes de auth (getSession + INITIAL_SESSION + safety) tentavam adquirir o mesmo exclusive lock do Supabase. O `signInWithPassword` esperava 10s e falhava com "LockManager timed out waiting 10000ms".
Fix canônico para apps SSR: `lock: <R>(_n, _t, fn) => fn()`.
**Commits:** `4f6aa73`, `6acf465`

---

## ⚠️ PENDÊNCIAS PARA PRÓXIMA SESSÃO

1. **`ANTHROPIC_API_KEY` no Vercel** — OCR não funciona em produção sem isso
2. **Testar soft delete** de contratos e itens
3. **Testar fluxo OCR completo** em produção
4. **Executar matriz de permissões** (`docs/tests/matriz-permissoes.md`) com 5 perfis

---

## 📊 RESUMO EXECUTIVO — O QUE FOI FEITO (sessão 08/03/2026)

### 🔐 Investigação F5 / AuthSessionMissingError — RESOLVIDO ✅

**Sintoma persistente:** F5 em `/dashboard` mostra spinner infinito ou tela branca.
**Erro no console:** `AuthSessionMissingError: Auth session missing!` no INITIAL_SESSION.

**Causa raiz identificada (via GitHub supabase/ssr#107):**
Race condition em `createServerClient` onde `initialize()` em background interferia no
carregamento da sessão. Corrigido oficialmente na versão `@supabase/ssr@0.9.0`.

**Fixes aplicados nesta sessão:**

1. **`@supabase/ssr` 0.5.2 → 0.9.0** — upgrade para versão com o fix oficial da race condition
2. **`/api/auth/resync/route.ts`** (novo) — endpoint server-side que:
   - Valida sessão com `getUser()` server-side
   - Copia cookies `sb-*` como `httpOnly: false` para browser client conseguir ler
   - Handles dois casos: token rotacionado (setAll) e token ainda válido (cópia direta)
3. **`auth-context.tsx`** — quando INITIAL_SESSION null + AuthSessionMissingError:
   - Chama `/api/auth/resync` com AbortController 3s timeout (previne spinner infinito)
   - Se ok:true → `window.location.reload()` para browser inicializar com cookies frescos
   - `sessionStorage` previne loop infinito de resyncs
4. **`dashboard.service.ts`** — corrigido `data_vigencia_fim` → `data_vencimento` (coluna errada)

**Descoberta crítica:** O projeto estava rodando no Supabase ERRADO (`cugopnezttlsnwesdity`).
Projeto correto: `hstlbkudwnboebmarilp`. Migrations 016 e 017 faltavam e foram aplicadas.

**Status do F5:** AINDA NÃO RESOLVIDO. O resync funciona parcialmente (página carrega após
reload) mas em alguns F5 o problema persiste. Última hipótese: o resync não estava copiando
cookies quando não havia rotação de token — corrigido no último commit (243d5a5), não testado.

**Commits desta sessão:**
- `2b23d87` fix(auth): resync browser tokens on AuthSessionMissingError
- `1ac8a62` fix(auth): add 3s AbortController timeout to resync fetch
- `c015e3a` fix(auth): upgrade @supabase/ssr 0.5.2→0.9.0
- `b105627` fix(dashboard): use data_vencimento instead of data_vigencia_fim
- `243d5a5` fix(auth): resync always copies sb-* cookies as non-httpOnly ← **NÃO TESTADO**

### 🗄️ Banco de Dados — Sincronizado

Migrations aplicadas no projeto correto (`hstlbkudwnboebmarilp`):
- ✅ Migration 015 — já estava
- ✅ Migration 016 — aplicada hoje (triggers pontuação maturidade DUO™)
- ✅ Migration 017 — aplicada hoje (tabela ocr_learning)
- ✅ Migration 018 — já estava (policies granulares RLS)
- ✅ Migration 019 — já estava (deleted_at em contratos e itens)

---

## ⚠️ PENDÊNCIAS CRÍTICAS PARA PRÓXIMA SESSÃO

1. **F5 ainda com problema** — testar commit `243d5a5` (resync copia cookies sem rotação).
   Se ainda falhar, investigar se `createBrowserClient` do @supabase/ssr@0.9.0 usa
   localStorage em vez de cookies, ou se há mudança de nome dos cookies.
   Alternativa nuclear: remover a lógica de resync e usar arquitetura sem client-side auth state.

2. **`ANTHROPIC_API_KEY` no Vercel** — sem isso OCR não funciona em produção.

3. **Testar soft delete** de contratos e itens após migrations.

4. **Testar fluxo OCR completo** em produção.

5. **Executar matriz de permissões** (`docs/tests/matriz-permissoes.md`) com 5 perfis.

---

---

## 📊 RESUMO EXECUTIVO — O QUE FOI FEITO (sessão 06/03/2026)

### 🤖 Sprint 3A — Backend OCR (Anthropic API)

- **`lib/agents/core/claude-client.ts`** — Integração real com `@anthropic-ai/sdk` (era stub vazio)
- **`lib/agents/ocr/system-prompt.ts`** — Prompt para extração do cabeçalho do contrato (campos + confidence scores)
- **`lib/agents/ocr/system-prompt-itens.ts`** — Prompt para extração de itens (coluna MARCA/MODELO, não Descrição)
- **`lib/agents/ocr/system-prompt-combined.ts`** — Prompt combinado: contrato + itens em uma só chamada Claude
- **`app/api/ocr/extract-contract/route.ts`** — Endpoint extração contrato. PDF enviado como `type: 'document'` (base64); imagens como `type: 'image'`
- **`app/api/ocr/extract-items/route.ts`** — Endpoint extração itens. Retorna `ExtractItemsResult`
- **`app/api/ocr/extract-all/route.ts`** — Endpoint combinado (1 chamada Claude = cabeçalho + itens). Soluciona o problema de upload duplo.
- **`ANTHROPIC_API_KEY`** adicionado ao `.env`. ⚠️ Precisa adicionar também no Vercel (variável de ambiente)

### 🎨 Sprint 3B — UI Upload & Preview OCR

- **`components/contratos/ocr-upload-modal.tsx`** — Modal drag & drop com progress bar. Prop `fetchFn` permite usar endpoint customizado
- **`components/contratos/ocr-preview-form.tsx`** — Preview dos campos extraídos com indicadores de confidence (verde/âmbar/vermelho). Mapeamento OCR → colunas reais do DB
- **`components/forms/contrato-form.tsx`** — Interface `ContratoPrefill` + prop `prefill` para pré-preenchimento via OCR. Prop `onSaveSuccess(contratoId, cnpjId)` para fluxo pós-save

### 📦 Sprint 3C — Extração de Itens em Lote

- **`components/contratos/ocr-itens-modal.tsx`** — Modal completo: upload → loading → tabela editável → save em lote. Prop `prefetchedData` pula etapa de upload (dados já extraídos junto com o contrato)
- **`app/(dashboard)/dashboard/contratos/novo/page.tsx`** — Reescrito: fluxo 4 etapas (choice → ocr-preview → form → items). Usa `/api/ocr/extract-all` (1 único upload). Itens ficam em memória até contrato ser salvo, depois abre `OCRItensModal` com `prefetchedData`
- **`app/(dashboard)/dashboard/contratos/[id]/itens/page.tsx`** — Botão "Extrair itens com IA" (admin only) com `OCRItensModal`

### 🔍 Diagnóstico RLS — Causa Raiz Identificada

**Problema relatado:** Não conseguia excluir/arquivar contratos ou itens — erro "violates row-level security policy"

**Causa raiz confirmada via `information_schema` + `pg_policies`:**

1. **`contratos` não tem coluna `deleted_at`** — a tabela real tem apenas 10 colunas: `id, empresa_id, numero_contrato_arp, orgao_publico, objeto, data_assinatura, data_vencimento, valor_total_contrato, status, created_at`. O `softDelete()` tenta `UPDATE SET deleted_at = NOW()` em coluna inexistente.

2. **`itens_contrato` tem RLS desabilitado** (`relrowsecurity = false`) — as políticas existem mas não são aplicadas.

3. **`contratos_select` policy não filtra `deleted_at IS NULL`** — sem a coluna, a policy foi criada sem esse filtro.

**Migration 019 preparada (SQL pronto, não confirmado aplicado):**
```sql
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL;
ALTER TABLE itens_contrato ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE itens_contrato ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contratos_select ON contratos;
CREATE POLICY contratos_select ON contratos FOR SELECT
  USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()) AND deleted_at IS NULL);
DROP POLICY IF EXISTS itens_select ON itens_contrato;
CREATE POLICY itens_select ON itens_contrato FOR SELECT
  USING (deleted_at IS NULL AND contrato_id IN (SELECT id FROM contratos WHERE empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())));
```

**Status:** SQL ainda não confirmado funcionando — testar na próxima sessão.

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS (sessão 06/03/2026)

```
database/migrations/
├── MIGRATION 017.sql   ✅ Tabela ocr_learning + RLS
└── MIGRATION 019.sql   ⏳ deleted_at + enable RLS itens_contrato (preparado, não aplicado)

frontend/
├── lib/agents/
│   ├── core/claude-client.ts              🔄 Integração real Anthropic SDK
│   └── ocr/
│       ├── system-prompt.ts               ✅ Prompt extração cabeçalho contrato
│       ├── system-prompt-itens.ts         ✅ Prompt extração itens (MARCA/MODELO)
│       └── system-prompt-combined.ts      ✅ Prompt combinado (1 chamada)
├── app/api/ocr/
│   ├── extract-contract/route.ts          ✅ Endpoint extração contrato
│   ├── extract-items/route.ts             ✅ Endpoint extração itens
│   └── extract-all/route.ts              ✅ Endpoint combinado
├── components/contratos/
│   ├── ocr-upload-modal.tsx               ✅ Modal upload drag & drop
│   ├── ocr-preview-form.tsx               ✅ Preview com confidence indicators
│   └── ocr-itens-modal.tsx                ✅ Modal itens: upload→preview→save
├── components/forms/
│   └── contrato-form.tsx                  🔄 + ContratoPrefill + onSaveSuccess
└── app/(dashboard)/dashboard/contratos/
    ├── novo/page.tsx                      🔄 Fluxo 4-etapas com OCR
    └── [id]/itens/page.tsx                🔄 + botão "Extrair itens com IA"
```

---

## ⚠️ PENDÊNCIAS CRÍTICAS PARA PRÓXIMA SESSÃO

1. **Aplicar Migration 019** — rodar o SQL acima no Supabase SQL Editor. Sem isso, soft delete continua falhando.
2. **Testar excluir/arquivar contrato** após migration
3. **Testar excluir item** após migration
4. **Adicionar `ANTHROPIC_API_KEY` no Vercel** — sem isso OCR não funciona em produção
5. **Testar fluxo OCR completo** em produção: upload PDF → preview → form → save → itens

---

**Sessão:** Fase 16 — Fix race condition refresh token + Logo SVG isométrico DUO

---

## 📊 RESUMO EXECUTIVO — O QUE FOI FEITO (sessão 06/03/2026)

### 🔐 Fix crítico: race condition de refresh token em requests concorrentes

**Sintoma:** Dados sumiam ao trocar de seção; F5 causava loading infinito ou página branca.
**Causa raiz:** Next.js faz prefetch de links visíveis no viewport simultaneamente. Cada
prefetch passava pelo middleware e chamava `getUser()`. Com token expirado, múltiplos requests
tentavam rotacionar o refresh token ao mesmo tempo — Supabase usa single-use tokens, então
apenas o primeiro sucedia e os demais invalidavam a sessão.

**4 fixes aplicados (`commit b7134c2`):**

1. **`middleware.ts`** — Early return para requests com `next-router-prefetch: 1`. Prefetch não
   chama `getUser()`, não rota tokens. Request real de navegação faz a validação completa.

2. **`sidebar.tsx`** — `prefetch={false}` em todos os `<Link>` de navegação do `NavItem`.
   Elimina os requests de prefetch pela raiz — belt-and-suspenders com o fix do middleware.

3. **`auth-context.tsx`** — Quando `INITIAL_SESSION` dispara com `session = null` (sinal de
   rotação concorrente), tenta `getUser()` + `getSession()` no servidor antes de deslogar.
   Recupera sessão válida que outro request já rotacionou com sucesso.

4. **`empresa-context.tsx`** — `useMemo` no context value + `useCallback` em `refreshEmpresa`
   para evitar re-renders em cascata nos consumers após cada `processSession`.

---

### 🎨 Logo SVG isométrico oficial DUO

**Commits:** `b7b8da0`, `e270322`

- **`components/ui/logo.tsx`** (novo) — Componente SVG com duas torres isométricas:
  esquerda navy `#0F172A` + direita emerald `#10B981`. Props:
  - `dark` — texto branco, stroke sutil na torre navy
  - `svgBg` — círculo branco `rounded-full bg-white` apenas em volta do SVG (para sidebar)

- **`app/(auth)/layout.tsx`** — Substituiu dois-bares inline por `<Logo className="h-14 w-auto" />`

- **`components/layout/sidebar.tsx`** — `<Logo dark svgBg className="h-8 w-auto" />`.
  O círculo branco torna a torre navy visível sobre o fundo navy da sidebar.

---

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
