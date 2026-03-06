// ============================================
// INTERFACES COMPARTILHADAS - AGENTS SYSTEM
// ============================================

// Base Agent Types
export interface AgentConfig {
  model: string
  maxTokens: number
  temperature: number
}

export interface AgentRequest {
  prompt: string
  systemPrompt?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools?: any[]
}

export interface AgentResponse {
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

// ============================================
// OCR AGENT TYPES
// ============================================

export interface OCRCampoExtraido {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valor: any
  confidence: number
}

export interface OCRResult {
  numero_contrato?: string
  orgao_nome?: string
  vigencia_inicio?: string
  vigencia_fim?: string
  valor_total?: number
  modalidade?: string
  cnpj_orgao?: string
  municipio_contrato?: string
  estado_contrato?: string
  objeto_contrato?: string
  confidence_geral: number
  campos_extraidos: Record<string, OCRCampoExtraido>
  itens?: Array<{
    descricao: string
    unidade: string
    quantidade: number
    valor_unitario: number
    valor_total: number
  }>
}

// ============================================
// NEWSLETTER AGENT TYPES
// ============================================

export interface NewsletterDataset {
  contratos_proximos_vencimento: unknown[]
  alertas_margem: unknown[]
  oportunidades_b2g?: unknown[]
  estatisticas_gerais: {
    total_contratos: number
    valor_total_portfolio: number
    margem_media: number
  }
  portfolio_materiais: unknown[]
  regioes_atuacao: unknown[]
}

export interface InsightHistorico {
  data_insight: string
  insight: string
  acao_tomada_cliente: boolean
  resultado: string
  valor_gerado_estimado?: number
  validado: boolean
}

export interface LearningProfile {
  empresa_id: string
  perfil_evolutivo: {
    primeira_analise: string
    total_analises: number
    aprendizados_acumulados: {
      comportamento_renovacao: unknown
      evolucao_portfolio: unknown
      padroes_sazonais: unknown
      sensibilidade_macro: unknown
    }
    insights_historicos_validados: InsightHistorico[]
    preferencias_cliente: {
      taxa_abertura_email: number
      secoes_mais_clicadas: string[]
      acoes_mais_tomadas: string[]
    }
  }
}

export interface InsightEducacional {
  insight: {
    titulo: string
    categoria: string
    dados_base: unknown
    impacto: string
    acao_recomendada: string
    valor_recuperavel?: number
    prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  }
  contexto_educacional: {
    conceito: string
    explicacao: string
    como_aplicar: string
    exemplo_pratico: string
    base_legal?: string
    modelo_clausula?: string
    seu_caso_especifico?: string
  }
}

export interface NewsletterHTML {
  subject: string
  preview_text: string
  html: string
  plain_text: string
  metadata: {
    palavras: number
    tempo_leitura_estimado: string
    secoes: number
    ctas: number
  }
  conceitos_ensinados: string[]
  roi_demonstrado?: number
  personalizacao: {
    empresa: string
    contratos_referenciados: number
    orgaos_mencionados: number
    historico_usado: boolean
  }
}
