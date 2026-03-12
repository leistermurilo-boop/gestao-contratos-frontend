# INBOX — Loop Trigger

> Arquivo de estado entre Cowork (browser) e Claude Code (terminal).
> **Cowork escreve aqui.** O terminal monitora via `/loop`.

---

## Estado Atual

```
Status: IDLE
```

**Status possíveis:**
- `IDLE` — nenhum relatório pendente
- `READY` — Cowork terminou, aguardando análise
- `IN_PROGRESS` — @analyst processando
- `DONE` — ciclo completo, aguardando próximo teste

---

## Último Report

**Data:** —
**Sessão de Teste:** —
**Relatório:** ai-loop/reports/browser-report.md
**Urgência:** normal | alta | crítica
**Notas do Cowork:** —

---

## Como usar

### Cowork → escreve aqui quando termina os testes:
```
Status: READY
Data: YYYY-MM-DD HH:MM
Sessão de Teste: [breve descrição — ex: "teste resend email + soft delete"]
Relatório: ai-loop/reports/browser-report.md
Urgência: normal
Notas do Cowork: [qualquer contexto extra]
```

### Terminal → detecta READY e inicia ciclo de agentes:
```bash
# Manual:
/analyze-inbox

# Automático (monitoramento contínuo):
/loop 1m /analyze-inbox
```

---

## Histórico

| Data | Sessão | Status Final | Agentes Ativados |
|------|--------|-------------|-----------------|
| — | — | — | — |
