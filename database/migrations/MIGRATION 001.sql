-- ============================================
-- MIGRATION 001: SCHEMA CORE (Empresas, CNPJs, Usuários)
-- ============================================
-- Objetivo: Estrutura multi-tenant com soft delete e auditoria

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABELA: empresas (TENANT)
-- ============================================
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Dados cadastrais
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    
    -- Controle de plano e status
    plano VARCHAR(20) DEFAULT 'pro' CHECK (plano IN ('free', 'pro', 'enterprise')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
    
    -- Configurações JSON (flexível para expansão)
    config_json JSONB DEFAULT '{
        "margem_alerta": 10.0,
        "dias_alerta_vencimento": [90, 60, 30],
        "tema": "light"
    }'::jsonb,
    
    -- Timestamps e controle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ, -- Soft delete da empresa (cancelamento assinatura)
    deleted_at TIMESTAMPTZ,  -- Soft delete administrativo
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT empresas_razao_social_not_empty CHECK (length(trim(razao_social)) > 0)
);

-- Índices
CREATE INDEX idx_empresas_status ON empresas(status) WHERE status = 'active';
CREATE INDEX idx_empresas_archived ON empresas(archived_at) WHERE archived_at IS NOT NULL;

-- ============================================
-- TABELA: cnpjs (Vínculo com Tenant)
-- ============================================
CREATE TABLE cnpjs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vínculo
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    
    -- Dados do CNPJ
    cnpj_numero VARCHAR(14) NOT NULL,
    tipo VARCHAR(10) DEFAULT 'matriz' CHECK (tipo IN ('matriz', 'filial')),
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    
    -- Endereço (simplificado, pode expandir)
    cidade VARCHAR(100),
    estado CHAR(2),
    
    -- Controle
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT cnpjs_numero_unique UNIQUE(cnpj_numero),
    CONSTRAINT cnpjs_numero_format CHECK (length(cnpj_numero) = 14 AND cnpj_numero ~ '^\d{14}$')
);

-- Índices
CREATE INDEX idx_cnpjs_empresa ON cnpjs(empresa_id) WHERE ativo = TRUE;

-- ============================================
-- TABELA: usuarios (Perfil por Empresa)
-- ============================================
-- NOTA: ID vem do auth.users do Supabase
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Vínculo
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    
    -- Dados pessoais
    email VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    
    -- Permissão
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN (
        'admin', 'juridico', 'financeiro', 'compras', 'logistica'
    )),
    
    -- Controle
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_acesso TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id), -- Quem convidou
    
    -- Constraints
    CONSTRAINT usuarios_email_unique UNIQUE(email)
);

-- Índices
CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id, ativo) WHERE ativo = TRUE;
CREATE INDEX idx_usuarios_perfil ON usuarios(perfil);

-- ============================================
-- TRIGGER: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cnpjs_updated_at BEFORE UPDATE ON cnpjs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();