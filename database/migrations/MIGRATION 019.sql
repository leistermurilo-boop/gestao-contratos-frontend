-- MIGRATION 019
-- Adiciona deleted_at/deleted_by em contratos e itens_contrato
-- Habilita RLS em itens_contrato
-- Recria policies com filtro deleted_at IS NULL
-- Data: 2026-03-07

-- 1. Adicionar colunas de soft delete em contratos
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL;

-- 2. Adicionar coluna de soft delete em itens_contrato
ALTER TABLE itens_contrato ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Habilitar RLS em itens_contrato (estava desabilitado)
ALTER TABLE itens_contrato ENABLE ROW LEVEL SECURITY;

-- 4. Recriar policy SELECT de contratos com filtro deleted_at IS NULL
DROP POLICY IF EXISTS contratos_select ON contratos;
CREATE POLICY contratos_select ON contratos FOR SELECT
  USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
    AND deleted_at IS NULL
  );

-- 5. Recriar policy SELECT de itens_contrato com filtro deleted_at IS NULL
DROP POLICY IF EXISTS itens_select ON itens_contrato;
CREATE POLICY itens_select ON itens_contrato FOR SELECT
  USING (
    deleted_at IS NULL
    AND contrato_id IN (
      SELECT id FROM contratos
      WHERE empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
    )
  );
