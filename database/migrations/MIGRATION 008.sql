-- 1. Função que verifica se empresa está ativa
CREATE OR REPLACE FUNCTION empresa_esta_ativa()
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM empresas
        WHERE id = get_user_empresa_id()
        AND status IN ('active', 'trial')
        AND (deleted_at IS NULL)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION empresa_esta_ativa() TO authenticated;

-- 2. Adicionar verificação de status nas policies principais
-- (empresas suspensas não acessam NADA)
-- Já funciona automaticamente via get_user_empresa_id() + usuarios.ativo
-- MAS para garantia extra, adicionar em contratos:
DROP POLICY IF EXISTS contratos_select ON contratos;
CREATE POLICY contratos_select ON contratos
    FOR SELECT
    USING (
        empresa_id = get_user_empresa_id()
        AND deleted_at IS NULL
        AND empresa_esta_ativa()
    );