# Fix Plan

> Plano de correção definido pelo @architect.
> Deve ser aprovado antes de qualquer implementação pelo @dev.

---

## Session: —

**Date:** —
**Bug:** (referência ao browser-report)
**Analyst report:** database-analysis.md / runtime-debug.md

---

## Diagnóstico Confirmado

**Causa raiz:**

**Componentes afetados:**
- [ ] Frontend (Next.js)
- [ ] Backend (Supabase — RLS / triggers / schema)
- [ ] API Routes
- [ ] Services
- [ ] Migrations

---

## Solução Proposta

### Abordagem

**Opção escolhida:**

**Motivo:**

**Opções descartadas e por quê:**

---

### Arquivos a modificar

| Arquivo | Tipo de mudança | Risco |
|---------|----------------|-------|
| | | baixo / médio / alto |

### Migrations necessárias

- [ ] Migration XXX — descrição

### Ordem de execução

1.
2.
3.

---

## Checklist de Segurança

- [ ] Não quebra RLS existente
- [ ] Não altera schema de forma destrutiva
- [ ] Não remove features existentes
- [ ] Compatível com multi-tenant (empresa_id isolado)
- [ ] Testado em local antes do deploy

---

## Validação pelo @qa

**Cenários a testar:**
1.
2.
3.

**Critério de sucesso:**

---

## Status

- [ ] Plano definido pelo @architect
- [ ] Aprovado
- [ ] Implementado pelo @dev
- [ ] Validado pelo @qa
- [ ] Deploy realizado
- [ ] Confirmado pelo Cowork
