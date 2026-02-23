-- MIGRATION 009: Injeção automática de empresa_id + Correção da policy contratos_select
-- Problema 1: INSERT falhava com "CNPJ não pertence à empresa NULL" porque empresa_id
--             não era injetado automaticamente — RLS só valida, não injeta.
-- Problema 2: Policy contratos_select usava empresa_esta_ativa() que verifica
--             status IN ('active', 'trial'), mas 'trial' não existe no enum de empresas,
--             causando erro 400 em todo SELECT de contratos.

-- ============================================================
-- PARTE 1: Função + triggers para auto-injetar empresa_id
-- ============================================================

-- Função: lê empresa_id do usuário logado via get_user_empresa_id()
-- e injeta em NEW.empresa_id antes do INSERT se estiver NULL.
-- Nomeada "a_inject_..." para garantir execução ANTES dos triggers de validação.
CREATE OR REPLACE FUNCTION inject_empresa_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.empresa_id IS NULL THEN
        NEW.empresa_id := get_user_empresa_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger em contratos
DROP TRIGGER IF EXISTS a_inject_empresa_id ON contratos;
CREATE TRIGGER a_inject_empresa_id
    BEFORE INSERT ON contratos
    FOR EACH ROW EXECUTE FUNCTION inject_empresa_id();

-- Trigger em itens_contrato
DROP TRIGGER IF EXISTS a_inject_empresa_id ON itens_contrato;
CREATE TRIGGER a_inject_empresa_id
    BEFORE INSERT ON itens_contrato
    FOR EACH ROW EXECUTE FUNCTION inject_empresa_id();

-- Trigger em custos_item
DROP TRIGGER IF EXISTS a_inject_empresa_id ON custos_item;
CREATE TRIGGER a_inject_empresa_id
    BEFORE INSERT ON custos_item
    FOR EACH ROW EXECUTE FUNCTION inject_empresa_id();

-- Trigger em autorizacoes_fornecimento
DROP TRIGGER IF EXISTS a_inject_empresa_id ON autorizacoes_fornecimento;
CREATE TRIGGER a_inject_empresa_id
    BEFORE INSERT ON autorizacoes_fornecimento
    FOR EACH ROW EXECUTE FUNCTION inject_empresa_id();

-- Trigger em entregas
DROP TRIGGER IF EXISTS a_inject_empresa_id ON entregas;
CREATE TRIGGER a_inject_empresa_id
    BEFORE INSERT ON entregas
    FOR EACH ROW EXECUTE FUNCTION inject_empresa_id();

-- Trigger em reajustes
DROP TRIGGER IF EXISTS a_inject_empresa_id ON reajustes;
CREATE TRIGGER a_inject_empresa_id
    BEFORE INSERT ON reajustes
    FOR EACH ROW EXECUTE FUNCTION inject_empresa_id();

-- ============================================================
-- PARTE 2: Corrigir policy contratos_select (Migration 008 bug)
-- empresa_esta_ativa() checava 'trial' que não existe no enum,
-- causando 400 em todos os SELECTs de contratos.
-- ============================================================

DROP POLICY IF EXISTS contratos_select ON contratos;
CREATE POLICY contratos_select ON contratos
    FOR SELECT
    USING (
        empresa_id = get_user_empresa_id()
        AND deleted_at IS NULL
    );

-- ============================================================
-- PARTE 3: Coluna anexo_url em contratos (se não existir)
-- Necessária para upload de documento no formulário de contrato.
-- ============================================================

ALTER TABLE contratos
    ADD COLUMN IF NOT EXISTS anexo_url TEXT;
