-- MIGRATION 011: Adicionar coluna observacao em autorizacoes_fornecimento
-- Problema: coluna presente em database.types.ts e no AF form mas ausente no schema original.

ALTER TABLE autorizacoes_fornecimento
    ADD COLUMN IF NOT EXISTS observacao TEXT;
