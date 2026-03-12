# Cowork Integration — Formato de Relatório

O Cowork deve produzir relatórios seguindo este formato padrão ao detectar bugs ou comportamentos inesperados.

## Protocolo Completo (2 passos obrigatórios)

**Passo 1 — Escrever o report:**
Salvar em `ai-loop/reports/browser-report.md` (substituindo o conteúdo anterior).

**Passo 2 — Atualizar o INBOX (OBRIGATÓRIO):**
Após salvar o report, atualizar `ai-loop/INBOX.md` com:
```
Status: READY
Data: YYYY-MM-DD HH:MM
Sessão de Teste: [breve descrição — ex: "teste resend email + soft delete"]
Relatório: ai-loop/reports/browser-report.md
Urgência: normal | alta | crítica
Notas do Cowork: [qualquer contexto extra]
```

> Sem atualizar o INBOX, o terminal não detecta o report. Este passo é o "sinal" para o loop de agentes iniciar.

---

## Template

```
## Report

**Date:** YYYY-MM-DD HH:MM
**Session:** [breve descrição da sessão]

---

**Environment:**
- URL: https://...
- Browser: Chrome / Firefox / Safari
- User Profile: admin / juridico / financeiro / compras / logistica
- Empresa ID: (se relevante)

**Test Scenario:**
[Descrição do que estava sendo testado]

---

**Steps Performed:**
1. ...
2. ...
3. ...

**Expected Result:**
[O que deveria acontecer]

**Actual Result:**
[O que aconteceu de fato]

---

**Console Errors:**
```
[colar erros do console aqui — código de erro, mensagem completa]
```

**Network Errors:**
```
[método] [URL] → [status code]
Response body: ...
```

**Database Errors:**
```
[código PostgreSQL] — [mensagem]
Hint: ...
```

---

**Root Cause:**
[Hipótese inicial do Cowork sobre a causa raiz — pode ser vazio se desconhecido]

**Suggested Fix:**
[Sugestão de correção — pode ser vazio]
```

---

## Exemplos de preenchimento

### Console Error
```
Console Errors:
  Error: new row violates row-level security policy for table "contratos"
  Code: 42501
```

### Network Error
```
Network Errors:
  PATCH /rest/v1/contratos?id=eq.abc → 403 Forbidden
  Response: {"code":"42501","message":"new row violates row-level security policy"}
```

### Database Error
```
Database Errors:
  42501 — new row violates row-level security policy for table contratos
  Context: UPDATE contratos SET deleted_at = '2026-03-11T...' WHERE id = 'abc'
```

---

## Notas

- Sempre incluir o User Profile utilizado no teste — é crítico para diagnóstico de RLS
- Network Errors: copiar o status code e o response body completo
- Console Errors: copiar o stack trace quando disponível
- Se o bug for intermitente, descrever a frequência e condições de reprodução
