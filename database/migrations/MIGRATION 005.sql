-- ============================================
-- MIGRATION 005: RLS POLICIES (CORRIGIDA)
-- ============================================
-- Solução: Funções no schema público com SECURITY DEFINER

-- ============================================
-- FUNÇÕES AUXILIARES PARA RLS (Schema Público)
-- ============================================

-- Função: Obter ID do usuário autenticado
CREATE OR REPLACE FUNCTION get_auth_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT auth.uid();
$$;

-- Função: Verificar se usuário pertence à empresa
CREATE OR REPLACE FUNCTION user_belongs_to_empresa(p_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = get_auth_user_id() 
        AND empresa_id = p_empresa_id 
        AND ativo = TRUE
    );
END;
$$;

-- Função: Obter empresa_id do usuário logado
CREATE OR REPLACE FUNCTION get_user_empresa_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_empresa_id UUID;
BEGIN
    SELECT empresa_id INTO v_empresa_id 
    FROM usuarios 
    WHERE id = get_auth_user_id() 
    AND ativo = TRUE;
    
    RETURN v_empresa_id;
END;
$$;

-- Função: Verificar perfil do usuário
CREATE OR REPLACE FUNCTION get_user_perfil()
RETURNS VARCHAR
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_perfil VARCHAR(20);
BEGIN
    SELECT perfil INTO v_perfil 
    FROM usuarios 
    WHERE id = get_auth_user_id() 
    AND ativo = TRUE;
    
    RETURN v_perfil;
END;
$$;

-- ============================================
-- EMPRESAS (Apenas usuários ativos da própria empresa)
-- ============================================
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY empresas_isolamento ON empresas
    FOR ALL
    USING (user_belongs_to_empresa(id));

-- ============================================
-- CNPJs (Apenas da empresa do usuário)
-- ============================================
ALTER TABLE cnpjs ENABLE ROW LEVEL SECURITY;

CREATE POLICY cnpjs_isolamento ON cnpjs
    FOR ALL
    USING (empresa_id = get_user_empresa_id());

-- ============================================
-- USUARIOS (Apenas da mesma empresa)
-- ============================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política principal: ver apenas usuários da mesma empresa
CREATE POLICY usuarios_isolamento ON usuarios
    FOR ALL
    USING (empresa_id = get_user_empresa_id());

-- Política especial: usuário pode ver seu próprio registro (mesmo se inativo)
CREATE POLICY usuarios_self_view ON usuarios
    FOR SELECT
    USING (id = get_auth_user_id());

-- ============================================
-- CONTRATOS (Isolamento + Soft Delete)
-- ============================================
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY contratos_isolamento ON contratos
    FOR ALL
    USING (
        empresa_id = get_user_empresa_id() 
        AND deleted_at IS NULL
    );

-- ============================================
-- ITENS_CONTRATO (Isolamento)
-- ============================================
ALTER TABLE itens_contrato ENABLE ROW LEVEL SECURITY;

CREATE POLICY itens_isolamento ON itens_contrato
    FOR ALL
    USING (
        empresa_id = get_user_empresa_id() 
        AND deleted_at IS NULL
    );

-- ============================================
-- CUSTOS_ITEM (Isolamento + Restrição por perfil)
-- ============================================
ALTER TABLE custos_item ENABLE ROW LEVEL SECURITY;

-- Política padrão: isolamento por empresa
CREATE POLICY custos_isolamento ON custos_item
    FOR ALL
    USING (empresa_id = get_user_empresa_id());

-- Restrição adicional: Logística NÃO pode ver custos (apenas SELECT)
CREATE POLICY custos_restricao_logistica ON custos_item
    FOR SELECT
    USING (
        empresa_id = get_user_empresa_id()
        AND get_user_perfil() IN ('admin', 'juridico', 'financeiro', 'compras')
    );

-- ============================================
-- AF E ENTREGAS (Isolamento)
-- ============================================
ALTER TABLE autorizacoes_fornecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;

CREATE POLICY af_isolamento ON autorizacoes_fornecimento
    FOR ALL
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY entregas_isolamento ON entregas
    FOR ALL
    USING (empresa_id = get_user_empresa_id());

-- ============================================
-- REAJUSTES E AUDITORIA (Isolamento)
-- ============================================
ALTER TABLE reajustes ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY reajustes_isolamento ON reajustes
    FOR ALL
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY auditoria_isolamento ON auditoria
    FOR ALL
    USING (empresa_id = get_user_empresa_id());

-- ============================================
-- POLÍTICAS DE INSERT (Prevenir falsificação de empresa_id)
-- ============================================

-- Política extra: ao inserir, empresa_id DEVE ser a do usuário logado
CREATE POLICY contratos_insert_check ON contratos
    FOR INSERT
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY itens_insert_check ON itens_contrato
    FOR INSERT
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY custos_insert_check ON custos_item
    FOR INSERT
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY af_insert_check ON autorizacoes_fornecimento
    FOR INSERT
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY entregas_insert_check ON entregas
    FOR INSERT
    WITH CHECK (empresa_id = get_user_empresa_id());

-- ============================================
-- PERMISSÕES PARA FUNÇÕES
-- ============================================

-- Grant execute para usuários autenticados
GRANT EXECUTE ON FUNCTION get_auth_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION user_belongs_to_empresa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_empresa_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_perfil() TO authenticated;