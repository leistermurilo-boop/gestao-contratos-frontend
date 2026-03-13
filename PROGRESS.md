# PROGRESS.md - Estado do Projeto

**Data:** 2026-03-13 (última atualização)
**Sessão:** Sprint 4D + 4E + 4F — Send Newsletter + Bug Fixes + Segment Specialist

---

## 📊 RESUMO EXECUTIVO — O QUE FOI FEITO (sessão 13/03/2026)

### 🤖 Newsletter Agents System — Pipeline Completo (Sprints 4A→4F)

Pipeline multi-agente de análise inteligente B2G totalmente implementado e validado em produção.

```
[Agent 1: Data Collector]       → empresa_intelligence
[Agent 2: Segment Specialist]   → empresa_segment_knowledge (cache 30d)
[Agent 3: Insight Analyzer]     → newsletter_insights (4 APIs externas + segmento)
[Agent 4: Content Writer]       → newsletter_drafts (HTML com identidade DUO™)
[Agent 5: Send Newsletter]      → email via Resend
```

**Crons Vercel (Hobby Plan — multi-empresa):**
```
domingo 22h BRT  → POST /api/cron/collect-and-analyze  (cron: "0 1 * * 1")
segunda 07h BRT  → POST /api/cron/write-and-send        (cron: "0 10 * * 1")
```

---

### Sprint 4D — Send Newsletter Agent ✅ VALIDADO

**Arquivos:**
- `frontend/lib/agents/newsletter/send-newsletter/send-newsletter-agent.ts`
- `frontend/app/api/agents/send-newsletter/route.ts`
- `frontend/lib/supabase/service-role.ts` — createServiceRoleClient() para crons
- `frontend/app/api/cron/collect-and-analyze/route.ts`
- `frontend/app/api/cron/write-and-send/route.ts`
- `frontend/vercel.json` — bloco `crons`

**Funcionalidades:**
- Lê `newsletter_drafts` (status='draft'), envia via Resend, marca `status='sent'`
- Corpo opcional: `{ draft_id?, destinatario? }` — fallback para email do usuário autenticado
- Headers RFC 2369: `List-Unsubscribe`, `List-Unsubscribe-Post`, `Reply-To`
- Crons com `CRON_SECRET` (configurado na Vercel)

---

### Sprint 4E — Bug Fixes Newsletter (10 bugs) ✅ VALIDADO

**10/10 bugs corrigidos e validados em produção**

| # | Bug | Fix |
|---|-----|-----|
| 1+2 | fetchIPCA() soma errada + período hardcoded | Usar último valor (variável 2265 já é acumulado) + período dinâmico BRT |
| 3 | fetchPNCP() 3 params errados | Formato yyyyMMdd + tamanhoPagina=10 + codigoModalidadeContratacao=6 |
| 4 | fetchIBGE() ano hardcoded 2021 | Range 2020-anoAtual + reverse().find() para último ano com valor |
| 5 | confianca_score não passado ao Claude | Calculado antes de generateInsights(), incluído no system prompt |
| 6 | progresso_maturidade hardcoded 70% | calcularProgresso() baseado em fontes de dados reais |
| 7 | Headers List-Unsubscribe ausentes | replyTo + List-Unsubscribe + List-Unsubscribe-Post adicionados |
| 8 | getDraft filtra status com draft_id | Dois branches independentes: com/sem draft_id |
| 9 | empresa_nome coluna inexistente | select('razao_social, nome_fantasia') com fallback |
| 10 | fetchIBGE() anoAtual-2 retorna undefined | Busca dinâmica com range + find último válido |

**Timezone Brasília:** `nowBrasilia() = new Date(Date.now() - 3 * 60 * 60 * 1000)` — Vercel roda UTC, Brasil = UTC-3 sem DST desde 2019.

---

### Sprint 4F — Segment Specialist Agent ✅ DEPLOYADO

**Arquivos:**
- `database/migrations/MIGRATION 025.sql` — tabela `empresa_segment_knowledge` ✅ aplicada
- `frontend/lib/agents/newsletter/segment-specialist/segment-specialist-agent.ts`
- `frontend/app/api/agents/segment-specialist/route.ts`
- `frontend/lib/agents/core/types.ts` — tipos SegmentSpecialistInput/Output adicionados

