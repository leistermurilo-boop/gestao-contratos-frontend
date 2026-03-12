# INBOX â Loop Trigger

> Arquivo de estado entre Cowork (browser) e Claude Code (terminal).
> **Cowork escreve aqui.** O terminal monitora via `/loop`.

---

## Estado Atual

```
Status: DONE
```

---

## Ultimo Report

**Data:** 2026-03-12
**Sessao de Teste:** Sprint 4A â Data Collector Agent POST /api/agents/data-collector
**Relatorio:** ai-loop/reports/browser-report.md
**Urgencia:** alta
**Notas do Cowork:** Endpoint retorna 500 com body {"error":"Erro desconhecido"} em 7.7s.
Root cause identificado: DataCollectorAgent usa browser supabase client (@/lib/supabase/client)
em contexto server-side â sem acesso a sessao. Error handler mascara erro real (nao instanceof Error).
Cenario 401 retornou 405 (middleware redireciona para /login que nao aceita POST).
Fix sugerido: injetar server client no agente + melhorar error handler com JSON.stringify(err).

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
