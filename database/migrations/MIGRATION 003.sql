-- ============================================
-- MIGRATION 003: SCHEMA OPERACIONAL (CORRIGIDA)
-- ============================================

-- ============================================
-- TABELA: custos_item (HISTÓRICO COMPLETO)
-- ============================================
CREATE TABLE custos_item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vínculos
    item_contrato_id UUID NOT NULL REFERENCES itens_contrato(id),
    contrato_id UUID NOT NULL REFERENCES contratos(id),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    
    -- Dados do custo
    data_custo DATE NOT NULL DEFAULT CURRENT_DATE,
    custo_unitario DECIMAL(12,2) NOT NULL CHECK (custo_unitario > 0),
    quantidade_comprada DECIMAL(12,2) NOT NULL CHECK (quantidade_comprada > 0),
    
    -- Origem do custo
    origem VARCHAR(20) DEFAULT 'manual' CHECK (origem IN ('manual', 'nf_entrada', 'estimativa')),
    
    -- Dados da NF (quando houver)
    fornecedor VARCHAR(255),
    nota_fiscal VARCHAR(100),
    nf_entrada_url TEXT, -- Link no Storage
    
    -- Observação
    observacao TEXT,
    
    -- Usuário que lançou
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
    
    -- Removido: CONSTRAINT com subquery
);

-- Índices
CREATE INDEX idx_custos_item_item ON custos_item(item_contrato_id, data_custo DESC);
CREATE INDEX idx_custos_item_empresa_data ON custos_item(empresa_id, data_custo DESC);

-- Trigger para validar unicidade de NF (quando não for null)
CREATE OR REPLACE FUNCTION validar_nf_unica()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nota_fiscal IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM custos_item 
            WHERE item_contrato_id = NEW.item_contrato_id 
            AND nota_fiscal = NEW.nota_fiscal
            AND id != NEW.id
        ) THEN
            RAISE EXCEPTION 'Nota fiscal % já existe para este item', NEW.nota_fiscal;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_nf_unica
    BEFORE INSERT OR UPDATE OF nota_fiscal ON custos_item
    FOR EACH ROW EXECUTE FUNCTION validar_nf_unica();

-- Trigger: Ao inserir custo, atualizar item_contrato e recalcular CMP
CREATE OR REPLACE FUNCTION processar_novo_custo()
RETURNS TRIGGER AS $$
DECLARE
    v_custo_medio DECIMAL(12,2);
    v_quantidade_total DECIMAL(12,2);
BEGIN
    -- Atualizar último custo no item
    UPDATE itens_contrato 
    SET ultimo_custo_unitario = NEW.custo_unitario,
        updated_at = NOW()
    WHERE id = NEW.item_contrato_id;
    
    -- Calcular Custo Médio Ponderado
    SELECT 
        COALESCE(SUM(custo_unitario * quantidade_comprada) / NULLIF(SUM(quantidade_comprada), 0), 0),
        SUM(quantidade_comprada)
    INTO v_custo_medio, v_quantidade_total
    FROM custos_item
    WHERE item_contrato_id = NEW.item_contrato_id;
    
    UPDATE itens_contrato 
    SET custo_medio_ponderado = v_custo_medio
    WHERE id = NEW.item_contrato_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_processar_custo 
    AFTER INSERT ON custos_item
    FOR EACH ROW EXECUTE FUNCTION processar_novo_custo();

-- ============================================
-- TABELA: autorizacoes_fornecimento (AF)
-- ============================================
CREATE TABLE autorizacoes_fornecimento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vínculos
    contrato_id UUID NOT NULL REFERENCES contratos(id),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    cnpj_id UUID NOT NULL REFERENCES cnpjs(id),
    
    -- Dados da AF
    numero_af VARCHAR(100) NOT NULL,
    data_emissao DATE NOT NULL,
    data_prevista_entrega DATE,
    
    -- Item vinculado (uma AF pode ter múltiplos itens no futuro, mas v1 = 1 item)
    item_contrato_id UUID NOT NULL REFERENCES itens_contrato(id),
    
    -- Quantidades
    quantidade_autorizada DECIMAL(12,2) NOT NULL CHECK (quantidade_autorizada > 0),
    quantidade_entregue DECIMAL(12,2) DEFAULT 0 CHECK (quantidade_entregue >= 0),
    saldo_af DECIMAL(12,2) GENERATED ALWAYS AS (quantidade_autorizada - quantidade_entregue) STORED,
    
    -- Valor estimado (para projeção financeira)
    valor_estimado DECIMAL(15,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN (
        'pendente', 'parcial', 'concluida', 'cancelada'
    )),
    
    -- Anexo
    anexo_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
    
    -- Removido: CHECK constraint com subquery
);

