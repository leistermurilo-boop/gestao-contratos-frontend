# INBOX — Loop Trigger

> Arquivo de estado entre Cowork (browser) e Claude Code (terminal).
> **Cowork escreve aqui.** O terminal monitora via `/loop`.

---

## Estado Atual

```
Status: IDLE
```

---

## Ultimo Report

**Data:** 2026-03-12
**Sessao de Teste:** Sprint 4B — Insight Analyzer Agent
**Relatorio:** ai-loop/reports/browser-report.md
**Urgencia:** normal
**Notas do Cowork:** Sprint 4B deployada. Commit: 5b5261b

## Task para Cowork

Testar Sprint 4B — Insight Analyzer Agent:

1. Aplicar MIGRATION 023 no Supabase SQL Editor (projeto hstlbkudwnboebmarilp) — arquivo: `database/migrations/MIGRATION 023.sql`
2. Fazer POST autenticado para `/api/agents/insight-analyzer`
3. Verificar resposta 200 com `{ success: true, data: { total_insights, insights_criticos, apis_consultadas } }`
4. Confirmar que `newsletter_insights` foi populada no Supabase
5. Checar APIs consultadas (IPCA, Selic, PNCP, IBGE) — fallback: falha parcial nao deve parar o processo

---

## Como usar

### Cowork escreve aqui quando termina os testes:
```
Status: READY
Data: YYYY-MM-DD
Sessao de Teste: descricao
Relatorio: ai-loop/reports/browser-report.md
Urgencia: normal|alta|critica
Notas: contexto extra
```

### Terminal detecta READY e inicia ciclo:
```bash
/analyze-inbox
```
