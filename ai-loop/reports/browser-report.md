# Browser Report — Cowork QA Session

**Data:** 2026-03-12
**Sessao:** Sprint 4A — Data Collector Agent

---

## Environment

- **Environment:** Production
- **URL Tested:** https://app.duogovernance.com.br/api/agents/data-collector
- **Method:** POST
- **Auth State:** Autenticado como Admin (Murilo Leister / MGL Gestao)

---

## Test Scenario

Validar o endpoint POST /api/agents/data-collector (Sprint 4A):
1. Retorna 200 + JSON success:true com auth
2. Popula tabela empresa_intelligence
3. Campos JSON validos (portfolio_materiais, padroes_renovacao, sazonalidade, orgaos_frequentes)
4. confianca_score calculado (0-1)
5. Retorna 401 sem autenticacao

---

## Steps Performed

1. Login como Admin no dashboard
2. Executado: fetch('/api/agents/data-collector', { method: 'POST' }) com cookies de sessao
3. Aguardado resposta (timeout 10s)
4. Testado sem auth: fetch com credentials:'omit'
5. Inspecionado codigo fonte do agente via GitHub API

---

## Expected Result

HTTP 200 + JSON:
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

---

## Actual Result

### Cenario 1 — POST autenticado
- HTTP 500
- Body: {"error":"Erro desconhecido"}
- Tempo: 7724ms (7.7s)
- FALHOU

### Cenario 2/3/4 — tabela empresa_intelligence, campos JSON, confianca_score
- NAO VERIFICAVEL — endpoint retornou 500 antes de concluir operacao
- FALHOU (bloqueado pelo 500)

### Cenario 5 — sem autenticacao (credentials:omit)
- HTTP 405 Method Not Allowed (body vazio)
- ATENCAO: esperado 401, recebeu 405
- Possivelmente o middleware redirecionou para /login que nao aceita POST

---

## Console Errors

Nenhum erro de console client-side capturado.
O erro ocorre server-side (Vercel function).

---

## Network Errors

POST /api/agents/data-collector -> 500 {"error":"Erro desconhecido"} em 7724ms

---

## Database Errors

Nao verificavel a partir do browser.
Supabase errors provaveis — ver Root Cause abaixo.

---

## Root Cause Hypothesis

### Causa 1 (MAIS PROVAVEL): Browser Supabase client em contexto server-side

Arquivo: frontend/lib/agents/newsletter/data-collector/data-collector-agent.ts

A classe DataCollectorAgent instancia o Supabase com:
  private supabase = createClient() // importado de @/lib/supabase/client

Este eh o BROWSER client. Dentro de uma API route (server-side),
o browser client nao tem acesso aos cookies httpOnly da sessao.
Resultado: queries ao Supabase falham com erro de autorizacao (PostgrestError),
que NAO eh uma instancia de Error, caindo no fallback 'Erro desconhecido'.

### Causa 2 (RELACIONADA): Error handler mascarando o erro real

No catch do agente:
  const msg = err instanceof Error ? err.message : 'Erro desconhecido'

Erros do Supabase (PostgrestError) e do SDK Anthropic nao sao instancias
de Error nativo, logo o message real eh perdido.

### Causa 3 (SECUNDARIA): Cenario 401 retorna 405

Com credentials:omit, o middleware redireciona para /login (GET 302),
mas a pagina /login nao aceita POST, resultando em 405.
Comportamento tecnicamente correto para o fluxo de middleware, mas
diferente do esperado (401 direto).

---

## Suggested Fix Direction

### Fix 1 — Injetar server client no DataCollectorAgent

Opcao A: Modificar DataCollectorAgent para receber o Supabase client como parametro:
  constructor(private supabase: SupabaseClient) {}

No route.ts, passar o server client:
  const supabase = await createClient() // server client ja importado
  const agent = new DataCollectorAgent(supabase) // injetar

Opcao B: Dentro do agente, importar de @/lib/supabase/server e usar await createClient()

### Fix 2 — Melhorar error handler

Substituir:
  const msg = err instanceof Error ? err.message : 'Erro desconhecido'
Por:
  const msg = err instanceof Error ? err.message : JSON.stringify(err) ?? String(err)

Isso expoe o erro real (ex: PostgrestError com code, message, details).

### Fix 3 — Verificar tabela empresa_intelligence

Confirmar que a tabela existe e que as RLS policies permitem INSERT
para o usuario autenticado com empresa_id correto.
