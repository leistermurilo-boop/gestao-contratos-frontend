-- ============================================
-- MIGRATION 002: SCHEMA CONTRATOS E ITENS (CORRIGIDA)
-- ============================================

-- ============================================
-- TABELA: contratos
-- ============================================
CREATE TABLE contratos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vínculos (empresa_id redundante para RLS performance)
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    cnpj_id UUID NOT NULL REFERENCES cnpjs(id),
    
    -- Dados do contrato
    numero_contrato VARCHAR(100) NOT NULL,
    orgao_publico VARCHAR(255) NOT NULL,
    cnpj_orgao VARCHAR(14),
    esfera VARCHAR(20) CHECK (esfera IN ('municipal', 'estadual', 'federal')),
    
    -- Objeto e descrição
    objeto TEXT,
    
    -- Valores e datas
    valor_total DECIMAL(15,2) NOT NULL CHECK (valor_total > 0),
    data_assinatura DATE NOT NULL,
    data_vigencia_inicio DATE NOT NULL,
    data_vigencia_fim DATE NOT NULL,
    
    -- Prorrogação
    prorrogado BOOLEAN DEFAULT FALSE,
    data_vigencia_fim_prorrogacao DATE,
    
    -- Índice de reajuste
    indice_reajuste VARCHAR(50), -- IPCA, IGPM, INEP, etc
    
    -- Status
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN (
        'ativo', 'concluido', 'rescindido', 'suspenso', 'arquivado'
    )),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints simples (sem subquery)
    CONSTRAINT contratos_datas_validas CHECK (data_vigencia_inicio <= data_vigencia_fim),
    CONSTRAINT contratos_numero_unique UNIQUE(empresa_id, numero_contrato)
);

-- Índices estratégicos
CREATE INDEX idx_contratos_empresa_status ON contratos(empresa_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contratos_vencimento ON contratos(data_vigencia_fim) 
    WHERE status = 'ativo' AND deleted_at IS NULL;
CREATE INDEX idx_contratos_prorrogacao ON contratos(data_vigencia_fim_prorrogacao) 
    WHERE prorrogado = TRUE;

-- ============================================
-- TRIGGER: Validar se CNPJ pertence à empresa
-- ============================================
CREATE OR REPLACE FUNCTION validar_cnpj_empresa()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM cnpjs 
        WHERE id = NEW.cnpj_id 
        AND empresa_id = NEW.empresa_id
    ) THEN
        RAISE EXCEPTION 'CNPJ % não pertence à empresa %', NEW.cnpj_id, NEW.empresa_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_cnpj_contrato
    BEFORE INSERT OR UPDATE OF cnpj_id, empresa_id ON contratos
    FOR EACH ROW EXECUTE FUNCTION validar_cnpj_empresa();

-- ============================================
-- TABELA: itens_contrato
-- ============================================
CREATE TABLE itens_contrato (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vínculos (empresa_id redundante para RLS)
    contrato_id UUID NOT NULL REFERENCES contratos(id),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    cnpj_id UUID NOT NULL REFERENCES cnpjs(id), -- Facilita filtros por filial
    
    -- Dados do item
    numero_item INTEGER NOT NULL,
    descricao TEXT NOT NULL,
    unidade_medida VARCHAR(50),
    
    -- Quantidades
    quantidade DECIMAL(12,2) NOT NULL CHECK (quantidade > 0),
    quantidade_entregue DECIMAL(12,2) DEFAULT 0 CHECK (quantidade_entregue >= 0),
    
    -- Valores (valores do contrato, não custos!)
    valor_unitario DECIMAL(12,2) NOT NULL CHECK (valor_unitario > 0),
    valor_total DECIMAL(15,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
    
    -- Saldo calculado
    saldo_quantidade DECIMAL(12,2) GENERATED ALWAYS AS (quantidade - quantidade_entregue) STORED,
    
    -- Custos (último lançado - atualizado via trigger)
    ultimo_custo_unitario DECIMAL(12,2),
    custo_medio_ponderado DECIMAL(12,2),
    
    -- Margem calculada (baseada no último custo)
    margem_atual DECIMAL(5,2), -- Percentual
    
    -- Alerta
    margem_alerta_disparado BOOLEAN DEFAULT FALSE,
    
    -- Soft delete (cascade com contrato, mas mantemos registro)
    deleted_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints simples
    CONSTRAINT itens_numero_unique UNIQUE(contrato_id, numero_item),
    CONSTRAINT itens_quantidade_valida CHECK (quantidade_entregue <= quantidade)
);

-- Índices críticos para performance
CREATE INDEX idx_itens_contrato_empresa ON itens_contrato(empresa_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_itens_saldo ON itens_contrato(contrato_id, saldo_quantidade) WHERE saldo_quantidade > 0;
CREATE INDEX idx_itens_margem_alerta ON itens_contrato(empresa_id, margem_alerta_disparado) 
    WHERE margem_alerta_disparado = TRUE;

-- ============================================
-- TRIGGER: Validar consistência de vínculos do item
-- ============================================
CREATE OR REPLACE FUNCTION validar_item_contrato()
RETURNS TRIGGER AS $$
DECLARE
    v_contrato_empresa_id UUID;
    v_contrato_cnpj_id UUID;
BEGIN
    -- Buscar dados do contrato
    SELECT empresa_id, cnpj_id 
    INTO v_contrato_empresa_id, v_contrato_cnpj_id
    FROM contratos 
    WHERE id = NEW.contrato_id;
    
    -- Validar empresa_id
    IF NEW.empresa_id != v_contrato_empresa_id THEN
        RAISE EXCEPTION 'empresa_id do item (%) não corresponde ao contrato (%)', 
            NEW.empresa_id, v_contrato_empresa_id;
    END IF;
    
    -- Validar cnpj_id
    IF NEW.cnpj_id != v_contrato_cnpj_id THEN
        RAISE EXCEPTION 'cnpj_id do item (%) não corresponde ao contrato (%)', 
            NEW.cnpj_id, v_contrato_cnpj_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_item_contrato
    BEFORE INSERT OR UPDATE OF contrato_id, empresa_id, cnpj_id ON itens_contrato
    FOR EACH ROW EXECUTE FUNCTION validar_item_contrato();

-- ============================================
-- TRIGGER: Atualizar margem quando custo muda
-- ============================================
CREATE OR REPLACE FUNCTION atualizar_margem_item()
RETURNS TRIGGER AS $$
DECLARE
    v_margem DECIMAL(5,2);
    v_margem_alerta DECIMAL(5,2);
BEGIN
    -- Calcular margem: (valor - custo) / valor * 100
    IF NEW.ultimo_custo_unitario IS NOT NULL AND NEW.ultimo_custo_unitario > 0 THEN
        v_margem := ((NEW.valor_unitario - NEW.ultimo_custo_unitario) / NEW.valor_unitario) * 100;
        
        -- Verificar alerta
        SELECT (config_json->>'margem_alerta')::DECIMAL INTO v_margem_alerta
        FROM empresas WHERE id = NEW.empresa_id;
        
        NEW.margem_atual := v_margem;
        NEW.margem_alerta_disparado := (v_margem < COALESCE(v_margem_alerta, 10.0));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_margem 
    BEFORE INSERT OR UPDATE OF ultimo_custo_unitario ON itens_contrato
    FOR EACH ROW EXECUTE FUNCTION atualizar_margem_item();