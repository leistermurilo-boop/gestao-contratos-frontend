import type { SupabaseClient } from '@supabase/supabase-js'
import { ClaudeClient } from '@/lib/agents/core/claude-client'
import type { SegmentSpecialistInput, SegmentSpecialistOutput } from '@/lib/agents/core/types'

/**
 * SEGMENT SPECIALIST AGENT (Sprint 4F)
 *
 * Posição no pipeline: Data Collector → [Segment Specialist] → Insight Analyzer
 *
 * Responsabilidades:
 * 1. Detecta segmento B2G da empresa a partir do portfolio (empresa_intelligence)
 * 2. Gera best practices do mercado com olhar de consultor B2G experiente
 * 3. Diagnostica comportamento: modelo de negócio, estratégia, riscos ocultos
 * 4. Salva knowledge base em empresa_segment_knowledge (cache 30 dias)
 * 5. Enriquece Insight Analyzer com contexto especializado de segmento
 *
 * Não re-coleta contratos — lê empresa_intelligence (output do Data Collector).
 * Sem web search — Claude usa conhecimento de treinamento sobre B2G brasileiro.
 */

// === SYSTEM PROMPT — CONSULTOR B2G SÊNIOR ===
// Desenvolvido com base em pesquisa real sobre dores do fornecedor B2G brasileiro.
// Fundamentado em: Lei 14.133/2021, práticas de pregão eletrônico, benchmarks de mercado.

const SEGMENT_SPECIALIST_SYSTEM_PROMPT = `Você é um consultor sênior especializado em empresas fornecedoras do mercado B2G brasileiro (vendas para governo via licitações públicas). Você combina dois perfis:

1. ESPECIALISTA DE SEGMENTO: Conhece profundamente o mercado específico da empresa (TI, construção civil, saúde, material de escritório, etc.) — margens típicas, certificações obrigatórias, sazonalidade de editais, principais compradores públicos.

2. MENTOR DO EMPRESÁRIO B2G: Você já acompanhou centenas de fornecedores e conhece as dificuldades reais do dia a dia, não só a teoria.

=== DORES REAIS QUE VOCÊ CONHECE PROFUNDAMENTE ===

FLUXO DE CAIXA E PAGAMENTO:
- Governo atrasa pagamentos 30 a 90+ dias após nota fiscal entregue
- MPEs com capital de giro limitado frequentemente executam contratos no limite da liquidez
- Empenho não é garantia de pagamento: contingenciamento orçamentário anula empenhos
- Contratos de grande valor exigem financiamento bancário para execução
- Lei 14.133 art. 132: governo tem prazo de 30 dias para responder pedidos de reequilíbrio

PRECIFICAÇÃO E MARGEM:
- Pregão eletrônico cria guerra de lances — empresas baixam preço sem calcular custo mínimo
- BDI (Benefícios e Despesas Indiretas) mal calculado consome margem silenciosamente
- IPCA acumulado corrói contratos sem cláusula de reajuste (perda de 4-6%/ano de margem real)
- Reequilíbrio econômico-financeiro (art. 131 Lei 14.133) é direito legal mas poucos pedem
- Preço inexequível: ganhar licitação abaixo do custo real gera prejuízo no contrato
- Mark-up correto deve cobrir: custos diretos + impostos + inadimplência + custo financeiro + lucro

HABILITAÇÃO E BUROCRACIA:
- Certidão Negativa de Débitos (CND) vencida = desclassificação imediata
- SICAF desatualizado = inabilitação mesmo para empresa financeiramente saudável
- Atestado de capacidade técnica: exigido geralmente mínimo 50% do valor do edital
- Leitura inadequada do edital: empresas perdem por não atender requisito técnico específico
- Erros formais (PDF corrompido, assinatura incorreta) eliminam propostas competitivas

ESTRATÉGIA E MERCADO:
- Concentração: depender de 1-2 contratos grandes é risco fatal se não renovar
- Concorrência predatória: competidores oferecem preços inviáveis para eliminar concorrência
- Municípios pequenos (<20k hab): preço é 80% da decisão, qualificação pesa 20%
- Capitais e órgãos federais: qualificação técnica pesa 60%, preço 40%
- Diversificação de portfolio reduz risco e amplia elegibilidade para editais

GESTÃO OPERACIONAL:
- Logística para municípios distantes: custo frequentemente subestimado na proposta
- Garantia e assistência técnica: custo real impacta margem mas raramente é precificado
- Concentração em poucas categorias: risco se demanda do segmento cair

=== COMO VOCÊ ANALISA ===
Ao receber dados de uma empresa, você DIAGNOSTICA — não apenas descreve:
1. ONDE ESTÁ PERDENDO MARGEM: reajuste não solicitado? BDI incorreto? Concentração de risco?
2. ONDE ESTÁ DEIXANDO DINHEIRO NA MESA: editais compatíveis não explorados? Regiões com menos concorrência?
3. QUAL É O RISCO OCULTO: contratos vencendo sem renovação? Dependência de 1 órgão?
4. QUAL É O PRÓXIMO PASSO ACIONÁVEL: ação específica com impacto financeiro estimado

=== FORMATO ===
- Use números reais dos dados fornecidos — nunca invente percentuais
- Compare sempre empresa × benchmark do segmento
- Cite mecanismo legal quando relevante (art. 131 Lei 14.133, etc.)
- Tom: direto, prático — como um sócio experiente falaria
- Responda APENAS com JSON válido, sem markdown ou texto extra`

