-- =====================================================
-- MIGRATION 016: Sistema de Pontuação Automática
-- Índice de Maturidade DUO™
-- =====================================================
--
-- CORREÇÃO INCLUÍDA:
-- O audit_trigger_func() estava instalado em empresas e tentava
-- acessar NEW.empresa_id — que não existe (empresas.pk = id).
-- O passo 0 abaixo remove esse trigger inválido da tabela raiz.
-- =====================================================

BEGIN;

-- =========================================================
-- 0. FIX: Remover audit trigger da tabela empresas
--    A tabela empresas é o tenant raiz; não tem campo empresa_id.
--    O audit_trigger_func assume empresa_id em todas as tabelas,
--    causando erro em qualquer UPDATE em empresas.
-- =========================================================
DO $$
DECLARE
  v_trigger_name TEXT;
BEGIN
  SELECT t.tgname INTO v_trigger_name
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_proc  p ON t.tgfoid  = p.oid
  WHERE c.relname         = 'empresas'
    AND c.relnamespace    = 'public'::regnamespace
    AND p.proname         = 'audit_trigger_func'
    AND NOT t.tgisinternal;

  IF v_trigger_name IS NOT NULL THEN
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.empresas', v_trigger_name);
    RAISE NOTICE 'Audit trigger "%" removido de empresas (incompatível com tabela raiz sem empresa_id)', v_trigger_name;
  ELSE
    RAISE NOTICE 'Nenhum audit trigger audit_trigger_func encontrado em empresas — sem ação necessária';
  END IF;
END $$;

-- =========================================================
-- 1. FUNÇÃO: Calcular pontuação baseado em número de contratos
-- =========================================================
CREATE OR REPLACE FUNCTION calcular_pontuacao_empresa(empresa_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_pontos    INTEGER := 0;
  total_contratos INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_contratos
  FROM contratos
  WHERE empresa_id = empresa_uuid;

  -- Primeiro contrato: +10 pontos
  IF total_contratos >= 1 THEN
    total_pontos := total_pontos + 10;
  END IF;

  -- Contratos adicionais: +2 pontos cada (exceto o primeiro)
  IF total_contratos > 1 THEN
    total_pontos := total_pontos + ((total_contratos - 1) * 2);
  END IF;

  -- Milestone 10 contratos: +15 pontos bônus
  IF total_contratos >= 10 THEN
    total_pontos := total_pontos + 15;
  END IF;

  -- Milestone 30 contratos: +30 pontos bônus
  IF total_contratos >= 30 THEN
    total_pontos := total_pontos + 30;
  END IF;

  -- Milestone 50 contratos: +50 pontos bônus
  IF total_contratos >= 50 THEN
    total_pontos := total_pontos + 50;
  END IF;

  RETURN total_pontos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- 2. FUNÇÃO: Determinar nível baseado em pontuação
-- =========================================================
CREATE OR REPLACE FUNCTION calcular_nivel_maturidade(pontos INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF    pontos >= 201 THEN RETURN 5;
  ELSIF pontos >= 101 THEN RETURN 4;
  ELSIF pontos >= 51  THEN RETURN 3;
  ELSIF pontos >= 21  THEN RETURN 2;
  ELSE                     RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 3. FUNÇÃO TRIGGER: Atualizar pontuação quando contrato muda
-- =========================================================
CREATE OR REPLACE FUNCTION atualizar_maturidade_empresa()
RETURNS TRIGGER AS $$
DECLARE
  nova_pontuacao  INTEGER;
  novo_nivel      INTEGER;
  empresa_afetada UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    empresa_afetada := OLD.empresa_id;
  ELSE
    empresa_afetada := NEW.empresa_id;
  END IF;

  nova_pontuacao := calcular_pontuacao_empresa(empresa_afetada);
  novo_nivel     := calcular_nivel_maturidade(nova_pontuacao);

  UPDATE empresas
  SET
    pontuacao_maturidade = nova_pontuacao,
    nivel_maturidade     = novo_nivel
  WHERE id = empresa_afetada;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- 4. TRIGGER em contratos
-- =========================================================
DROP TRIGGER IF EXISTS trigger_atualizar_maturidade ON contratos;

CREATE TRIGGER trigger_atualizar_maturidade
AFTER INSERT OR UPDATE OR DELETE ON contratos
FOR EACH ROW
EXECUTE FUNCTION atualizar_maturidade_empresa();

-- =========================================================
-- 5. RETROATIVO: Calcular pontos para todas as empresas existentes
-- =========================================================
DO $$
DECLARE
  emp            RECORD;
  nova_pontuacao INTEGER;
  novo_nivel     INTEGER;
BEGIN
  FOR emp IN SELECT id FROM empresas LOOP
    nova_pontuacao := calcular_pontuacao_empresa(emp.id);
    novo_nivel     := calcular_nivel_maturidade(nova_pontuacao);

    UPDATE empresas
    SET
      pontuacao_maturidade = nova_pontuacao,
      nivel_maturidade     = novo_nivel
    WHERE id = emp.id;
  END LOOP;

  RAISE NOTICE 'Pontuações atualizadas para todas as empresas';
END $$;

COMMIT;

-- =====================================================
-- VALIDAÇÃO (executar manualmente após migration):
-- =====================================================
-- SELECT
--   e.razao_social,
--   COUNT(c.id) AS total_contratos,
--   e.pontuacao_maturidade,
--   e.nivel_maturidade
-- FROM empresas e
-- LEFT JOIN contratos c ON c.empresa_id = e.id
-- GROUP BY e.id, e.razao_social, e.pontuacao_maturidade, e.nivel_maturidade;
--
-- RESULTADO ESPERADO (3 contratos):
--   total_contratos=3 | pontuacao=14 | nivel=1
