-- ============================================
-- MIGRATION 023: Tabela newsletter_insights (Insight Analyzer Agent - Sprint 4B)
-- ============================================
-- Data: 2026-03-12
-- Sprint: 4B - Insight Analyzer Agent

CREATE TABLE IF NOT EXISTS newsletter_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  intelligence_id UUID REFERENCES empresa_intelligence(id),

  -- Metadados
  gerado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  periodo_referencia DATE NOT NULL,

  -- Insights por categoria
  insights_precificacao JSONB,
  insights_radar_b2g JSONB,
  insights_macro JSONB,
  insights_regionais JSONB,

  -- Cache dados externos (reutilizados pelo Content Writer)
  ipca_12m DECIMAL(5,2),
  selic_atual DECIMAL(5,2),
  dados_pncp JSONB,
  dados_ibge JSONB,

  -- Qualidade
  total_insights INTEGER DEFAULT 0,
  insights_criticos INTEGER DEFAULT 0,
  confianca_score DECIMAL(3,2),

  -- Metadados de execução
  versao_agent VARCHAR(20) DEFAULT '1.0.0',
  tempo_processamento_ms INTEGER,
  apis_consultadas TEXT[],
  apis_com_erro TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_confianca_insights CHECK (confianca_score BETWEEN 0 AND 1)
);

CREATE INDEX idx_newsletter_insights_empresa ON newsletter_insights(empresa_id);
CREATE INDEX idx_newsletter_insights_gerado ON newsletter_insights(gerado_em DESC);

ALTER TABLE newsletter_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY newsletter_insights_select ON newsletter_insights
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
  );

CREATE POLICY newsletter_insights_insert ON newsletter_insights
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
  );

COMMENT ON TABLE newsletter_insights IS 'Insights gerados pelo Agent 2 (Insight Analyzer) cruzando dados internos com APIs externas. Alimenta o Content Writer Agent (Sprint 4C).';
COMMENT ON COLUMN newsletter_insights.insights_precificacao IS 'Insights de erosão de margem vs IPCA';
COMMENT ON COLUMN newsletter_insights.insights_radar_b2g IS 'Oportunidades encontradas no PNCP';
COMMENT ON COLUMN newsletter_insights.insights_macro IS 'Contexto Selic/Bacen';
COMMENT ON COLUMN newsletter_insights.insights_regionais IS 'Potencial por região via IBGE';
COMMENT ON COLUMN newsletter_insights.apis_com_erro IS 'APIs que falharam (falha parcial não interrompe o agent)';