**Arquitetura:**
- Lê `empresa_intelligence` (não re-coleta contratos — sem duplicação)
- 2 chamadas Claude: segmento+best_practices / diagnóstico comportamental
- Cache 30 dias via upsert `onConflict: 'empresa_id'`
- System prompt: consultor sênior B2G — cobre fluxo de caixa, BDI, reajuste IPCA (art.131 Lei 14.133), pregão dumping, habilitação SICAF
- Integrado ao Insight Analyzer: `getSegmentKnowledge()` enriquece o prompt com `best_practices` e `benchmarks_mercado`

**Pipeline cron atualizado:**
`Data Collector → Segment Specialist (try/catch isolado) → Insight Analyzer`

**Bug 11 corrigido (Loop #8):**
- `parseJSON()` regex greedy `\{[\s\S]*\}` substituído por brace counting
- Causa: Claude adiciona texto pós-JSON, regex capturava até o último `}`, corrompendo o parse

---

### Sprint 4A — Data Collector Agent ✅ VALIDADO

**Arquivos:**
- `database/migrations/MIGRATION 022.sql` — tabela `empresa_intelligence`
- `frontend/lib/agents/newsletter/data-collector/data-collector-agent.ts`
- `frontend/app/api/agents/data-collector/route.ts`

**Resultado em produção (Loop #2):** 4 contratos, 7 itens, 7 insights, `confianca_score: 0.50`

---

### Sprint 4B — Insight Analyzer Agent ✅ VALIDADO

**Arquivos:**
- `database/migrations/MIGRATION 023.sql` — tabela `newsletter_insights`
- `frontend/lib/agents/newsletter/insight-analyzer/insight-analyzer-agent.ts`
- `frontend/app/api/agents/insight-analyzer/route.ts`

**Resultado em produção (Loop #3):** 9 insights, 4 críticos, `confianca_score: 0.85`, todas 4 APIs responderam

---

### Sprint 4C — Content Writer Agent ✅ VALIDADO

**Arquivos:**
- `database/migrations/MIGRATION 024.sql` — tabela `newsletter_drafts`
- `frontend/lib/agents/newsletter/content-writer/content-writer-agent.ts` (v1.2.0)
- `frontend/app/api/agents/content-writer/route.ts`
- `frontend/lib/agents/newsletter/content-writer/email-themes.ts`
- `frontend/lib/agents/newsletter/content-writer/email-template.ts`
- `frontend/lib/agents/newsletter/content-writer/NEWSLETTER_IDENTITY.md`

**Design System Newsletter DUO™:**
```
4 temas visuais: ALERTA (vermelho) | OPORTUNIDADE (emerald) | MACRO (azul) | PADRÃO
9 seções fixas: Header → Número Destaque → Contratos → Insights → Radar B2G™
                → Macro → Você Sabia? → ROI → Footer navy
```

---

### Loop de Engenharia AIOS ✅ OPERACIONAL

**Histórico de loops:**

| Loop | Sessão | Status |
|------|--------|--------|
| #1 | Resend email endpoint (middleware) | ✅ DONE |
| #2 | Sprint 4A Data Collector | ✅ DONE |
| #3 | Sprint 4B Insight Analyzer | ✅ DONE |
| #4 | Sprint 4C fix maxTokens | ✅ DONE |
| #4b | Sprint 4C Design System DUO™ | ✅ DONE |
| #5 | Sprint 4D Send Newsletter | ✅ DONE |
| #6 | Sprint 4E 10 bugs newsletter | ✅ DONE |
| #7 | BUG 10 fetchIBGE() PIB dinâmico | ✅ DONE |
| #8 | BUG 11 parseJSON greedy regex | ✅ DONE |

---

## 📋 ESTADO ATUAL DAS MIGRATIONS

| Migration | Tabela | Status |
|-----------|--------|--------|
| 001-019 | Schema base + soft delete | ✅ Aplicadas |
| 020 | count:exact fix | ✅ Aplicada |
| 021 | RPC soft delete SECURITY DEFINER | ✅ Aplicada |
| 022 | empresa_intelligence | ✅ Aplicada |
| 023 | newsletter_insights | ✅ Aplicada |
| 024 | newsletter_drafts | ✅ Aplicada |
| 025 | empresa_segment_knowledge | ✅ Aplicada |

---

## 🚧 PENDÊNCIAS

- [ ] Cowork re-testar Sprint 4F após BUG 11 fix: `POST /api/agents/segment-specialist` → 200 + `empresa_segment_knowledge` populado
- [ ] Testar pipeline completo end-to-end (cron simulado manual)
- [ ] Testar matriz de permissões — 5 perfis (`docs/tests/matriz-permissoes.md`)
- [ ] Testar soft delete em produção (Migration 021 aplicada)
- [ ] Testar fluxo OCR completo em produção

---

## 🏗️ ARQUITETURA DO PIPELINE NEWSLETTER

```
POST /api/agents/data-collector
  → DataCollectorAgent.collect()
  → Supabase: contratos + itens
  → Claude: analisa padrões
  → INSERT empresa_intelligence

POST /api/agents/segment-specialist
  → SegmentSpecialistAgent.analyze()
  → empresa_intelligence (lê)
  → Claude x2: segmento + diagnóstico comportamental
  → UPSERT empresa_segment_knowledge (cache 30d)

POST /api/agents/insight-analyzer
  → InsightAnalyzerAgent.analyze()
  → empresa_intelligence + empresa_segment_knowledge (lê)
  → APIs: IPCA, Selic, PNCP, IBGE (Promise.allSettled)
  → Claude: gera 4 categorias de insights (enriquecidas com segmento)
  → INSERT newsletter_insights

POST /api/agents/content-writer
  → ContentWriterAgent.write()
  → newsletter_insights (lê)
  → Claude: gera conteúdo textual JSON
  → decideTema(): ALERTA|OPORTUNIDADE|MACRO|PADRÃO
  → renderEmailTemplate(): HTML com identidade DUO™
  → INSERT newsletter_drafts

POST /api/agents/send-newsletter
  → SendNewsletterAgent.send()
  → newsletter_drafts (lê, status='draft')
  → Resend: envia HTML com headers RFC 2369
  → UPDATE newsletter_drafts status='sent'

CRONS (Vercel Hobby):
  domingo 22h BRT → collect-and-analyze (Data Collector → Segment Specialist → Insight Analyzer)
  segunda 07h BRT → write-and-send (Content Writer → Send Newsletter)
```

---

## Supabase (Produção)
- **Projeto:** `hstlbkudwnboebmarilp`
- **URL produção:** https://app.duogovernance.com.br

## Commits Chave desta Sessão (13/03/2026)
- `e96e0d2` — feat(sprint-4f): Segment Specialist Agent
- `2d64729` — fix(segment-specialist): BUG 11 parseJSON greedy regex
- `b7af757` — INBOX BUG 10 IDLE — pipeline 10/10 validado

---

## 📊 RESUMO EXECUTIVO — O QUE FOI FEITO (sessão 11/03/2026)

### 🗑️ Fix Soft Delete Definitivo — RPC SECURITY DEFINER

**Causa raiz:** PostgREST verifica SELECT policy após UPDATE. Com `deleted_at` setado, linha some da policy `deleted_at IS NULL` → 403.

**Solução (Migration 021):**
- `soft_delete_contrato(p_id, p_user_id)` — SECURITY DEFINER
- `soft_delete_item_contrato(p_id)` — SECURITY DEFINER
- Services migrados de `.update()` para `.rpc()`

---

## 📊 RESUMO EXECUTIVO — O QUE FOI FEITO (sessão 10/03/2026)

### 🔐 Fix Cold Start + Auth

- `Promise.race` com 3s timeout na query `usuarios`
- Retry automático se `user` setado + `usuario=null` após loading
- Auth 100% estável (F5 5/5 ✅, sem LockManager timeout)
