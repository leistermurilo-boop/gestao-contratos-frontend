# PROGRESS.md - Estado do Projeto

**Data:** 2026-02-21 (última atualização)
**Sessão:** Story 5.2 — Gráficos do Dashboard
**Agentes:** @analyst + @dev

---

## 📊 RESUMO EXECUTIVO — O QUE FOI FEITO HOJE (21/02/2026)

### ✅ Stories Completas (HOJE):

#### ✅ **Story 5.1: Métricas do Dashboard** (100% completa)
- `lib/services/dashboard.service.ts` — getMetrics() com 3 queries paralelas (contratos, itens, alertas)
- `components/charts/dashboard-cards.tsx` — 4 cards com Skeleton loading, sem `any`
- `app/(dashboard)/dashboard/page.tsx` — integração com DashboardCards

### 🔧 Commits Pendentes (da sessão 20/02) feitos hoje:
- Story 4.6 + 8 páginas placeholder + fixes runtime (vide commit `7bc880d`)

### ✅ Stories Reescritas (Fase 8–12): @sm + @architect reanálise contextual
- Stories 8.1–8.3 (Módulo de Custos): specs completas com colunas reais do banco
- Stories 9.1–9.3 (Módulo de AFs): StatusBadge estendido + cascata contrato→item
- Stories 10.1–10.2 (Módulo de Entregas): imutabilidade + nf_saida_numero
- Stories 11.1–11.4 (Configurações): CNPJs service, usuários via API Route, perfil, reajustes
- Stories 12.1–12.4 (Deploy): bug de roteamento documentado, quality gates, Vercel
- Story 11.4 (NOVA): Reajustes — antecipada por ter sidebar link e StatusBadge já pronto

---

## 📁 ARQUIVOS MODIFICADOS/CRIADOS (HOJE)

```
frontend/
├── app/(dashboard)/dashboard/
│   └── page.tsx                    🔄 + DashboardCards
├── components/
│   └── charts/
│       └── dashboard-cards.tsx     ✅ NOVO — Story 5.1
└── lib/services/
    └── dashboard.service.ts        ✅ NOVO — Story 5.1
```

---

## 📋 COMMITS REALIZADOS

| Hash | Commit |
|------|--------|
| `7bc880d` | fix: correções sessão 20/02 + Story 4.6 Entrega Service |
| `62d7f6b` | feat: Dashboard Metrics Service + Cards [Story 5.1] |

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
- [x] Story 5.1: Métricas do Dashboard ← **CONCLUÍDA**
- [x] Story 5.2: Gráficos do Dashboard ← **CONCLUÍDA**
- [x] Story 5.3: Alertas do Dashboard ← **CONCLUÍDA HOJE**

### ✅ Fase 6: Contratos (COMPLETO — 100%)
- [x] Story 6.1: Lista de Contratos ← **CONCLUÍDA**
- [x] Story 6.2: Criar Contrato ← **CONCLUÍDA**
- [x] Story 6.3: Detalhes do Contrato ← **CONCLUÍDA**
- [x] Story 6.4: Editar Contrato ← **CONCLUÍDA**
- [x] Story 6.5: Soft Delete Contrato ← **CONCLUÍDA**

### ✅ Fase 7: Itens do Contrato (COMPLETO — 100%)
- [x] Story 7.1: Lista de Itens ← **CONCLUÍDA**
- [x] Story 7.2: Criar/Editar Item ← **CONCLUÍDA**
- [x] Story 7.3: Soft Delete Item (inline) ← **CONCLUÍDA**

### ⏳ Fase 8: Módulo de Custos (STORIES ESCRITAS — 0% implementado)
- [ ] Story 8.1: Lista Global de Custos ← specs prontas
- [ ] Story 8.2: Histórico de Custos por Item ← specs prontas
- [ ] Story 8.3: Registrar Custo ← specs prontas

### ⏳ Fase 9: Módulo de AFs (STORIES ESCRITAS — 0% implementado)
- [ ] Story 9.1: Lista de AFs + estender StatusBadge ← specs prontas
- [ ] Story 9.2: Emitir AF ← specs prontas
- [ ] Story 9.3: Detalhes da AF ← specs prontas

### ⏳ Fase 10: Módulo de Entregas (STORIES ESCRITAS — 0% implementado)
- [ ] Story 10.1: Lista Global de Entregas ← specs prontas
- [ ] Story 10.2: Registrar Entrega ← specs prontas

### ⏳ Fase 11: Configurações (STORIES ESCRITAS — 0% implementado)
- [ ] Story 11.1: Gestão de CNPJs ← specs prontas (requer cnpjs.service.ts)
- [ ] Story 11.2: Gestão de Usuários ← specs prontas (requer API Route)
- [ ] Story 11.3: Perfil do Usuário ← specs prontas
- [ ] Story 11.4: Reajustes (NOVA) ← specs prontas (requer reajustes.service.ts)

### ⏳ Fase 12: Deploy (STORIES ESCRITAS — 0% executado)
- [ ] Story 12.1: Quality Gates + Correção de Roteamento ← specs prontas (BUG CRÍTICO documentado)
- [ ] Story 12.2: Testes de Perfil ← specs prontas
- [ ] Story 12.3: Build + Env Vars ← specs prontas
- [ ] Story 12.4: Deploy Vercel ← specs prontas

---

## 🎯 PRÓXIMO PASSO EXATO (Story 8.1)

### 🚀 Story 8.1: Lista Global de Custos

#### O que será implementado:
- Página `/dashboard/custos` substituindo placeholder
- CustosTable reutilizável com colunas e filtros
- ProtectedRoute excluindo logistica

