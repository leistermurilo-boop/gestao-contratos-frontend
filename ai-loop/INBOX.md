---
INBOX — Loop Trigger
Arquivo de estado entre Cowork (browser) e Claude Code (terminal).
Cowork escreve aqui. O terminal monitora via '/loop'.

---

## Estado Atual

**Status: IN_PROGRESS**
**Sprint 4G — Correção IPCA 52% + Auditoria Agentes**
**Data:** 2026-03-15

Cowork concluiu auditoria completa de todos os agentes da newsletter pipeline.
3 novos bugs confirmados. Ver `ai-loop/reports/browser-report.md` para detalhes completos.

---

## Bugs Confirmados — Sprint 4G

### BUG 16 — `insights_macro` sem campo `ipca_12m_pct` (ROOT CAUSE do 52%)
**Arquivo:** `frontend/lib/agents/newsletter/insight-analyzer/insight-analyzer-agent.ts`

Contexto passa `ipca_12m: 3.81` ao Claude sem label de unidade.
Schema de output do `insights_macro` tem `selic_atual: 0` mas **não tem `ipca_12m_pct`**.
Claude escreve IPCA em campos de texto livres e halucina "52%" (calcula 12 × ~4.4%).

**Fix:**
1. No objeto `contexto`: renomear `ipca_12m` → `ipca_12m_pct`
2. No schema do prompt `insights_macro`: adicionar `"ipca_12m_pct": 0.0` após `"selic_atual": 0`

---

### BUG 17 — Greedy regex em content-writer (BUG 14 nunca aplicado)
**Arquivo:** `frontend/lib/agents/newsletter/content-writer/content-writer-agent.ts`
**Linha:** 281

```
const jsonMatch = raw.match(/\{[\s\S]*\}/)   ← GREEDY — corrigir com brace-counting
```

**Fix:** Copiar brace-counting de `parseInsightResponse` do insight-analyzer.

---

### BUG 18 — content-writer sem instrução sobre `ipca_12m`
**Arquivo:** `frontend/lib/agents/newsletter/content-writer/content-writer-agent.ts`
**Linhas:** 224–228 (prompt template)

Prompt não instrui Claude sobre unidade/uso do `ipca_12m`. Claude calcula por conta própria.

**Fix:** Adicionar após "DADOS:" no prompt:
```
ATENÇÃO: ipca_12m = IPCA acumulado nos últimos 12 meses em %.
Use EXATAMENTE o valor fornecido. NÃO calcule IPCA por conta própria.
```

---

## Confirmações (sem bug — fixes anteriores OK)

- ✅ fetchIPCA() BUG 1 fix mantido — retorna 3.81, não soma
- ✅ fetchIPCA() BUG 2 fix mantido — período dinâmico
- ✅ Segment-specialist integrado ao insight-analyzer
- ✅ Brace-counting no insight-analyzer (BUG 14)
- ✅ maxTokens 16000 no insight-analyzer (BUG 15)

---

## Historico

| Data | Sessao | Status | Ciclo |
|------|--------|--------|-------|
| 2026-03-12 | Loop #1 | Resend middleware | DONE dev |
| 2026-03-12 | Loop #2 | Sprint 4A Data Collector | DONE analyst - architect - dev - qa |
| 2026-03-12 | Loop #3 | Sprint 4B Insight Analyzer | DONE analyst - architect - dev - qa |
| 2026-03-12 | Loop #4 | Sprint 4C fix maxTokens | DONE dev |
| 2026-03-12 | Loop #4b | Sprint 4C design system | DONE dev |
| 2026-03-13 | Loop #5 | Sprint 4D Send Newsletter | DONE dev |
| 2026-03-13 | Loop #6 | Sprint 4E 9 bugs newsletter | DONE analyst - architect - dev - qa |
| 2026-03-13 | Loop #7 | BUG 10 fetchIBGE offset | DONE dev |
| 2026-03-13 | Loop #8 | BUG 11 parseJSON greedy segment-specialist | DONE dev |
| 2026-03-13 | Loop #9 | BUG 12 maxTokens 2000 segment-specialist | DONE dev |
| 2026-03-15 | Loop #10 | BUG 13 VARCHAR(200) overflow | DONE dev |
| 2026-03-15 | Loop #11 | BUG 14 greedy regex insight-analyzer | DONE dev |
| 2026-03-15 | Loop #12 | BUG 15 maxTokens insight-analyzer | DONE dev |
| 2026-03-15 | Sprint 4F | Segment Specialist Agent | DONE |
| 2026-03-15 | Loop #13 | Sprint 4G BUG 16+17+18 IPCA 52% | READY — aguardando fix terminal |
