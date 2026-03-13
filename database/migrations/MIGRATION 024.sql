-- ============================================
-- MIGRATION 024: Tabela newsletter_drafts (Content Writer Agent - Sprint 4C)
-- ============================================
-- Data: 2026-03-12
-- Sprint: 4C - Content Writer Agent

CREATE TABLE IF NOT EXISTS newsletter_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  insights_id UUID REFERENCES newsletter_insights(id),

  -- Metadados
  gerado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  periodo_referencia DATE NOT NULL,

  -- Conteúdo da newsletter
  subject VARCHAR(200) NOT NULL,
  preview_text VARCHAR(300),
  html TEXT NOT NULL,
  plain_text TEXT,

  -- Metadados de qualidade
  palavras INTEGER DEFAULT 0,
  tempo_leitura_estimado VARCHAR(20),
  secoes INTEGER DEFAULT 0,
  ctas INTEGER DEFAULT 0,
  conceitos_ensinados TEXT[],
  roi_demonstrado DECIMAL(12,2),

  -- Personalização
  contratos_referenciados INTEGER DEFAULT 0,
  orgaos_mencionados INTEGER DEFAULT 0,
  historico_usado BOOLEAN DEFAULT false,

  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'sent', 'archived')),
  enviado_em TIMESTAMP,
  enviado_para VARCHAR(200),

  -- Metadados de execução
  versao_agent VARCHAR(20) DEFAULT '1.0.0',
  tempo_processamento_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_newsletter_drafts_empresa ON newsletter_drafts(empresa_id);
CREATE INDEX idx_newsletter_drafts_gerado ON newsletter_drafts(gerado_em DESC);
CREATE INDEX idx_newsletter_drafts_status ON newsletter_drafts(status);

ALTER TABLE newsletter_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY newsletter_drafts_select ON newsletter_drafts
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
  );

CREATE POLICY newsletter_drafts_insert ON newsletter_drafts
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
  );

CREATE POLICY newsletter_drafts_update ON newsletter_drafts
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
  );

COMMENT ON TABLE newsletter_drafts IS 'Newsletters geradas pelo Agent 3 (Content Writer). HTML pronto para envio via Resend.';
COMMENT ON COLUMN newsletter_drafts.status IS 'draft=gerado, reviewed=aprovado, sent=enviado, archived=arquivado';
