# Browser Report — Sprint 4F BUG 13

## Environment
- URL Tested: https://app.duogovernance.com.br/dashboard
- Date: 2026-03-15
- Loop: #10 — Sprint 4F BUG 13

## Test Scenario
Cenário 1 — POST /api/agents/segment-specialist → 200 + segmento + registro em empresa_segment_knowledge

## Steps Performed
1. Autenticado em app.duogovernance.com.br/dashboard
2. Disparado fetch fire-and-forget: POST /api/agents/segment-specialist
3. Aguardado ~77s (analyzeSegment + analyzeBehavior)
4. Resultado: window._seg5Status = done_500_76760ms

## Expected Result
HTTP 200 + segmento_primario + registro em empresa_segment_knowledge

## Actual Result
HTTP 500 — { code: 22001, message: value too long for type character varying(200) }

## Console Errors
Nenhum (erro server-side)

## Network Errors
POST /api/agents/segment-specialist → 500 (76760ms)

## Database Errors
Postgres 22001: value too long for character varying(200)
Tabela: empresa_segment_knowledge
BUG 12 corrigido (maxTokens 4000) mas colunas VARCHAR(200) insuficientes

## Root Cause Hypothesis
MIGRATION 025.sql define VARCHAR(200) para:
- segmento_primario
- modelo_negocio_inferido
- estrategia_detectada
Com maxTokens 4000 Claude gera valores acima de 200 chars.

## Suggested Fix Direction
ALTER TABLE empresa_segment_knowledge
  ALTER COLUMN segmento_primario TYPE TEXT,
  ALTER COLUMN modelo_negocio_inferido TYPE TEXT,
  ALTER COLUMN estrategia_detectada TYPE TEXT;
Criar MIGRATION 026.sql ou aplicar via Supabase SQL editor.
