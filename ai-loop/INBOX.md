# INBOX — Loop Trigger

> Arquivo de estado entre Cowork (browser) e Claude Code (terminal).
> **Cowork escreve aqui.** O terminal monitora via `/loop`.

---

## Estado Atual

```
Status: IDLE
```

---

## Proximo Teste (aguardando Cowork)

**Sprint:** 4A — Data Collector Agent
**Deploy:** a891350 — em producao

### Testar: POST /api/agents/data-collector

```
URL: https://app.duogovernance.com.br/api/agents/data-collector
Metodo: POST
Auth: necessaria (fazer login como admin antes)
Body: vazio
```

**Como testar (console do browser logado):**
```javascript
fetch('/api/agents/data-collector', { method: 'POST' })
  .then(r => r.json()).then(console.log)
```

**Verificar no Supabase apos sucesso:**
```sql
SELECT * FROM empresa_intelligence ORDER BY created_at DESC LIMIT 1;
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Analise concluida com sucesso",
  "data": {
    "total_contratos": N,
    "total_itens": N,
    "insights_gerados": N,
    "tempo_processamento_ms": N
  }
}
```

**Cenarios a validar:**
1. Endpoint retorna 200 + JSON success:true
2. Tabela empresa_intelligence populada com insights
3. Campos JSON validos: portfolio_materiais, padroes_renovacao, sazonalidade, orgaos_frequentes
4. confianca_score calculado (0-1)
5. Endpoint retorna 401 sem autenticacao

---

## Ultimo Report

**Data:** 2026-03-12
**Sessao:** Loop 1 — Resend ok
**Resultado:** RESOLVIDO — success:true, email ID 00aa5229-6b42-4317-83c7-c5d7968022d3

---

## Como usar

### Cowork — escreve aqui quando termina os testes:
```
Status: READY
Data: YYYY-MM-DD HH:MM
Sessao de Teste: descricao
Relatorio: ai-loop/reports/browser-report.md
Urgencia: normal|alta|critica
Notas: contexto extra
```

### Terminal — detecta READY e inicia ciclo:
```bash
/analyze-inbox
```
