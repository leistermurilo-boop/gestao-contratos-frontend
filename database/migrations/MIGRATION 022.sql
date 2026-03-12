-- ============================================
-- MIGRATION 022: Tabela empresa_intelligence (Learning Layer - Newsletter Agents)
-- ============================================
-- Data: 2026-03-12
-- Sprint: 4A - Data Collector Agent
-- Tabela de inteligência acumulada por empresa (learning layer evolutiva)

CREATE TABLE IF NOT EXISTS empresa_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

  -- Metadados da análise
  analise_data TIMESTAMP NOT NULL DEFAULT NOW(),
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  total_contratos_analisados INTEGER NOT NULL DEFAULT 0,

  -- Insights de Portfolio
  portfolio_materiais JSONB,
  categorias_principais JSONB,

  -- Padrões Históricos
  padroes_renovacao JSONB,
  sazonalidade JSONB,
  duracao_media_contratos INTEGER,

  -- Análise de Órgãos e Esfera
  orgaos_frequentes JSONB,
  esferas_atuacao JSONB,

  -- Análise Financeira
  ticket_medio DECIMAL(15,2),
  margem_media_historica DECIMAL(5,2),
  valor_total_portfolio DECIMAL(15,2),

  -- Comportamento de Mercado
  sensibilidade_macro JSONB,
  evolucao_portfolio JSONB,

  -- Qualidade dos Dados
  confianca_score DECIMAL(3,2) DEFAULT 0.5,
  total_pontos_dados INTEGER DEFAULT 0,

  -- Validação de Insights (feedback loop)
  insights_validados INTEGER DEFAULT 0,
  insights_totais INTEGER DEFAULT 0,
  taxa_acerto DECIMAL(3,2),

  -- Metadados
  versao_agent VARCHAR(20) DEFAULT '1.0.0',
  tempo_processamento_ms INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_periodo CHECK (periodo_fim >= periodo_inicio),
  CONSTRAINT valid_confianca CHECK (confianca_score BETWEEN 0 AND 1),
  CONSTRAINT valid_taxa_acerto CHECK (taxa_acerto IS NULL OR taxa_acerto BETWEEN 0 AND 1)
);

-- Índices
CREATE INDEX idx_empresa_intelligence_empresa ON empresa_intelligence(empresa_id);
CREATE INDEX idx_empresa_intelligence_data ON empresa_intelligence(analise_data DESC);
CREATE INDEX idx_empresa_intelligence_periodo ON empresa_intelligence(periodo_inicio, periodo_fim);

-- RLS
ALTER TABLE empresa_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY empresa_intelligence_select ON empresa_intelligence
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY empresa_intelligence_insert ON empresa_intelligence
  FOR INSERT
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY empresa_intelligence_update ON empresa_intelligence
  FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE empresa_intelligence IS 'Learning layer evolutiva: acumula insights sobre padrões de negócio de cada empresa. Alimenta Newsletter Agents.';
COMMENT ON COLUMN empresa_intelligence.portfolio_materiais IS 'Array: itens/serviços mais recorrentes por frequência e valor';
COMMENT ON COLUMN empresa_intelligence.padroes_renovacao IS 'Objeto: taxa de renovação, prazo médio, fatores de influência';
COMMENT ON COLUMN empresa_intelligence.confianca_score IS 'Score 0-1: confiabilidade da análise baseada no volume de dados';
COMMENT ON COLUMN empresa_intelligence.taxa_acerto IS 'Feedback loop: % de insights que se confirmaram na prática';
