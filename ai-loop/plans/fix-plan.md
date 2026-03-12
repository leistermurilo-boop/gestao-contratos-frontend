# Fix Plan — @architect

**Date:** 2026-03-12
**Bug:** GET /api/test-resend → 404 em produção
**Analyst report:** database-analysis.md

---

## Diagnóstico Confirmado

**Causa raiz:** middleware bloqueia `/api/test-resend` por ausência em `isPublicRoute`

**Componentes afetados:**
- [x] Frontend (Next.js) — middleware.ts
- [ ] Backend (Supabase — RLS / triggers / schema)
- [ ] API Routes
- [ ] Services
- [ ] Migrations

---

## Solução Proposta

### Abordagem

**Opção escolhida:** adicionar `pathname.startsWith('/api/test-resend')` à lista `isPublicRoute`

**Motivo:** endpoint de teste sem dados sensíveis, acesso público intencional para validação Resend

**Opções descartadas:**
- Acessar autenticado: inviável para teste automatizado pelo Cowork
- Mover para rota fora de `/api/`: desnecessário, aumenta complexidade

---

### Arquivos a modificar

| Arquivo | Tipo de mudança | Risco |
|---------|----------------|-------|
| `frontend/middleware.ts` | +1 linha em `isPublicRoute` | baixo |

### Migrations necessárias

Nenhuma.

### Ordem de execução

1. Editar `middleware.ts` — adicionar linha em `isPublicRoute`
2. `npm run typecheck && npm run lint`
3. Commit + push → Vercel auto-deploy

---

## Checklist de Segurança

- [x] Não quebra RLS existente
- [x] Não altera schema de forma destrutiva
- [x] Não remove features existentes
- [x] Compatível com multi-tenant (endpoint não acessa dados de empresa)
- [ ] Testado após deploy pelo Cowork

---

## Validação pelo @qa

**Cenários a testar:**
1. `GET /api/test-resend` sem auth → deve retornar JSON (200 ou 400/500, nunca 404)
2. `GET /api/test-resend` com RESEND_API_KEY válida → `{ success: true }`
3. Demais rotas `/api/` protegidas continuam retornando redirect para `/login` sem auth

**Critério de sucesso:** status != 404 no endpoint

---

## Status

- [x] Plano definido pelo @architect
- [x] Aprovado
- [ ] Implementado pelo @dev
- [ ] Validado pelo @qa
- [ ] Deploy realizado
- [ ] Confirmado pelo Cowork
