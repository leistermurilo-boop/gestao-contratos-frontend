-- ============================================
-- MIGRATION 017: OCR Learning Layer
-- ============================================
-- Tabela para rastrear extrações OCR e correções do usuário.
-- Permite que o sistema aprenda com feedback e melhore precisão ao longo do tempo.

CREATE TABLE IF NOT EXISTS ocr_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  contrato_id UUID REFERENCES contratos(id) ON DELETE SET NULL,

  -- Dados da extração original
  campos_extraidos JSONB NOT NULL DEFAULT '{}',
  confidence_geral FLOAT NOT NULL DEFAULT 0,
  modelo_usado TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',

  -- Correções do usuário (campos que foram alterados manualmente)
  campos_corrigidos JSONB DEFAULT NULL,
  teve_correcao BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadados
  nome_arquivo TEXT,
  tamanho_arquivo_bytes INTEGER,
  tokens_usados INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: isolamento por empresa
ALTER TABLE ocr_learning ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ocr_learning_empresa_isolation" ON ocr_learning;
CREATE POLICY "ocr_learning_empresa_isolation" ON ocr_learning
  USING (empresa_id = (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  ));

-- Índices
CREATE INDEX idx_ocr_learning_empresa_id ON ocr_learning(empresa_id);
CREATE INDEX idx_ocr_learning_contrato_id ON ocr_learning(contrato_id);
CREATE INDEX idx_ocr_learning_created_at ON ocr_learning(created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_ocr_learning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ocr_learning_updated_at
  BEFORE UPDATE ON ocr_learning
  FOR EACH ROW EXECUTE FUNCTION update_ocr_learning_updated_at();
