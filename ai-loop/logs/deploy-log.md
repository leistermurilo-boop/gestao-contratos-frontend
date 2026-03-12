# Deploy Log

> Registro cronológico de todos os deploys para produção.

---

## Formato

```
### [YYYY-MM-DD] commit-hash — descrição
- Trigger: push para main / manual
- Status: ✅ sucesso / ❌ falha / ⏳ em andamento
- Vercel URL: https://...
- Notas: ...
```

---

## Histórico

### [2026-03-12] 42f57e5 — fix(data-collector): 3 bugs [Loop #2]
- Trigger: push para main
- Status: ✅ sucesso — validado pelo Cowork
- Arquivos: data-collector-agent.ts, route.ts, middleware.ts
- Notas: browser client → server client injetado; error handler; 401 JSON para /api/

### [2026-03-12] — fix(middleware): liberar /api/test-resend como rota pública
- Trigger: push para main (ciclo Cowork loop #1)
- Status: ⏳ em andamento
- Arquivos: `frontend/middleware.ts`
- Notas: Fix da causa raiz identificada pelo loop analyst→architect→dev→qa

### [2026-03-11] 4e1a4a5 — fix(soft-delete): RPC SECURITY DEFINER
- Trigger: push para main
- Status: ✅ sucesso
- Arquivos: `contratos.service.ts`, `itens.service.ts`, `MIGRATION 021.sql`
- Notas: Migration 021 aplicada manualmente no Supabase antes do deploy

### [2026-03-10] 7166e3f — fix(soft-delete): count:exact
- Trigger: push para main
- Status: ✅ sucesso
- Notas: Fix intermediário — problema de fundo resolvido na sessão 11/03

### [2026-03-10] 046349f — fix(auth): cold start timeout
- Trigger: push para main
- Status: ✅ sucesso
- Notas: Promise.race 3s + retry automático em auth-context

### [2026-03-09] 6acf465 — fix(auth): bypass WebLocks
- Trigger: push para main
- Status: ✅ sucesso
- Notas: Auth 100% estável após este commit (stress test 5/5 F5)
