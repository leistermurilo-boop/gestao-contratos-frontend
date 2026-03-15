# @analyst — Database Analysis — BUG 13 (2026-03-15)

## Causa Raiz Confirmada

**Postgres 22001: value too long for type character varying(200)**

MIGRATION 025.sql define 3 colunas como `VARCHAR(200)` na tabela `empresa_segment_knowledge`:
- `segmento_primario VARCHAR(200) NOT NULL` — linha 12
- `modelo_negocio_inferido VARCHAR(200)` — linha 53
- `estrategia_detectada VARCHAR(200)` — linha 66

Com `maxTokens: 4000` (fix BUG 12), o Claude gera valores descritivos mais ricos e longos para esses campos. O prompt instrui Claude a retornar strings como `"segmento_primario": "Equipamentos de Informática..."` — com maxTokens 4000 o modelo expande essas descrições além dos 200 chars.

O ponto de falha exato é `segment-specialist-agent.ts:347` — método `saveKnowledge()`, no `.upsert()` que passa os 3 campos VARCHAR(200) diretamente.

## Evidências

- `database/migrations/MIGRATION 025.sql:12` — `segmento_primario VARCHAR(200) NOT NULL`
- `database/migrations/MIGRATION 025.sql:53` — `modelo_negocio_inferido VARCHAR(200)`
- `database/migrations/MIGRATION 025.sql:66` — `estrategia_detectada VARCHAR(200)`
- `frontend/lib/agents/newsletter/segment-specialist/segment-specialist-agent.ts:347-368` — upsert sem truncagem
- `frontend/lib/agents/newsletter/segment-specialist/segment-specialist-agent.ts:138` — `maxTokens: 4000` (BUG 12 fix)
- Browser report: `elapsed=76760ms` → as 2 chamadas Claude executaram com sucesso; falha é somente no save

## Impacto

`POST /api/agents/segment-specialist` retorna 500 para qualquer empresa cujos valores gerados ultrapassem 200 chars. O Insight Analyzer (`getSegmentKnowledge`) nunca recebe dados de segmento, pois o registro nunca é inserido no banco.

## Hipóteses Descartadas

- **RLS policy:** descartado — erro 22001 é de tipo/tamanho de coluna, não de permissão (seria 403/42501)
- **Bug no parseJSON:** descartado — BUG 11 já corrigido; JSON parseado corretamente, erro é no INSERT
- **maxTokens insuficiente:** descartado — BUG 12 já corrigido para 4000; o problema é o inverso (mais tokens = mais texto)
- **Problema de rede/timeout:** descartado — elapsed=76760ms indica execução completa das 2 chamadas Claude; falha é no save final
