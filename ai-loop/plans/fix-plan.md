# Fix Plan — @architect

**Date:** 2026-03-12
**Bug:** DataCollectorAgent 500 + 405 [Loop #2]
**Analyst report:** database-analysis.md

---

## Diagnóstico Confirmado

3 bugs independentes:

1. **Browser client em contexto server-side** — causa raiz do 500
2. **Error handler mascarando PostgrestError** — causa raiz do "Erro desconhecido"
3. **Middleware redireciona POST /api/ para login → 405** — causa raiz do 405

---

## Solução Técnica

### Fix #1 — Injetar SupabaseClient via construtor
Remover import de `createClient` do agent. Route handler passa o server client.

```typescript
// data-collector-agent.ts
import type { SupabaseClient } from '@supabase/supabase-js'
constructor(private supabase: SupabaseClient) {}

// route.ts
const agent = new DataCollectorAgent(supabase)
```

### Fix #2 — Error handler robusto
```typescript
const msg = error instanceof Error
  ? error.message
  : (typeof error === 'object' ? JSON.stringify(error) : String(error))
```

### Fix #3 — Middleware retorna 401 para /api/ sem auth
```typescript
if (!isPublicRoute && !user) {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  // redirect para login apenas para rotas de página
  ...
}
```

---

## Arquivos Afetados

| Arquivo | Mudança | Risco |
|---------|---------|-------|
| `frontend/lib/agents/newsletter/data-collector/data-collector-agent.ts` | Injetar supabase via construtor | baixo |
| `frontend/app/api/agents/data-collector/route.ts` | Passar supabase ao construtor | baixo |
| `frontend/middleware.ts` | 401 JSON para /api/ sem auth | baixo |

## Migrations: Não.

## Aprovado: @architect
