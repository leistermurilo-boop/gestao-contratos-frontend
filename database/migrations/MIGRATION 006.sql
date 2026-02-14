-- ============================================
-- DIAGNÓSTICO E CORREÇÃO - Migration 006
-- ============================================
-- Execute este script para corrigir os problemas detectados

-- ============================================
-- PARTE 1: DIAGNÓSTICO
-- ============================================

-- 1. Verificar qual tabela NÃO tem RLS
SELECT 
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'empresas', 'cnpjs', 'usuarios', 'contratos', 'itens_contrato',
    'autorizacoes_fornecimento', 'entregas', 'custos_item', 'reajustes', 'auditoria'
)
ORDER BY tablename;

-- 2. Verificar triggers duplicados
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE 'audit_%'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- PARTE 2: CORREÇÃO - HABILITAR RLS NA TABELA FALTANTE
-- ============================================

-- Se a tabela 'auditoria' estiver sem RLS (provável), habilitar:
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Se for outra tabela, substitua 'auditoria' pelo nome correto acima

-- ============================================
-- PARTE 3: CORREÇÃO - REMOVER TRIGGERS DUPLICADOS
-- ============================================

-- Dropar todos os triggers de auditoria (vamos recriar depois)
DROP TRIGGER IF EXISTS audit_empresas ON empresas;
DROP TRIGGER IF EXISTS audit_cnpjs ON cnpjs;
DROP TRIGGER IF EXISTS audit_usuarios ON usuarios;
DROP TRIGGER IF EXISTS audit_contratos ON contratos;
DROP TRIGGER IF EXISTS audit_itens_contrato ON itens_contrato;
DROP TRIGGER IF EXISTS audit_autorizacoes_fornecimento ON autorizacoes_fornecimento;
DROP TRIGGER IF EXISTS audit_entregas ON entregas;
DROP TRIGGER IF EXISTS audit_custos_item ON custos_item;
DROP TRIGGER IF EXISTS audit_reajustes ON reajustes;

-- ============================================
-- PARTE 4: RECRIAR TRIGGERS DE AUDITORIA CORRETAMENTE
-- ============================================

-- Agora criar os triggers (garantido que não existem duplicatas)
CREATE TRIGGER audit_empresas
    AFTER INSERT OR UPDATE OR DELETE ON empresas
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_cnpjs
    AFTER INSERT OR UPDATE OR DELETE ON cnpjs
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_usuarios
    AFTER INSERT OR UPDATE OR DELETE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_contratos
    AFTER INSERT OR UPDATE OR DELETE ON contratos
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_itens_contrato
    AFTER INSERT OR UPDATE OR DELETE ON itens_contrato
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_autorizacoes_fornecimento
    AFTER INSERT OR UPDATE OR DELETE ON autorizacoes_fornecimento
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_entregas
    AFTER INSERT OR UPDATE OR DELETE ON entregas
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_custos_item
    AFTER INSERT OR UPDATE OR DELETE ON custos_item
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_reajustes
    AFTER INSERT OR UPDATE OR DELETE ON reajustes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================
-- PARTE 5: VERIFICAÇÃO FINAL
-- ============================================

-- Rodar health check novamente
SELECT * FROM system_health_check();

-- Verificar RLS em todas as tabelas (deve retornar 10 linhas com TRUE)
SELECT 
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'empresas', 'cnpjs', 'usuarios', 'contratos', 'itens_contrato',
    'autorizacoes_fornecimento', 'entregas', 'custos_item', 'reajustes', 'auditoria'
)
AND rowsecurity = TRUE
ORDER BY tablename;

-- Se retornar 10 linhas = OK!
-- Se retornar menos, verificar qual tabela está faltando

-- ============================================
-- PARTE 6: CRIAR POLICY PARA AUDITORIA (se ainda não existe)
-- ============================================

-- Se a tabela auditoria estava sem RLS, ela também precisa de policy
-- Verificar se já existe:
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'auditoria';

-- Se não retornar 'auditoria_isolamento', criar:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'auditoria' 
        AND policyname = 'auditoria_isolamento'
    ) THEN
        CREATE POLICY auditoria_isolamento ON auditoria
            FOR ALL
            USING (empresa_id = get_user_empresa_id());
    END IF;
END $$;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- Após executar este script, o health check deve retornar:
-- ✅ RLS Enabled: OK (10/10 tables with RLS enabled)
-- ✅ Audit Triggers: OK (9 audit triggers installed)
-- ✅ Performance Indexes: OK (43 indexes created)
-- ✅ RLS Functions: OK (4/4 RLS helper functions)