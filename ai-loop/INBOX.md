# INBOX Ã¢ÂÂ Loop Trigger

> Arquivo de estado entre Cowork (browser) e Claude Code (terminal).
> **Cowork escreve aqui.** O terminal monitora via `/loop`.

---

## Estado Atual

```
Status: IDLE
```

---

## Ultimo Report

**Data:** —
**Sessao de Teste:** —
**Relatorio:** ai-loop/reports/browser-report.md
**Urgencia:** normal | alta | critica
**Notas do Cowork:** —
Root cause identificado: DataCollectorAgent usa browser supabase client (@/lib/supabase/client)
em contexto server-side Ã¢ÂÂ sem acesso a sessao. Error handler mascara erro real (nao instanceof Error).
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
