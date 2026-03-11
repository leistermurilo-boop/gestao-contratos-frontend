# Database Analysis

> Análise técnica do banco de dados gerada pelo @analyst.
> Foca em RLS, triggers, schema e queries problemáticas.

---

## Session: —

**Date:** —
**Triggered by:** browser-report / runtime-debug / outro

---

## Schema Check

**Tabelas envolvidas:**

**Colunas relevantes:**

```sql
-- Query de verificação executada

```

**Resultado:**

---

## RLS Check

**Políticas ativas:**

```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = '...'

```

**Resultado:**

**Problema identificado:**

---

## Trigger Check

**Triggers envolvidos:**

```sql

```

**Comportamento esperado:**

**Comportamento observado:**

---

## Query Analysis

**Query que falhou:**

```sql

```

**Erro:**

**Causa raiz confirmada:**

---

## Conclusão @analyst

**Causa raiz:**

**Impacto:**

**Recomendação para @architect:**
