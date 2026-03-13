# Fix Plan — @architect — Sprint 4F: Segment Specialist Agent (2026-03-13)

## Decisões Técnicas

**Sprint:** 4F (4D=Send Newsletter, 4E=bug fixes — nomenclatura corrigida)
**Complexidade estimada:** ~6h
**Aprovado por:** @architect

### Decisão 1: Sem web search — Claude usa conhecimento de treinamento
Claude-sonnet-4-6 tem vasto conhecimento sobre B2G brasileiro. Sem dependência de EXA/Tavily.
Vantagem: sem latência extra, sem custo adicional de API, sem ponto de falha externo.

### Decisão 2: Lê empresa_intelligence — não re-coleta contratos
Data Collector já produziu: portfolio_materiais, orgaos_frequentes, esferas_atuacao,
ticket_medio, margem_media_historica, padroes_renovacao, sazonalidade, evolucao_portfolio.
Segment Specialist lê esse output — não duplica queries ao banco.

### Decisão 3: Duas chamadas Claude focadas
- Chamada 1 (~800 tokens): Segmento + Best Practices (portfolio como input)
- Chamada 2 (~600 tokens): Diagnóstico comportamental (intelligence completo como input)
Total ~1400 tokens — dentro dos limites confortavelmente.

### Decisão 4: Cache 30 dias com upsert
Segmento não muda frequentemente. onConflict: 'empresa_id' — só 1 registro por empresa.
Cache invalidado se updated_at > 30 dias.

### Decisão 5: Pipeline cron atualizado
collect-and-analyze: Data Collector → Segment Specialist → Insight Analyzer
(Segment Specialist inserido entre os dois — Insight Analyzer lê knowledge base)

### Decisão 6: System prompt como constante de módulo
O prompt de consultor B2G (desenvolvido pelo @analyst com pesquisa real) fica em
SEGMENT_SPECIALIST_SYSTEM_PROMPT — constante no arquivo do agent.

## Arquivos a Criar/Modificar

### CRIAR:
1. `database/migrations/MIGRATION 025.sql`
2. `frontend/lib/agents/newsletter/segment-specialist/segment-specialist-agent.ts`
3. `frontend/app/api/agents/segment-specialist/route.ts`

### MODIFICAR:
4. `frontend/lib/agents/core/types.ts` — adicionar tipos Sprint 4F
5. `frontend/lib/agents/newsletter/insight-analyzer/insight-analyzer-agent.ts` — integrar knowledge base
6. `frontend/app/api/cron/collect-and-analyze/route.ts` — inserir Segment Specialist no pipeline

## Schema (simplificado vs proposta original)
- REMOVIDO: referencias_urls (sem web search), ultima_busca_web (desnecessário)
- MANTIDO: segmento_primario, subsegmentos, nicho_b2g, best_practices,
  benchmarks_mercado, regiao_atuacao_inferida, modelo_negocio_inferido,
  capacidade_operacional_inferida, estrategia_detectada, padroes_comportamentais

## Sem riscos de regressão
Segment Specialist é inserido no pipeline com try/catch isolado.
Se falhar, Insight Analyzer continua sem o enrichment (graceful degradation).