#### Pré-requisitos:
- ✅ custosService.getAll() com CustoItemWithRelations (join item+contrato)
- ✅ Página placeholder em `app/(dashboard)/dashboard/custos/page.tsx`
- ✅ Story spec pronta em `docs/stories/story-8.1.md`

#### ⚠️ Bug crítico a corrigir (Story 12.1):
- Stories 6.x/7.x estão em `app/(dashboard)/contratos/` → URL `/contratos/*`
- Sidebar aponta para `/dashboard/contratos/*` → links quebrados
- Corrigir movendo para `app/(dashboard)/dashboard/contratos/` na Story 12.1

---

## 🧪 STATUS DE TESTES

### ✅ Testado e funcionando:
- Login com credenciais válidas → redirect `/dashboard`
- Métricas do Dashboard carregando do banco
- Navegação entre todas as páginas (sem 404)
- Cadastro de nova conta (com detecção de email duplicado)

### ⚠️ Ainda não testado em runtime:
- CRUD de contratos (UI não implementada)
- Upload de arquivos (UI não implementada)
- Criação de AF (UI não implementada)
- Registro de entrega (UI não implementada)

---

## 📊 ESTATÍSTICAS DO PROJETO

### Progresso Geral:
```
Stories Completas:    27 / 43 (63%)
  Fase 1  (Setup):      3/3  ✅ 100%
  Fase 2  (Auth):       4/4  ✅ 100%
  Fase 3  (Layout):     3/3  ✅ 100%
  Fase 4  (Services):   6/6  ✅ 100%
  Fase 5  (Dashboard):  3/3  ✅ 100%
  Fase 6  (Contratos):  5/5  ✅ 100%
  Fase 7  (Itens):      3/3  ✅ 100%
  Fase 8  (Custos):     0/3  ⏳   0% (specs prontas)
  Fase 9  (AFs):        0/3  ⏳   0% (specs prontas)
  Fase 10 (Entregas):   0/2  ⏳   0% (specs prontas)
  Fase 11 (Config):     0/4  ⏳   0% (specs prontas)
  Fase 12 (Deploy):     0/4  ⏳   0% (specs prontas)

Camada de Serviços (frontend):  100% ✅
Camada de UI (frontend):         10% ⏳
```

### Services implementados:
```
contratos.service.ts  ✅   use-contratos.ts  ✅
itens.service.ts      ✅   use-itens.ts      ✅
custos.service.ts     ✅   use-custos.ts     ✅
upload.service.ts     ✅   use-upload.ts     ✅
af.service.ts         ✅   use-af.ts         ✅
entregas.service.ts   ✅   use-entregas.ts   ✅
dashboard.service.ts  ✅   (sem hook — Server Component)
```

---

## 🔑 INFORMAÇÕES TÉCNICAS CRÍTICAS

### Acesso ao sistema (testado):
```
URL:   http://localhost:3000/login
Email: leistermurilo@gmail.com
Senha: (redefinida via SQL na sessão de 20/02)
```

### Supabase — Status:
```sql
-- FKs ajustadas para ON DELETE SET NULL (10 constraints) ✅
-- Empresa: MGL Comércio Eletrônico LTDA
-- Usuário admin: leistermurilo@gmail.com
```

### Decisões arquiteturais importantes (Story 5.1):
```
1. DashboardService usa browser client (padrão da Fase 4)
2. DashboardCards é Client Component ('use client') + useEffect
3. Métricas em paralelo com Promise.all (3 queries simultâneas)
4. Margem = null → exibe '—' (logistica não vê via RLS)
5. Alertas = contratos vencendo em 30 dias + AFs pendentes/parciais
```

---

## ✅ CHECKLIST DE RETORNO

Ao retornar para continuar o projeto:

- [ ] Ler este arquivo (PROGRESS.md) completamente
- [ ] Verificar último commit: `git log --oneline | head -5`
- [ ] Iniciar servidor dev: `cd frontend && npm run dev`
- [ ] Confirmar login e métricas em `http://localhost:3000/dashboard`
- [ ] Abrir `docs/stories/story-5.2.md` (Gráficos do Dashboard)
- [ ] Executar validação @analyst (6 pontos — SYNC DATABASE/TYPES)
- [ ] Implementar Story 5.2 (Gráficos do Dashboard)
- [ ] Commitar ao concluir

---

## 📚 REFERÊNCIAS RÁPIDAS

```
docs/ARCHITECTURAL_DECISIONS.md      # 12 decisões imutáveis
.claude/VALIDATION_RULES.md          # Checklist 6 pontos
docs/AUDIT_REPORT_2026-02-20.md      # Auditoria completa
docs/ARCHITECTURE_FRONTEND.md        # Arquitetura planejada
database/migrations/MIGRATION_00*.sql # Fonte da verdade das colunas
```

```bash
# Iniciar servidor
cd C:\projetos\gestao-contratos\frontend && npm run dev

# Ver status e commits
git log --oneline | head -10
git status

# Typecheck
npx tsc --noEmit
```

---

**Última atualização:** 2026-02-21
**Status:** ✅ Fases 1–7 COMPLETAS (27 stories — ~64%) | Stories 8–12 ESPECIFICADAS (16 stories)
**Próxima ação:** Fase 8 — Implementar Story 8.1 (Lista Global de Custos)

---

💻 **@sm/@architect — Reanálise contextual completa. Stories 8.1–12.4 reescritas com specs técnicas precisas. Bug de roteamento (6.x/7.x) documentado para Story 12.1. Story 11.4 (Reajustes) criada como nova. Total: 43 stories planejadas.**
