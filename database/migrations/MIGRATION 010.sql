-- MIGRATION 010: Alinhamento de schema — DB ↔ database.types.ts
-- Problema: colunas no DB (Migrations 002-004) usam nomes diferentes
--           do que o frontend espera (database.types.ts).
-- Estratégia: renomear colunas no DB para corresponder ao types.ts,
--             + triggers de auto-fill para colunas NOT NULL não enviadas pelo frontend.
-- Triggers afetados também são atualizados nesta migration.

-- ============================================================
-- PARTE 1: itens_contrato
-- ============================================================

ALTER TABLE itens_contrato RENAME COLUMN unidade_medida     TO unidade;
ALTER TABLE itens_contrato RENAME COLUMN custo_medio_ponderado TO custo_medio;

-- numero_item era NOT NULL mas o form permite omissão
ALTER TABLE itens_contrato ALTER COLUMN numero_item DROP NOT NULL;

-- Atualizar processar_novo_custo (referenciava custo_medio_ponderado e quantidade_comprada)
CREATE OR REPLACE FUNCTION processar_novo_custo()
RETURNS TRIGGER AS $$
DECLARE
    v_custo_medio     DECIMAL(12,2);
    v_quantidade_total DECIMAL(12,2);
BEGIN
    -- Atualizar último custo no item
    UPDATE itens_contrato
    SET ultimo_custo_unitario = NEW.custo_unitario,
        updated_at = NOW()
    WHERE id = NEW.item_contrato_id;

    -- Calcular Custo Médio Ponderado com novo nome de coluna
    SELECT
        COALESCE(SUM(custo_unitario * quantidade) / NULLIF(SUM(quantidade), 0), 0),
        SUM(quantidade)
    INTO v_custo_medio, v_quantidade_total
    FROM custos_item
    WHERE item_contrato_id = NEW.item_contrato_id;

    UPDATE itens_contrato
    SET custo_medio = v_custo_medio
    WHERE id = NEW.item_contrato_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PARTE 2: custos_item
-- ============================================================

ALTER TABLE custos_item RENAME COLUMN data_custo         TO data_lancamento;
ALTER TABLE custos_item RENAME COLUMN quantidade_comprada TO quantidade;
ALTER TABLE custos_item RENAME COLUMN nota_fiscal         TO numero_nf;

-- contrato_id: frontend não envia — será preenchido por trigger
ALTER TABLE custos_item ALTER COLUMN contrato_id DROP NOT NULL;

-- Trigger: auto-fill usuario_id e contrato_id antes do INSERT
CREATE OR REPLACE FUNCTION fill_custo_refs()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.usuario_id IS NULL THEN
        NEW.usuario_id := auth.uid();
    END IF;
    IF NEW.contrato_id IS NULL THEN
        SELECT contrato_id INTO NEW.contrato_id
        FROM itens_contrato WHERE id = NEW.item_contrato_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS b_fill_custo_refs ON custos_item;
CREATE TRIGGER b_fill_custo_refs
    BEFORE INSERT ON custos_item
    FOR EACH ROW EXECUTE FUNCTION fill_custo_refs();

-- Atualizar validar_nf_unica (referenciava nota_fiscal)
CREATE OR REPLACE FUNCTION validar_nf_unica()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_nf IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM custos_item
            WHERE item_contrato_id = NEW.item_contrato_id
            AND   numero_nf = NEW.numero_nf
            AND   id != NEW.id
        ) THEN
            RAISE EXCEPTION 'Nota fiscal % já existe para este item', NEW.numero_nf;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger com novo nome de coluna
DROP TRIGGER IF EXISTS trigger_validar_nf_unica ON custos_item;
CREATE TRIGGER trigger_validar_nf_unica
    BEFORE INSERT OR UPDATE OF numero_nf ON custos_item
    FOR EACH ROW EXECUTE FUNCTION validar_nf_unica();

-- ============================================================
-- PARTE 3: autorizacoes_fornecimento
-- ============================================================

ALTER TABLE autorizacoes_fornecimento RENAME COLUMN item_contrato_id    TO item_id;
ALTER TABLE autorizacoes_fornecimento RENAME COLUMN data_prevista_entrega TO data_vencimento;

