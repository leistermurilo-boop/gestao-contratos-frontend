# Fix Plan — BUG 13 (2026-03-15)

**Bug:** VARCHAR(200) overflow em empresa_segment_knowledge
**Causa Raiz:** 3 colunas `VARCHAR(200)` recebem strings > 200 chars geradas pelo Claude com maxTokens 4000
**Solução Técnica:** Alterar as 3 colunas para `TEXT` via nova migration MIGRATION 026.sql. `TEXT` em Postgres não tem limite prático de tamanho e é mais apropriado para valores gerados por LLM.

## Arquivos Afetados

- `database/migrations/MIGRATION 026.sql` — CRIAR

## Migrations Necessárias

Sim — MIGRATION 026.sql:

```sql
ALTER TABLE empresa_segment_knowledge
  ALTER COLUMN segmento_primario TYPE TEXT,
  ALTER COLUMN modelo_negocio_inferido TYPE TEXT,
  ALTER COLUMN estrategia_detectada TYPE TEXT;
```

**Aplicação:** Supabase SQL Editor (acesso manual pelo usuário)

## Riscos

Nenhum. `TEXT` é compatível com `VARCHAR` em Postgres:
- Sem perda de dados nos registros existentes
- O índice `idx_segment_knowledge_segmento ON empresa_segment_knowledge(segmento_primario)` funciona normalmente com TEXT
- Nenhum código TypeScript precisa mudar — os campos já são tipados como `string`

**Aprovado:** @architect
