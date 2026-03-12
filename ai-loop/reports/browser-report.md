# Browser Report — Loop #2: Sprint 4A — Data Collector Agent

## Environment
- **Date:** 2026-03-12
- **Tester:** Cowork (Claude)
- **Environment:** Production (Vercel)
- **App URL:** https://app.duogovernance.com.br

## URL Tested
`POST /api/agents/data-collector`

## Test Scenario
Validar execução do DataCollectorAgent via endpoint de API em produção.

## Steps Performed
1. Login em https://app.duogovernance.com.br/dashboard
2. Executado fetch POST com credentials include (autenticado)
3. Executado fetch POST com credentials omit (sem auth)
4. Inspecionado código-fonte via GitHub API

## Expected Result
- POST autenticado: HTTP 200 + {"success": true, ...}
- POST sem auth: HTTP 401

## Actual Result
- POST autenticado: HTTP 500 {"error":"Erro desconhecido"} em ~7724ms
- POST sem auth: HTTP 405 (esperado 401)

## Console Errors
Nenhum erro adicional de console capturado.

## Network Errors
- POST /api/agents/data-collector → 500 Internal Server Error
- Body: {"error":"Erro desconhecido"}
- Tempo de resposta: ~7724ms

## Database Errors
Provável falha em query Supabase por uso de cliente browser sem sessão server-side.

## Root Cause Hypothesis

### Bug #1 — Cliente Supabase errado (CRÍTICO)
Arquivo: frontend/lib/agents/newsletter/data-collector/data-collector-agent.ts

ATUAL (quebrado):
  import { createClient } from @/lib/supabase/client  // cliente BROWSER
  private supabase = createClient()  // sem acesso a sessão server-side

O DataCollectorAgent é instanciado em Route Handler (server-side) mas usa cliente browser.
Todas as queries Supabase falham pois o cliente browser não acessa cookies httpOnly.

### Bug #2 — Error handler mascarando erro real
catch (error: unknown) {
  const msg = error instanceof Error ? error.message : "Erro desconhecido"
  // PostgrestError NAO e instanceof Error => retorna "Erro desconhecido"
}

### Bug #3 — Endpoint retorna 405 sem auth (esperado 401)

## Suggested Fix Direction

### Fix #1 — Injetar servidor client no DataCollectorAgent
Opção A (recomendada): Injetar supabase como parâmetro do construtor
  constructor(private supabase: SupabaseClient) {}
  // Em route.ts: const agent = new DataCollectorAgent(supabase)

### Fix #2 — Melhorar error handler
  const msg = error instanceof Error ? error.message : JSON.stringify(error) ?? String(error)

## Arquivos Afetados
1. frontend/lib/agents/newsletter/data-collector/data-collector-agent.ts
2. frontend/app/api/agents/data-collector/route.ts

## Prioridade
CRITICA — endpoint central do Sprint 4A nao funciona em producao.

_Report gerado por Cowork em 2026-03-12_