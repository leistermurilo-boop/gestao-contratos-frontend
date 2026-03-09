-- ============================================
-- MIGRATION 020: Fix definitivo RLS soft delete
-- ============================================
-- PROBLEMA: Migration 018 tentou CREATE POLICY sem DROP IF EXISTS dos nomes
-- já existentes da Migration 007 (contratos_select, contratos_update,
-- itens_select, itens_update). Se 007 havia sido aplicada antes, 018 falhou
-- silenciosamente mantendo as políticas antigas com AND deleted_at IS NULL
-- no USING do UPDATE — o que pode bloquear o soft delete em edge cases.
--
-- SOLUÇÃO: DROP explícito de TODOS os nomes possíveis (007/008/009/018/019)
-- e recriação limpa e definitiva das políticas.
--
-- REGRA: UPDATE não filtra deleted_at no USING — permite setar deleted_at.
--        SELECT filtra deleted_at IS NULL — esconde registros arquivados.
-- Data: 2026-03-10

-- ============================================
-- CONTRATOS
-- ============================================

-- Drop todos os nomes possíveis de políticas anteriores
DROP POLICY IF EXISTS contratos_isolamento      ON contratos;
DROP POLICY IF EXISTS contratos_insert_check    ON contratos;
DROP POLICY IF EXISTS contratos_select          ON contratos;
DROP POLICY IF EXISTS contratos_insert          ON contratos;
DROP POLICY IF EXISTS contratos_update          ON contratos;
DROP POLICY IF EXISTS contratos_delete          ON contratos;

-- SELECT: filtra registros deletados
CREATE POLICY contratos_select ON contratos
    FOR SELECT
    USING (empresa_id = get_user_empresa_id() AND deleted_at IS NULL);

-- INSERT: apenas isolamento por empresa
CREATE POLICY contratos_insert ON contratos
    FOR INSERT
    WITH CHECK (empresa_id = get_user_empresa_id());

-- UPDATE: SEM filtro deleted_at — necessário para o soft delete funcionar
-- (setar deleted_at = NOW() em um registro que ainda tem deleted_at = NULL)
CREATE POLICY contratos_update ON contratos
    FOR UPDATE
    USING (empresa_id = get_user_empresa_id());

-- DELETE físico bloqueado por ausência de policy DELETE (mais seguro)
-- Soft delete é feito via UPDATE (contratos_update acima)

-- ============================================
-- ITENS_CONTRATO
-- ============================================

-- Garantir RLS habilitado (Migration 019 habilitou, mas garantimos idempotência)
ALTER TABLE itens_contrato ENABLE ROW LEVEL SECURITY;

-- Drop todos os nomes possíveis de políticas anteriores
DROP POLICY IF EXISTS itens_isolamento          ON itens_contrato;
DROP POLICY IF EXISTS itens_insert_check        ON itens_contrato;
DROP POLICY IF EXISTS itens_select              ON itens_contrato;
DROP POLICY IF EXISTS itens_insert              ON itens_contrato;
DROP POLICY IF EXISTS itens_update              ON itens_contrato;
DROP POLICY IF EXISTS itens_delete              ON itens_contrato;

-- SELECT: filtra registros deletados
CREATE POLICY itens_select ON itens_contrato
    FOR SELECT
    USING (empresa_id = get_user_empresa_id() AND deleted_at IS NULL);

-- INSERT: apenas isolamento por empresa
CREATE POLICY itens_insert ON itens_contrato
    FOR INSERT
    WITH CHECK (empresa_id = get_user_empresa_id());

-- UPDATE: SEM filtro deleted_at — necessário para o soft delete funcionar
CREATE POLICY itens_update ON itens_contrato
    FOR UPDATE
    USING (empresa_id = get_user_empresa_id());

-- DELETE físico bloqueado por ausência de policy DELETE (mais seguro)

-- ============================================
-- VERIFICAÇÃO (rodar após aplicar para confirmar)
-- ============================================
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('contratos', 'itens_contrato')
-- ORDER BY tablename, policyname;
