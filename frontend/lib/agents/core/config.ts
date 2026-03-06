// ============================================
// CONFIGURAÇÕES DOS AGENTS
// ============================================

export const AGENT_CONFIG = {
  model: 'claude-sonnet-4-6',
  maxTokens: 4096,
  temperature: 0.3,
} as const

// ============================================
// OCR AGENT CONFIG
// ============================================

export const OCR_CONFIG = {
  ...AGENT_CONFIG,
  temperature: 0.1, // Mais determinístico para extração de dados
  maxTokens: 4096,
} as const

// ============================================
// NEWSLETTER AGENTS CONFIG
// ============================================

export const NEWSLETTER_CONFIG = {
  data_collector: {
    model: 'claude-sonnet-4-6',
    maxTokens: 4096,
    temperature: 0.2, // Determinístico para coleta e análise
    learning_enabled: true,
  },

  insight_analyzer: {
    model: 'claude-sonnet-4-6',
    maxTokens: 8192,
    temperature: 0.5, // Balanceado para análise e cruzamento
    external_apis: ['ibge', 'pncp', 'bacen', 'ipca', 'news'] as const,
  },

  content_writer: {
    model: 'claude-opus-4-6', // Opus para melhor qualidade de redação
    maxTokens: 16384,
    temperature: 0.7, // Mais criativo para escrita
    educational_mode: true,
    disclaimer_required: true,
  },
} as const

// ============================================
// CONCEITOS EDUCACIONAIS (BIBLIOTECA)
// ============================================

export const CONCEITOS_EDUCACIONAIS = [
  'reajuste_contratual_ipca',
  'margem_saudavel_b2g',
  'radar_b2g_conceito',
  'ciclo_orcamentario_publico',
  'renovacao_contrato_processo',
  'termo_aditivo',
  'modalidades_licitacao',
  'lei_8666',
  'pncp_portal',
  'garantia_contratual',
  'multa_rescisao',
  'reequilibrio_economico',
  'pregao_eletronico',
  'dispensa_licitacao',
  'inexigibilidade',
  'ata_registro_precos',
  'sistema_registro_precos',
  'cotacao_precos',
  'nota_empenho',
  'liquidacao_despesa',
] as const

export type ConceitoEducacional = (typeof CONCEITOS_EDUCACIONAIS)[number]
