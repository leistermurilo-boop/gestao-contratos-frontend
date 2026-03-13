-- ============================================
-- MIGRATION 025: Tabela empresa_segment_knowledge
-- Sprint 4F — Segment Specialist Agent
-- Data: 2026-03-13
-- ============================================

CREATE TABLE IF NOT EXISTS empresa_segment_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

  -- SEGMENTO DETECTADO
  segmento_primario VARCHAR(200) NOT NULL,
  subsegmentos JSONB,
  -- Ex: ["Desktops", "Notebooks", "Periféricos"]
  nicho_b2g VARCHAR(500),
  -- Ex: "Fornecimento TI para prefeituras pequenas (<30k hab)"

  -- BEST PRACTICES DO MERCADO (geradas pelo Claude com conhecimento B2G)
  best_practices JSONB,
  /* Estrutura:
  {
    "composicao_preco": ["BDI típico 18-25%", "Garantia estendida agrega 8-12%"],
    "certificacoes": ["ISO 9001 aumenta conversão em 40%", "Atestado ≥ 50% valor edital"],
    "portfolio_ideal": ["Diversificar em 3+ categorias", "Ter opções básico/premium"],
    "estrategia_preco": ["Municípios <20k: preço pesa 80%", "Capitais: qualificação pesa 60%"],
    "margem_tipica": { "produtos": 0.22, "servicos": 0.35 },
    "riscos_comuns": ["Dumping no pregão eletrônico", "IPCA sem cláusula de reajuste"]
  }
  */

  benchmarks_mercado JSONB,
  /* Estrutura:
  {
    "margem_media_setor": 0.25,
    "ticket_medio_segmento": 150000,
    "concorrencia_media_editais": 3.5,
    "prazo_medio_pagamento_dias": 45,
    "taxa_renovacao_tipica": 0.65
  }
  */

  -- DIAGNÓSTICO COMPORTAMENTAL (inferido do histórico)
  regiao_atuacao_inferida JSONB,
  /* Estrutura:
  {
    "estado_principal": "PR",
    "estados_secundarios": ["SC", "SP"],
    "perfil_cliente_tipico": "município pequeno (<30k habitantes)",
    "concentracao_geografica": "alta"
  }
  */

  modelo_negocio_inferido VARCHAR(200),
  -- Ex: "Revendedor multimarcas", "Integrador de TI", "Fabricante sob encomenda"

  capacidade_operacional_inferida JSONB,
  /* Estrutura:
  {
    "contratos_simultaneos_estimado": 6,
    "ticket_medio_historico": 123330,
    "faturamento_mensal_estimado": 82000,
    "fase_crescimento": "expansão"
  }
  */

  estrategia_detectada VARCHAR(200),
  -- Ex: "Crescimento agressivo", "Margem premium", "Estabilidade/Renovação"

  padroes_comportamentais JSONB,
  /* Estrutura:
  {
    "concentracao_portfolio": 0.46,
    "diversificacao_score": 0.54,
    "sazonalidade_detectada": [3, 9],
    "preferencia_margem_vs_volume": "margem",
    "riscos_identificados": ["Concentração em 1 órgão", "Sem cláusula de reajuste IPCA"]
  }
  */

  -- METADADOS
  confianca_score DECIMAL(3,2) DEFAULT 0.50,
  total_contratos_analisados INTEGER DEFAULT 0,
  total_itens_analisados INTEGER DEFAULT 0,

  versao_agent VARCHAR(20) DEFAULT '1.0.0',
  tempo_processamento_ms INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_empresa_segment UNIQUE(empresa_id),
  CONSTRAINT valid_confianca_segment CHECK (confianca_score BETWEEN 0 AND 1)
);

CREATE INDEX idx_segment_knowledge_empresa ON empresa_segment_knowledge(empresa_id);
CREATE INDEX idx_segment_knowledge_segmento ON empresa_segment_knowledge(segmento_primario);
CREATE INDEX idx_segment_knowledge_updated ON empresa_segment_knowledge(updated_at DESC);

ALTER TABLE empresa_segment_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY segment_knowledge_select ON empresa_segment_knowledge
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
  );

CREATE POLICY segment_knowledge_insert ON empresa_segment_knowledge
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
  );

CREATE POLICY segment_knowledge_update ON empresa_segment_knowledge
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
  );

COMMENT ON TABLE empresa_segment_knowledge IS 'Knowledge base especializada por empresa: segmento B2G, best practices do mercado, diagnóstico comportamental. Atualizada pelo Segment Specialist Agent. Cache 30 dias.';
COMMENT ON COLUMN empresa_segment_knowledge.best_practices IS 'Best practices do segmento geradas pelo Claude: composição de preço, certificações, portfolio ideal, estratégia de preço, riscos comuns';
COMMENT ON COLUMN empresa_segment_knowledge.padroes_comportamentais IS 'Diagnóstico do comportamento da empresa: concentração, diversificação, sazonalidade, riscos ocultos';