-- Índices
CREATE INDEX idx_af_empresa_status ON autorizacoes_fornecimento(empresa_id, status);
CREATE INDEX idx_af_contrato ON autorizacoes_fornecimento(contrato_id, data_emissao DESC);
CREATE INDEX idx_af_saldo ON autorizacoes_fornecimento(item_contrato_id, saldo_af) WHERE saldo_af > 0;

-- Trigger para validar saldo da AF contra saldo do item
CREATE OR REPLACE FUNCTION validar_saldo_af()
RETURNS TRIGGER AS $$
DECLARE
    v_saldo_item DECIMAL(12,2);
    v_saldo_ja_reservado DECIMAL(12,2);
BEGIN
    -- Calcular saldo disponível (total - entregue - reservado em outras AFs pendentes)
    SELECT saldo_quantidade INTO v_saldo_item
    FROM itens_contrato WHERE id = NEW.item_contrato_id;
    
    SELECT COALESCE(SUM(quantidade_autorizada - quantidade_entregue), 0)
    INTO v_saldo_ja_reservado
    FROM autorizacoes_fornecimento
    WHERE item_contrato_id = NEW.item_contrato_id
    AND status IN ('pendente', 'parcial')
    AND id != NEW.id; -- Excluir a própria AF em caso de UPDATE
    
    IF (NEW.quantidade_autorizada - NEW.quantidade_entregue) > (v_saldo_item - v_saldo_ja_reservado) THEN
        RAISE EXCEPTION 'Saldo insuficiente. Disponível: %, Solicitado: %', 
            (v_saldo_item - v_saldo_ja_reservado), 
            (NEW.quantidade_autorizada - NEW.quantidade_entregue);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_saldo_af
    BEFORE INSERT OR UPDATE ON autorizacoes_fornecimento
    FOR EACH ROW EXECUTE FUNCTION validar_saldo_af();

-- ============================================
-- TABELA: entregas (Baixa de Saldo)
-- ============================================
CREATE TABLE entregas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vínculos
    af_id UUID NOT NULL REFERENCES autorizacoes_fornecimento(id),
    item_contrato_id UUID NOT NULL REFERENCES itens_contrato(id),
    contrato_id UUID NOT NULL REFERENCES contratos(id),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    
    -- Dados da entrega
    data_entrega DATE NOT NULL DEFAULT CURRENT_DATE,
    quantidade_entregue DECIMAL(12,2) NOT NULL CHECK (quantidade_entregue > 0),
    
    -- Nota Fiscal de Saída
    nota_fiscal_saida VARCHAR(100),
    anexo_nf_url TEXT,
    
    -- Observação
    observacao TEXT,
    
    -- Usuário
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
    
    -- Removido: CHECK constraint com subquery
);

-- Índices
CREATE INDEX idx_entregas_af ON entregas(af_id, data_entrega DESC);
CREATE INDEX idx_entregas_empresa ON entregas(empresa_id, data_entrega DESC);

-- Trigger: Validar saldo da AF antes de entregar
CREATE OR REPLACE FUNCTION validar_entrega()
RETURNS TRIGGER AS $$
DECLARE
    v_saldo_af DECIMAL(12,2);
BEGIN
    SELECT saldo_af INTO v_saldo_af
    FROM autorizacoes_fornecimento
    WHERE id = NEW.af_id;
    
    IF NEW.quantidade_entregue > v_saldo_af THEN
        RAISE EXCEPTION 'Quantidade entregue (%) excede saldo da AF (%)', 
            NEW.quantidade_entregue, v_saldo_af;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_entrega
    BEFORE INSERT ON entregas
    FOR EACH ROW EXECUTE FUNCTION validar_entrega();

-- Trigger: Ao inserir entrega, atualizar saldos (AF e Item)
CREATE OR REPLACE FUNCTION processar_entrega()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar quantidade_entregue da AF
    UPDATE autorizacoes_fornecimento 
    SET quantidade_entregue = quantidade_entregue + NEW.quantidade_entregue,
        status = CASE 
            WHEN (quantidade_entregue + NEW.quantidade_entregue) >= quantidade_autorizada THEN 'concluida'
            ELSE 'parcial'
        END,
        updated_at = NOW()
    WHERE id = NEW.af_id;
    
    -- Atualizar quantidade_entregue do Item do Contrato
    UPDATE itens_contrato 
    SET quantidade_entregue = quantidade_entregue + NEW.quantidade_entregue,
        updated_at = NOW()
    WHERE id = NEW.item_contrato_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_processar_entrega 
    AFTER INSERT ON entregas
    FOR EACH ROW EXECUTE FUNCTION processar_entrega();