// === TIPOS INTERNOS ===

interface SegmentData {
  segmento_primario: string
  subsegmentos: string[]
  nicho_b2g: string
  best_practices: {
    composicao_preco: string[]
    certificacoes: string[]
    portfolio_ideal: string[]
    estrategia_preco: string[]
    margem_tipica: { produtos: number; servicos: number }
    riscos_comuns: string[]
  }
  benchmarks_mercado: {
    margem_media_setor: number
    ticket_medio_segmento: number
    concorrencia_media_editais: number
    prazo_medio_pagamento_dias: number
    taxa_renovacao_tipica: number
  }
}

interface DiagnosisData {
  regiao_atuacao_inferida: {
    estado_principal: string
    estados_secundarios: string[]
    perfil_cliente_tipico: string
    concentracao_geografica: string
  }
  modelo_negocio_inferido: string
  capacidade_operacional_inferida: {
    contratos_simultaneos_estimado: number
    ticket_medio_historico: number
    faturamento_mensal_estimado: number
    fase_crescimento: string
  }
  estrategia_detectada: string
  padroes_comportamentais: {
    concentracao_portfolio: number
    diversificacao_score: number
    sazonalidade_detectada: number[]
    preferencia_margem_vs_volume: string
    riscos_identificados: string[]
  }
}

type Intelligence = Record<string, unknown>

// === AGENT ===

export class SegmentSpecialistAgent {
  private claudeClient: ClaudeClient

  constructor(private supabase: SupabaseClient) {
    this.claudeClient = new ClaudeClient({
      model: 'claude-sonnet-4-6',
      maxTokens: 2000,
      temperature: 0.4,
    })
  }

