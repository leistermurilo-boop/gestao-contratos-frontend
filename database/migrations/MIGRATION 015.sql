-- MIGRATION 015: Planos de assinatura e Índice de Maturidade DUO™
-- Criação das tabelas planos e niveis_maturidade + integração com empresas
--
-- REGRA CRÍTICA:
-- Níveis de Maturidade = badge visual de engajamento (NÃO bloqueia features)
-- Plano (Core/Strategic) = feature gate real (controla acesso)

-- =========================================================
-- 1. TABELA: planos
-- =========================================================
CREATE TABLE planos (
  id                  TEXT          PRIMARY KEY,
  nome                TEXT          NOT NULL,
  tagline             TEXT,
  preco_mensal        NUMERIC(10,2) NOT NULL,
  preco_anual         NUMERIC(10,2) NOT NULL,
  total_anual         NUMERIC(10,2) NOT NULL,
  desconto_anual_pct  NUMERIC(5,2)  NOT NULL DEFAULT 17.00,
  nivel_maximo_visual INTEGER       NOT NULL DEFAULT 3,
  limite_ocr_mes      INTEGER       NOT NULL DEFAULT 3,  -- -1 = ilimitado
  radar_b2g           BOOLEAN       NOT NULL DEFAULT false,
  newsletter          BOOLEAN       NOT NULL DEFAULT false,
  api_pncp            BOOLEAN       NOT NULL DEFAULT false,
  api_ibge            BOOLEAN       NOT NULL DEFAULT false,
  cruzamento_macro    BOOLEAN       NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 2. TABELA: niveis_maturidade (lookup - badge visual)
-- =========================================================
CREATE TABLE niveis_maturidade (
  id          INTEGER     PRIMARY KEY,
  nome        TEXT        NOT NULL,
  descricao   TEXT,
  pontos_min  INTEGER     NOT NULL,
  pontos_max  INTEGER,              -- NULL = sem limite superior
  cor         TEXT        NOT NULL, -- 'slate'|'blue'|'emerald'|'purple'|'yellow'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 3. SEED: Planos (Fonte: duogovernance.com.br/planos)
-- =========================================================
INSERT INTO planos (id, nome, tagline, preco_mensal, preco_anual, total_anual, nivel_maximo_visual, limite_ocr_mes, radar_b2g, newsletter, api_pncp, api_ibge, cruzamento_macro)
VALUES
  (
    'core',
    'Core',
    'Ferramenta estratégica de proteção',
    497.00, 414.17, 4970.00,
    3,   -- nível visual máximo: 3 (Contrato Protegido)
    3,   -- OCR: 3x/mês
    false, false, false, false, false
  ),
  (
    'strategic',
    'Strategic',
    'Ferramenta estratégica de antecipação',
    647.00, 539.17, 6470.00,
    5,   -- nível visual máximo: 5 (Contrato Estratégico)
    -1,  -- OCR: ilimitado
    true, true, true, true, true  -- Radar B2G™, Newsletter, API PNCP, API IBGE, Macro
  );

-- =========================================================
-- 4. SEED: Níveis de Maturidade DUO™ (badge visual APENAS)
-- =========================================================
INSERT INTO niveis_maturidade (id, nome, descricao, pontos_min, pontos_max, cor)
VALUES
  (1, 'Contrato Registrado',      'Dados básicos centralizados',                   0,   20,   'slate'),
  (2, 'Contrato Monitorado',      'Acompanhamento de prazos e vigências',          21,  50,   'blue'),
  (3, 'Contrato Protegido',       'Alertas de margem e erosão ativos',             51,  100,  'emerald'),
  (4, 'Contrato Contextualizado', 'Cruzamento com dados macroeconômicos',          101, 200,  'purple'),
  (5, 'Contrato Estratégico',     'Antecipação total e Radar B2G™ ativo',         201, NULL, 'yellow');

-- =========================================================
-- 5. ALTERAR: empresas — adicionar campos de plano e maturidade
-- =========================================================
ALTER TABLE empresas
  ADD COLUMN plano_id              TEXT    REFERENCES planos(id) DEFAULT 'core',
  ADD COLUMN nivel_maturidade      INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN pontuacao_maturidade  INTEGER NOT NULL DEFAULT 0;

-- FK para niveis_maturidade adicionada separadamente (após seed)
ALTER TABLE empresas
  ADD CONSTRAINT empresas_nivel_maturidade_fkey
  FOREIGN KEY (nivel_maturidade) REFERENCES niveis_maturidade(id);

-- Garantir que empresas existentes tenham plano Core
UPDATE empresas SET plano_id = 'core' WHERE plano_id IS NULL;

-- =========================================================
-- 6. RLS: planos e niveis_maturidade são lookup tables públicas
-- =========================================================
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE niveis_maturidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planos_select_authenticated"
  ON planos FOR SELECT TO authenticated USING (true);

CREATE POLICY "niveis_maturidade_select_authenticated"
  ON niveis_maturidade FOR SELECT TO authenticated USING (true);
