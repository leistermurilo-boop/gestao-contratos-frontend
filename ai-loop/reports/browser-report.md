# Browser Report — Sprint 4F BUG 15 (persiste)

## Environment
- URL Tested: https://app.duogovernance.com.br/dashboard
- Date: 2026-03-15
- Loop: #12b — Sprint 4F BUG 15 ainda não resolvido

## Test Scenario
Cenário 3 re-teste pós BUG 15 — POST /api/agents/insight-analyzer

## Steps Performed
1. Autenticado em app.duogovernance.com.br/dashboard
2. Disparado POST /api/agents/insight-analyzer — fire-and-forget
3. Aguardado resultado via window._ia2Status

## Expected Result
HTTP 200 + insights enriquecidos com segment knowledge

## Actual Result
HTTP 500 após 161068ms
{ "error": "JSON não fechado em parseInsightResponse" }

## Evidência de Progresso
Tempo anterior (antes do aumento de maxTokens): 122822ms
Tempo atual (após aumento de maxTokens): 161068ms

O tempo MAIOR confirma que maxTokens foi aumentado e o Claude está gerando
mais tokens agora — mas a resposta AINDA está sendo truncada antes do fechamento.
O conteúdo do insight-analyzer é muito grande para o novo limite também.

## Root Cause Hypothesis
maxTokens atual ainda insuficiente para o insight-analyzer.
O agente provavelmente gera uma análise muito extensa com múltiplos campos.
Estimativa baseada na taxa de geração (~50-60 tokens/s):
- 122s → ~6000-7500 tokens gerados (truncado)
- 161s → ~8000-9600 tokens gerados (truncado)
O response completo provavelmente requer 10000-16000 tokens.

## Suggested Fix Direction
Aumentar maxTokens para 16000 no insight-analyzer-agent.ts:

  this.claudeClient = new ClaudeClient({
    maxTokens: 16000,  // era 6000→8000 — ainda insuficiente
  })

Alternativa: Refatorar o prompt para gerar resposta mais concisa,
ou dividir a análise em múltiplas chamadas menores.

Nota: Considerar também o timeout da Vercel (300s max em Pro).
Com 16000 tokens a ~50 tokens/s = ~320s — pode ultrapassar o limite.
Recomendação: usar streaming ou dividir em chamadas menores.
