# Architecture Plan

> Decisões arquiteturais de médio e longo prazo definidas pelo @architect.
> Diferente do fix-plan (reativo), este documento é proativo e evolui entre sessões.

---

## Decisões Arquiteturais Vigentes

| # | Decisão | Motivo | Data |
|---|---------|--------|------|
| 1 | Nunca passar `empresa_id` ao service — RLS injeta automaticamente | Multi-tenant seguro | — |
| 2 | Nunca recalcular campos GENERATED ALWAYS | Consistência via trigger | — |
| 3 | Soft delete apenas em `contratos` e `itens_contrato` | Auditoria + imutabilidade | — |
| 4 | Logout sempre via `window.location.href = '/api/auth/signout'` | Limpar cookies HTTP | — |
| 5 | RPC SECURITY DEFINER para operações que PostgREST bloqueia pós-UPDATE | Contornar SELECT policy check | 2026-03-11 |

---

## Padrões Estabelecidos

### Soft Delete
Usar RPC `SECURITY DEFINER` para qualquer UPDATE que torne a linha invisível à SELECT policy.
Razão: PostgREST verifica visibilidade pós-UPDATE — não há solução via políticas RLS.

### Auth
- `lock: <R>(_n, _t, fn) => fn()` no browser client (bypass WebLocks em SSR)
- Dual-path init: `getSession()` + `INITIAL_SESSION` com `initResolve`
- Safety timers: 4s + 8s

### Multi-tenant
Todo dado isolado por `empresa_id` via RLS. Nunca filtrar manualmente no service.

---

## Backlog Arquitetural

| Item | Prioridade | Status |
|------|-----------|--------|
| Módulo de suporte (Crisp + IA) | média | pendente |
| Testes de perfil (matriz de permissões) | alta | pendente |
| OCR em produção (ANTHROPIC_API_KEY no Vercel) | alta | pendente |

---

## Notas de Sessão

### 2026-03-11
- Identificado: PostgREST aplica SELECT policy como verificação pós-UPDATE
- Padrão definido: soft delete via RPC SECURITY DEFINER (ver Migration 021)
