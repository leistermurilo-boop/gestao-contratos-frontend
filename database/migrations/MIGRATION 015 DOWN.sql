-- MIGRATION 015 DOWN: Reverter planos e Índice de Maturidade DUO™

-- 1. Remover FK e colunas de empresas
ALTER TABLE empresas
  DROP CONSTRAINT IF EXISTS empresas_nivel_maturidade_fkey;

ALTER TABLE empresas
  DROP COLUMN IF EXISTS plano_id,
  DROP COLUMN IF EXISTS nivel_maturidade,
  DROP COLUMN IF EXISTS pontuacao_maturidade;

-- 2. Remover RLS policies
DROP POLICY IF EXISTS "planos_select_authenticated" ON planos;
DROP POLICY IF EXISTS "niveis_maturidade_select_authenticated" ON niveis_maturidade;

-- 3. Remover tabelas (ordem inversa de dependência)
DROP TABLE IF EXISTS niveis_maturidade;
DROP TABLE IF EXISTS planos;
