-- ============================================
-- MIGRATION 026: Fix VARCHAR(200) overflow em empresa_segment_knowledge
-- BUG 13 — Sprint 4F — 2026-03-15
-- ============================================
-- Causa: Com maxTokens=4000 (fix BUG 12), Claude gera valores mais ricos
-- que ultrapassam o limite VARCHAR(200), causando Postgres 22001.
-- Fix: Alterar as 3 colunas afetadas para TEXT (sem limite de tamanho).
-- ============================================

ALTER TABLE empresa_segment_knowledge
  ALTER COLUMN segmento_primario TYPE TEXT,
  ALTER COLUMN modelo_negocio_inferido TYPE TEXT,
  ALTER COLUMN estrategia_detectada TYPE TEXT;