-- cnpj_id: frontend não envia — será preenchido por trigger
ALTER TABLE autorizacoes_fornecimento ALTER COLUMN cnpj_id DROP NOT NULL;

-- Trigger: auto-fill cnpj_id do contrato antes do INSERT
CREATE OR REPLACE FUNCTION fill_af_refs()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cnpj_id IS NULL THEN
        SELECT cnpj_id INTO NEW.cnpj_id
        FROM contratos WHERE id = NEW.contrato_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS b_fill_af_refs ON autorizacoes_fornecimento;
CREATE TRIGGER b_fill_af_refs
    BEFORE INSERT ON autorizacoes_fornecimento
    FOR EACH ROW EXECUTE FUNCTION fill_af_refs();

-- Atualizar validar_saldo_af (referenciava item_contrato_id)
CREATE OR REPLACE FUNCTION validar_saldo_af()
RETURNS TRIGGER AS $$
DECLARE
    v_saldo_item       DECIMAL(12,2);
    v_saldo_reservado  DECIMAL(12,2);
BEGIN
    SELECT saldo_quantidade INTO v_saldo_item
    FROM itens_contrato WHERE id = NEW.item_id;

    SELECT COALESCE(SUM(quantidade_autorizada - quantidade_entregue), 0)
    INTO v_saldo_reservado
    FROM autorizacoes_fornecimento
    WHERE item_id = NEW.item_id
    AND   status IN ('pendente', 'parcial')
    AND   id != NEW.id;

    IF (NEW.quantidade_autorizada - NEW.quantidade_entregue) > (v_saldo_item - v_saldo_reservado) THEN
        RAISE EXCEPTION 'Saldo insuficiente. Disponível: %, Solicitado: %',
            (v_saldo_item - v_saldo_reservado),
            (NEW.quantidade_autorizada - NEW.quantidade_entregue);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PARTE 4: entregas
-- ============================================================

ALTER TABLE entregas RENAME COLUMN nota_fiscal_saida TO nf_saida_numero;

-- item_contrato_id e contrato_id: frontend não envia — auto-fill via trigger
-- (item_contrato_id ainda é usado pelo trigger processar_entrega)
ALTER TABLE entregas ALTER COLUMN item_contrato_id DROP NOT NULL;
ALTER TABLE entregas ALTER COLUMN contrato_id      DROP NOT NULL;

-- Trigger: auto-fill item_contrato_id, contrato_id e usuario_id antes do INSERT
CREATE OR REPLACE FUNCTION fill_entrega_refs()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.usuario_id IS NULL THEN
        NEW.usuario_id := auth.uid();
    END IF;
    IF NEW.item_contrato_id IS NULL OR NEW.contrato_id IS NULL THEN
        SELECT item_id, contrato_id
        INTO   NEW.item_contrato_id, NEW.contrato_id
        FROM   autorizacoes_fornecimento WHERE id = NEW.af_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS b_fill_entrega_refs ON entregas;
CREATE TRIGGER b_fill_entrega_refs
    BEFORE INSERT ON entregas
    FOR EACH ROW EXECUTE FUNCTION fill_entrega_refs();

-- ============================================================
-- PARTE 5: reajustes
-- ============================================================

ALTER TABLE reajustes RENAME COLUMN data_inicio_vigencia TO data_referencia;
ALTER TABLE reajustes RENAME COLUMN data_fim_vigencia    TO data_aplicacao;
ALTER TABLE reajustes RENAME COLUMN approved_by          TO aprovado_por;

ALTER TABLE reajustes ADD COLUMN IF NOT EXISTS indice_referencia TEXT;
ALTER TABLE reajustes ADD COLUMN IF NOT EXISTS justificativa     TEXT;

-- ============================================================
-- GRANT nas novas funções
-- ============================================================

GRANT EXECUTE ON FUNCTION fill_custo_refs()   TO authenticated;
GRANT EXECUTE ON FUNCTION fill_af_refs()      TO authenticated;
GRANT EXECUTE ON FUNCTION fill_entrega_refs() TO authenticated;
