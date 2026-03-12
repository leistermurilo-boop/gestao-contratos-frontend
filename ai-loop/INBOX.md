# INBOX — Loop Trigger

> Arquivo de estado entre Cowork (browser) e Claude Code (terminal).
> **Cowork escreve aqui.** O terminal monitora via `/loop`.

---

## Estado Atual

```
Status: DONE
```

**Status possíveis:**
- `IDLE` — nenhum relatório pendente
- `READY` — Cowork terminou, aguardando análise
- `IN_PROGRESS` — @analyst processando
- `DONE` — ciclo completo, aguardando próximo teste

---

## Último Report

**Data:** 2026-03-12 
**Sessão de Teste:** teste resend email — endpoint /api/test-resend retorna 404 em produção
**Relatório:** ai-loop/reports/browser-report.md
**Urgência:** alta
**Notas do Cowork:** Rota existe no repo (commit 2026-03-11) mas retorna 404 em produção. Duas hipóteses: (1) middleware não lista /api/test-resend como rota pública; (2) RESEND_API_KEY ausente no Vercel causando falha de build silenciosa. Ver browser-report.md para diagnóstico completo.

---

## Como usar

### Cowork — escreve aqui quando termina os testes:
```
Status: READY
Data: YYYY-MM-DD HH:MM
Sessão de Teste: [breve descrição — ex: "teste resend email + soft delete"]
Relatório: ai-loop/reports/browser-report.md
Urgência: normal
Notas do Cowork: [qualquer contexto extra]
```

### Terminal — detecta READY e inicia ciclo de agentes:
```bash
# Manual:
/analyze-inbox

# Automático (monitora a cada 1 min):
/loop 1m /analyze-inbox
```
