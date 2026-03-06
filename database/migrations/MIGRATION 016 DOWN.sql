-- MIGRATION 016 DOWN: Reverter sistema de pontuação automática

BEGIN;

DROP TRIGGER IF EXISTS trigger_atualizar_maturidade ON contratos;
DROP FUNCTION IF EXISTS atualizar_maturidade_empresa();
DROP FUNCTION IF EXISTS calcular_nivel_maturidade(INTEGER);
DROP FUNCTION IF EXISTS calcular_pontuacao_empresa(UUID);

UPDATE empresas SET pontuacao_maturidade = 0, nivel_maturidade = 1;

COMMIT;
