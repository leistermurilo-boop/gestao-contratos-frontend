-- MIGRATION 013: Adicionar logo_url à tabela empresas
-- Permite que cada tenant faça upload do seu logotipo e exiba no sistema.

ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS logo_url TEXT;