  async analyze(input: SegmentSpecialistInput): Promise<SegmentSpecialistOutput> {
    const startTime = Date.now()
    const { empresa_id } = input

    try {
      // Cache: se knowledge base existe e tem menos de 30 dias, retornar do cache
      const existing = await this.getExisting(empresa_id)
      if (existing && this.isRecent(existing.updated_at as string)) {
        return {
          success: true,
          empresa_id,
          segmento: existing.segmento_primario as string,
          knowledge_id: existing.id as string,
          from_cache: true,
          tempo_processamento_ms: Date.now() - startTime,
        }
      }

      // Carregar empresa_intelligence (output do Data Collector)
      const intelligence = await this.getLatestIntelligence(empresa_id)
      if (!intelligence) {
        return {
          success: false,
          empresa_id,
          error: 'Nenhum empresa_intelligence encontrado. Execute o Data Collector primeiro.',
          tempo_processamento_ms: Date.now() - startTime,
        }
      }

      // Chamada 1: Detectar segmento + best practices
      const segmentData = await this.analyzeSegment(intelligence)

      // Chamada 2: Diagnóstico comportamental
      const diagnosisData = await this.analyzeBehavior(intelligence, segmentData.segmento_primario)

      // Salvar knowledge base (upsert — 1 registro por empresa)
      const knowledgeId = await this.saveKnowledge(
        empresa_id,
        intelligence,
        segmentData,
        diagnosisData,
        startTime
      )

      return {
        success: true,
        empresa_id,
        segmento: segmentData.segmento_primario,
        knowledge_id: knowledgeId,
        from_cache: false,
        tempo_processamento_ms: Date.now() - startTime,
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('[SegmentSpecialistAgent]', error)
      return {
        success: false,
        empresa_id,
        error: msg,
        tempo_processamento_ms: Date.now() - startTime,
      }
    }
  }

  // === SUPABASE ===

  private async getExisting(empresa_id: string): Promise<Intelligence | null> {
    const { data } = await this.supabase
      .from('empresa_segment_knowledge')
      .select('*')
      .eq('empresa_id', empresa_id)
      .single()
    return data as Intelligence | null
  }

  private isRecent(updated_at: string): boolean {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return new Date(updated_at) > thirtyDaysAgo
  }

  private async getLatestIntelligence(empresa_id: string): Promise<Intelligence | null> {
    const { data } = await this.supabase
      .from('empresa_intelligence')
      .select('*')
      .eq('empresa_id', empresa_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    return data as Intelligence | null
  }

  // === CLAUDE: CHAMADA 1 — SEGMENTO + BEST PRACTICES ===

  private async analyzeSegment(intelligence: Intelligence): Promise<SegmentData> {
    const input = {
      portfolio_materiais: intelligence.portfolio_materiais,
      ticket_medio: intelligence.ticket_medio,
      margem_media_historica: intelligence.margem_media_historica,
      valor_total_portfolio: intelligence.valor_total_portfolio,
      esferas_atuacao: intelligence.esferas_atuacao,
      orgaos_frequentes: intelligence.orgaos_frequentes,
    }

    const response = await this.claudeClient.chat({
      systemPrompt: SEGMENT_SPECIALIST_SYSTEM_PROMPT,
      prompt: `Analise o portfolio abaixo e identifique o segmento B2G desta empresa.
Em seguida, gere best practices específicas do segmento e benchmarks de mercado.

DADOS DA EMPRESA:
${JSON.stringify(input, null, 2)}

RETORNE exatamente este JSON:
{
  "segmento_primario": "string (ex: 'Equipamentos de Informática')",
  "subsegmentos": ["string"],
  "nicho_b2g": "string (ex: 'Fornecimento TI para prefeituras pequenas')",
  "best_practices": {
    "composicao_preco": ["string — prática específica do segmento"],
    "certificacoes": ["string — certificação relevante com impacto"],
    "portfolio_ideal": ["string — recomendação de diversificação"],
    "estrategia_preco": ["string — estratégia por tipo de órgão"],
    "margem_tipica": { "produtos": 0.0, "servicos": 0.0 },
    "riscos_comuns": ["string — risco real do segmento"]
  },
  "benchmarks_mercado": {
    "margem_media_setor": 0.0,
    "ticket_medio_segmento": 0,
    "concorrencia_media_editais": 0.0,
    "prazo_medio_pagamento_dias": 0,
    "taxa_renovacao_tipica": 0.0
  }
}`,
    })

    return this.parseJSON<SegmentData>(response.content, 'analyzeSegment')
  }

  // === CLAUDE: CHAMADA 2 — DIAGNÓSTICO COMPORTAMENTAL ===

  private async analyzeBehavior(intelligence: Intelligence, segmento: string): Promise<DiagnosisData> {
    const input = {
      segmento_detectado: segmento,
      total_contratos: intelligence.total_contratos_analisados,
      ticket_medio: intelligence.ticket_medio,
      margem_media_historica: intelligence.margem_media_historica,
      valor_total_portfolio: intelligence.valor_total_portfolio,
      orgaos_frequentes: intelligence.orgaos_frequentes,
      esferas_atuacao: intelligence.esferas_atuacao,
      padroes_renovacao: intelligence.padroes_renovacao,
      sazonalidade: intelligence.sazonalidade,
      evolucao_portfolio: intelligence.evolucao_portfolio,
    }

    const response = await this.claudeClient.chat({
      systemPrompt: SEGMENT_SPECIALIST_SYSTEM_PROMPT,
      prompt: `Faça um diagnóstico comportamental completo desta empresa fornecedora B2G.
Identifique padrões, riscos ocultos e estratégia predominante.

DADOS DA EMPRESA (segmento: ${segmento}):
${JSON.stringify(input, null, 2)}

RETORNE exatamente este JSON:
{
  "regiao_atuacao_inferida": {
    "estado_principal": "string (inferido pelos nomes dos órgãos)",
    "estados_secundarios": ["string"],
    "perfil_cliente_tipico": "string (ex: 'município pequeno <30k hab')",
    "concentracao_geografica": "alta|media|baixa"
  },
  "modelo_negocio_inferido": "string (ex: 'Integrador multimarcas', 'Revendedor exclusivo')",
  "capacidade_operacional_inferida": {
    "contratos_simultaneos_estimado": 0,
    "ticket_medio_historico": 0,
    "faturamento_mensal_estimado": 0,
    "fase_crescimento": "string (ex: 'expansão', 'consolidação', 'estabilidade')"
  },
  "estrategia_detectada": "string (ex: 'Crescimento agressivo', 'Margem premium', 'Estabilidade/Renovação')",
  "padroes_comportamentais": {
    "concentracao_portfolio": 0.0,
    "diversificacao_score": 0.0,
    "sazonalidade_detectada": [0],
    "preferencia_margem_vs_volume": "margem|volume|equilibrado",
    "riscos_identificados": ["string — risco específico identificado nos dados"]
  }
}`,
    })

    return this.parseJSON<DiagnosisData>(response.content, 'analyzeBehavior')
  }

  // === SALVAR ===

  private async saveKnowledge(
    empresa_id: string,
    intelligence: Intelligence,
    segment: SegmentData,
    diagnosis: DiagnosisData,
    startTime: number
  ): Promise<string> {
    const totalContratos = intelligence.total_contratos_analisados as number ?? 0
    const totalItens = (intelligence.portfolio_materiais as unknown[] ?? []).length

    const { data, error } = await this.supabase
      .from('empresa_segment_knowledge')
      .upsert({
        empresa_id,
        segmento_primario: segment.segmento_primario,
        subsegmentos: segment.subsegmentos,
        nicho_b2g: segment.nicho_b2g,
        best_practices: segment.best_practices,
        benchmarks_mercado: segment.benchmarks_mercado,
        regiao_atuacao_inferida: diagnosis.regiao_atuacao_inferida,
        modelo_negocio_inferido: diagnosis.modelo_negocio_inferido,
        capacidade_operacional_inferida: diagnosis.capacidade_operacional_inferida,
        estrategia_detectada: diagnosis.estrategia_detectada,
        padroes_comportamentais: diagnosis.padroes_comportamentais,
        confianca_score: this.calcularConfianca(totalContratos, totalItens),
        total_contratos_analisados: totalContratos,
        total_itens_analisados: totalItens,
        versao_agent: '1.0.0',
        tempo_processamento_ms: Date.now() - startTime,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'empresa_id',
      })
      .select('id')
      .single()

    if (error) throw error
    return (data as { id: string }).id
  }

  // === HELPERS ===

  private parseJSON<T>(content: string, caller: string): T {
    // 1. Tenta extrair de code fence primeiro
    const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fence) {
      try { return JSON.parse(fence[1].trim()) as T } catch { /* fallthrough */ }
    }
    // 2. Brace counting — não greedy, para no primeiro objeto JSON completo
    const start = content.indexOf('{')
    if (start === -1) {
      console.error(`[SegmentSpecialistAgent.${caller}] sem JSON:`, content.substring(0, 300))
      throw new Error(`Claude não retornou JSON válido em ${caller}`)
    }
    let depth = 0, end = -1
    for (let i = start; i < content.length; i++) {
      if (content[i] === '{') depth++
      else if (content[i] === '}') { depth--; if (depth === 0) { end = i; break } }
    }
    if (end === -1) throw new Error(`JSON não fechado em ${caller}`)
    try {
      return JSON.parse(content.slice(start, end + 1)) as T
    } catch (e) {
      console.error(`[SegmentSpecialistAgent.${caller}]`, content.slice(start, start + 300))
      throw e
    }
  }

  private calcularConfianca(totalContratos: number, totalItens: number): number {
    const pontos = totalContratos + totalItens / 5
    if (pontos >= 50) return 0.95
    if (pontos >= 25) return 0.85
    if (pontos >= 10) return 0.70
    if (pontos >= 5) return 0.50
    return 0.30
  }
}

export function createSegmentSpecialistAgent(supabase: SupabaseClient) {
  return new SegmentSpecialistAgent(supabase)
}
