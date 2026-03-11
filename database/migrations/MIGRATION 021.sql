-- Migration 021: SECURITY DEFINER functions para soft delete
-- Contexto: PostgREST aplica SELECT policy como verificação pós-UPDATE.
-- Após setar deleted_at, a linha some da SELECT policy (deleted_at IS NULL),
-- causando 403 mesmo com UPDATE policy correto. Solução: funções SECURITY DEFINER
-- que executam o UPDATE bypassando o check de visibilidade do PostgREST.

-- ============================================================
-- Soft delete de contrato
-- ============================================================
CREATE OR REPLACE FUNCTION soft_delete_contrato(p_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE contratos
  SET deleted_at = NOW(), deleted_by = p_user_id
  WHERE id = p_id
    AND empresa_id = get_user_empresa_id()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato não encontrado ou sem permissão para arquivar';
  END IF;
END;
$$;

-- Garante que apenas usuários autenticados podem chamar
REVOKE ALL ON FUNCTION soft_delete_contrato(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION soft_delete_contrato(UUID, UUID) TO authenticated;

-- ============================================================
-- Soft delete de item de contrato
-- ============================================================
CREATE OR REPLACE FUNCTION soft_delete_item_contrato(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE itens_contrato
  SET deleted_at = NOW()
  WHERE id = p_id
    AND deleted_at IS NULL
    AND contrato_id IN (
      SELECT id FROM contratos
      WHERE empresa_id = get_user_empresa_id()
        AND deleted_at IS NULL
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item não encontrado ou sem permissão para remover';
  END IF;
END;
$$;

-- Garante que apenas usuários autenticados podem chamar
REVOKE ALL ON FUNCTION soft_delete_item_contrato(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION soft_delete_item_contrato(UUID) TO authenticated;
