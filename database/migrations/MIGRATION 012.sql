-- MIGRATION 012: Adicionar SECURITY DEFINER nas funções de trigger
-- Problema: trigger functions sem SECURITY DEFINER executam com as permissões
-- do usuário chamador, sujeitas a RLS. Funções de bookkeeping interno devem
-- usar SECURITY DEFINER para acessar tabelas sem restrição de RLS.
--
-- Funções corrigidas:
--   processar_novo_custo   → queries custos_item + updates itens_contrato
--   atualizar_margem_item  → queries empresas + updates itens_contrato
--   processar_entrega      → updates autorizacoes_fornecimento + itens_contrato
--   validar_saldo_af       → queries itens_contrato + autorizacoes_fornecimento
--   validar_entrega        → queries autorizacoes_fornecimento

-- ============================================================
-- processar_novo_custo
-- ============================================================
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

    -- Calcular Custo Médio Ponderado
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- atualizar_margem_item
-- ============================================================
CREATE OR REPLACE FUNCTION atualizar_margem_item()
RETURNS TRIGGER AS $$
DECLARE
    v_margem        DECIMAL(8,4);
    v_margem_alerta DECIMAL(5,2);
BEGIN
    IF NEW.ultimo_custo_unitario IS NOT NULL AND NEW.ultimo_custo_unitario > 0
       AND NEW.valor_unitario > 0 THEN
        v_margem := ((NEW.valor_unitario - NEW.ultimo_custo_unitario) / NEW.valor_unitario) * 100;

        SELECT (config_json->>'margem_alerta')::DECIMAL INTO v_margem_alerta
        FROM empresas WHERE id = NEW.empresa_id;

        NEW.margem_atual           := v_margem;
        NEW.margem_alerta_disparado := (v_margem < COALESCE(v_margem_alerta, 10.0));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- processar_entrega
-- ============================================================
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

    -- Atualizar quantidade_entregue do Item
    UPDATE itens_contrato
    SET quantidade_entregue = quantidade_entregue + NEW.quantidade_entregue,
        updated_at = NOW()
    WHERE id = NEW.item_contrato_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- validar_saldo_af
-- ============================================================
CREATE OR REPLACE FUNCTION validar_saldo_af()
RETURNS TRIGGER AS $$
DECLARE
    v_saldo_item      DECIMAL(12,2);
    v_saldo_reservado DECIMAL(12,2);
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- validar_entrega
-- ============================================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- validar_nf_unica (já atualizada no 010, adicionar SECURITY DEFINER)
-- ============================================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
