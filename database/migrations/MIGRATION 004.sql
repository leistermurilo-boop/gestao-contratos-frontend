-- ============================================
-- MIGRATION 004: AUDITORIA E REAJUSTES
-- ============================================

-- ============================================
-- TABELA: reajustes (Reequilíbrio Econômico-Financeiro)
-- ============================================
CREATE TABLE reajustes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vínculos
    contrato_id UUID NOT NULL REFERENCES contratos(id),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    
    -- Tipo
    tipo VARCHAR(20) CHECK (tipo IN ('ipca', 'igpm', 'inep', 'reequilibrio', 'outro')),
    
    -- Valores
    percentual DECIMAL(8,4) NOT NULL,
    valor_ajuste DECIMAL(15,2),
    
    -- Período
    data_inicio_vigencia DATE NOT NULL,
    data_fim_vigencia DATE,
    
    -- Status do processo
    status VARCHAR(20) DEFAULT 'solicitado' CHECK (status IN (
        'solicitado', 'analise', 'aprovado', 'rejeitado', 'implementado'
    )),
    
    -- Documentação
    documentacao_url TEXT,
    parecer_juridico TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ
);

CREATE INDEX idx_reajustes_contrato ON reajustes(contrato_id, created_at DESC);
CREATE INDEX idx_reajustes_status ON reajustes(empresa_id, status) WHERE status IN ('solicitado', 'analise');

-- ============================================
-- TABELA: auditoria (LGPD Compliance)
-- ============================================
CREATE TABLE auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Contexto
    empresa_id UUID REFERENCES empresas(id),
    tabela VARCHAR(100) NOT NULL,
    registro_id UUID NOT NULL,
    acao VARCHAR(20) NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE')),
    
    -- Dados
    dados_anteriores JSONB,
    dados_novos JSONB,
    
    -- Metadados
    usuario_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas de auditoria (LGPD)
CREATE INDEX idx_auditoria_empresa ON auditoria(empresa_id, tabela, created_at DESC);
CREATE INDEX idx_auditoria_registro ON auditoria(tabela, registro_id);

-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_empresa_id UUID;
    v_old_data JSONB;
    v_new_data JSONB;
BEGIN
    -- Tentar extrair empresa_id dos dados
    IF TG_OP = 'DELETE' THEN
        v_empresa_id := OLD.empresa_id;
        v_old_data := to_jsonb(OLD);
        v_new_data := null;
    ELSIF TG_OP = 'INSERT' THEN
        v_empresa_id := NEW.empresa_id;
        v_old_data := null;
        v_new_data := to_jsonb(NEW);
    ELSE -- UPDATE
        v_empresa_id := NEW.empresa_id;
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    END IF;
    
    INSERT INTO auditoria (
        empresa_id, tabela, registro_id, acao,
        dados_anteriores, dados_novos, usuario_id, ip_address
    ) VALUES (
        v_empresa_id,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        v_old_data,
        v_new_data,
        auth.uid(),
        inet_client_addr()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;