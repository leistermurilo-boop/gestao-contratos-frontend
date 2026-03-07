-- ============================================
-- MIGRATION 018: Fix RLS soft-delete policies
-- ============================================
-- PROBLEMA: As policies FOR ALL com USING (deleted_at IS NULL) também aplicam
-- o filtro como WITH CHECK nos UPDATEs. Ao setar deleted_at = NOW() o registro
-- passa a ter deleted_at IS NOT NULL e viola a própria policy — bloqueando o
-- soft-delete.
--
-- SOLUÇÃO: Separar em policies distintas por operação.
-- SELECT: filtra deleted_at IS NULL (esconde registros deletados)
-- INSERT/UPDATE/DELETE: apenas isolamento por empresa, sem filtro de deleted_at

-- ============================================
-- CONTRATOS
-- ============================================

DROP POLICY IF EXISTS contratos_isolamento ON contratos;
DROP POLICY IF EXISTS contratos_insert_check ON contratos;

CREATE POLICY contratos_select ON contratos
    FOR SELECT
    USING (empresa_id = get_user_empresa_id() AND deleted_at IS NULL);

CREATE POLICY contratos_insert ON contratos
    FOR INSERT
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY contratos_update ON contratos
    FOR UPDATE
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY contratos_delete ON contratos
    FOR DELETE
    USING (empresa_id = get_user_empresa_id());

-- ============================================
-- ITENS_CONTRATO
-- ============================================

DROP POLICY IF EXISTS itens_isolamento ON itens_contrato;
DROP POLICY IF EXISTS itens_insert_check ON itens_contrato;

CREATE POLICY itens_select ON itens_contrato
    FOR SELECT
    USING (empresa_id = get_user_empresa_id() AND deleted_at IS NULL);

CREATE POLICY itens_insert ON itens_contrato
    FOR INSERT
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY itens_update ON itens_contrato
    FOR UPDATE
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY itens_delete ON itens_contrato
    FOR DELETE
    USING (empresa_id = get_user_empresa_id());
