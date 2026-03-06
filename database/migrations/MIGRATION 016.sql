-- =====================================================
-- MIGRATION 016: Sistema de Pontuação Automática
-- Índice de Maturidade DUO™
-- =====================================================

BEGIN;

-- 1. FUNÇÃO: Calcular pontuação baseado em número de contratos
CREATE OR REPLACE FUNCTION calcular_pontuacao_empresa(empresa_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_pontos INTEGER := 0;
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

-- 2. FUNÇÃO: Determinar nível baseado em pontuação
CREATE OR REPLACE FUNCTION calcular_nivel_maturidade(pontos INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF pontos >= 201 THEN RETURN 5;
  ELSIF pontos >= 101 THEN RETURN 4;
  ELSIF pontos >= 51  THEN RETURN 3;
  ELSIF pontos >= 21  THEN RETURN 2;
  ELSE RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. FUNÇÃO TRIGGER: Atualizar pontuação quando contrato muda
CREATE OR REPLACE FUNCTION atualizar_maturidade_empresa()
RETURNS TRIGGER AS $$
DECLARE
  nova_pontuacao INTEGER;
  novo_nivel     INTEGER;
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

-- 4. TRIGGER em contratos
DROP TRIGGER IF EXISTS trigger_atualizar_maturidade ON contratos;

CREATE TRIGGER trigger_atualizar_maturidade
AFTER INSERT OR UPDATE OR DELETE ON contratos
FOR EACH ROW
EXECUTE FUNCTION atualizar_maturidade_empresa();

-- 5. RETROATIVO: Calcular pontos para todas as empresas existentes
DO $$
DECLARE
  emp RECORD;
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
