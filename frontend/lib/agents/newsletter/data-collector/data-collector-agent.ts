import { createClient } from '@/lib/supabase/client'
import { ClaudeClient } from '@/lib/agents/core/claude-client'
import type { DataCollectorInput, DataCollectorOutput } from '@/lib/agents/core/types'

/**
 * DATA COLLECTOR AGENT
 *
 * Responsabilidades:
 * 1. Coletar dados internos (contratos, itens, portfolio)
 * 2. Identificar padrões históricos com Claude
 * 3. Salvar insights em empresa_intelligence (learning layer)
 * 4. Evoluir conhecimento a cada execução
 *
 * Não usa APIs externas — apenas dados internos do Supabase.
 */

interface ContratoRaw {
  id: string
  numero_contrato: string
  orgao_publico: string
  esfera: 'municipal' | 'estadual' | 'federal' | null
  objeto: string | null
  data_vigencia_inicio: string
  data_vigencia_fim: string
  valor_total: number
  status: string
  created_at: string
}

interface ItemRaw {
  descricao: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  margem_atual: number | null
}

interface RawData {
  contratos: ContratoRaw[]
  itens: ItemRaw[]
  periodo_inicio: Date
  periodo_fim: Date
}

export class DataCollectorAgent {
  private supabase = createClient()
  private claudeClient: ClaudeClient

  constructor() {
    this.claudeClient = new ClaudeClient({
      model: 'claude-sonnet-4-6',
      maxTokens: 4000,
      temperature: 0.3,
    })
  }

  async collect(input: DataCollectorInput): Promise<DataCollectorOutput> {
    const startTime = Date.now()
    const { empresa_id, periodo_meses = 12 } = input

    try {
      const rawData = await this.collectRawData(empresa_id, periodo_meses)
      const insights = await this.analyzePatterns(rawData)
      await this.saveIntelligence(empresa_id, insights, rawData, startTime)

      return {
        success: true,
        empresa_id,
        total_contratos: rawData.contratos.length,
        total_itens: rawData.itens.length,
        insights_gerados: this.countInsights(insights),
        tempo_processamento_ms: Date.now() - startTime,
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('[DataCollectorAgent] Erro:', error)
      return {
        success: false,
        empresa_id,
        total_contratos: 0,
        total_itens: 0,
        insights_gerados: 0,
        tempo_processamento_ms: Date.now() - startTime,
        error: msg,
      }
    }
  }

  private async collectRawData(empresa_id: string, periodo_meses: number) {
    const dataInicio = new Date()
    dataInicio.setMonth(dataInicio.getMonth() - periodo_meses)

    const { data: contratos, error: errContratos } = await this.supabase
      .from('contratos')
      .select('id, numero_contrato, orgao_publico, esfera, objeto, data_vigencia_inicio, data_vigencia_fim, valor_total, status, created_at')
      .eq('empresa_id', empresa_id)
      .gte('data_vigencia_inicio', dataInicio.toISOString().split('T')[0])
      .is('deleted_at', null)
      .order('data_vigencia_inicio', { ascending: false })

    if (errContratos) throw errContratos

    const contratoIds = (contratos ?? []).map((c: ContratoRaw) => c.id)
    let itens: ItemRaw[] = []

    if (contratoIds.length > 0) {
      const { data: itensData, error: errItens } = await this.supabase
        .from('itens_contrato')
        .select('descricao, quantidade, valor_unitario, valor_total, margem_atual')
        .in('contrato_id', contratoIds)
        .is('deleted_at', null)

      if (errItens) throw errItens
      itens = (itensData ?? []) as ItemRaw[]
    }

    return {
      contratos: (contratos ?? []) as ContratoRaw[],
      itens,
      periodo_inicio: dataInicio,
      periodo_fim: new Date(),
    }
  }

  private async analyzePatterns(rawData: RawData) {
    const { contratos, itens } = rawData

    const resumo = {
      total_contratos: contratos.length,
      total_itens: itens.length,
      valor_total: contratos.reduce((sum, c) => sum + c.valor_total, 0),
      itens_agrupados: this.groupByDescricao(itens),
      orgaos: this.groupByOrgao(contratos),
      esferas: this.groupByEsfera(contratos),
      timeline_mensal: this.buildTimeline(contratos),
      status_distribuicao: this.groupByStatus(contratos),
    }

    const response = await this.claudeClient.chat({
      systemPrompt: 'Você é o Data Collector Agent do DUO Governance. Responda APENAS com JSON válido, sem markdown.',
      prompt: `Analise os dados abaixo e identifique padrões de negócio:

DADOS:
${JSON.stringify(resumo, null, 2)}

RETORNE JSON com exatamente esta estrutura:
{
  "portfolio_materiais": [{"descricao": "X", "frequencia": N, "valor_total": V}],
  "padroes_renovacao": {"taxa_renovacao": 0.X, "prazo_medio_dias": N, "observacao": "..."},
  "sazonalidade": {"meses_pico": [3, 9], "meses_baixa": [1], "observacao": "..."},
  "orgaos_frequentes": [{"orgao": "X", "total_contratos": N, "valor_total": V}],
  "esferas_atuacao": [{"esfera": "municipal", "total": N}],
  "ticket_medio": V,
  "margem_media": 0.X,
  "valor_total_portfolio": V,
  "evolucao_portfolio": {"crescimento_estimado": 0.X, "diversificacao_score": 0.X, "observacao": "..."}
}`,
    })

    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Claude não retornou JSON válido')

    return JSON.parse(jsonMatch[0])
  }

  private async saveIntelligence(
    empresa_id: string,
    insights: Record<string, unknown>,
    rawData: RawData,
    startTime: number
  ) {
    const { error } = await this.supabase.from('empresa_intelligence').insert({
      empresa_id,
      analise_data: new Date().toISOString(),
      periodo_inicio: rawData.periodo_inicio.toISOString().split('T')[0],
      periodo_fim: rawData.periodo_fim.toISOString().split('T')[0],
      total_contratos_analisados: rawData.contratos.length,
      portfolio_materiais: insights.portfolio_materiais,
      padroes_renovacao: insights.padroes_renovacao,
      sazonalidade: insights.sazonalidade,
      orgaos_frequentes: insights.orgaos_frequentes,
      esferas_atuacao: insights.esferas_atuacao,
      ticket_medio: insights.ticket_medio,
      margem_media_historica: insights.margem_media,
      valor_total_portfolio: insights.valor_total_portfolio,
      evolucao_portfolio: insights.evolucao_portfolio,
      confianca_score: this.calculateConfidence(rawData),
      total_pontos_dados: rawData.contratos.length + rawData.itens.length,
      insights_totais: this.countInsights(insights),
      versao_agent: '1.0.0',
      tempo_processamento_ms: Date.now() - startTime,
    })

    if (error) throw error
  }

  // Helpers
  private groupByDescricao(itens: ItemRaw[]) {
    const grouped: Record<string, { frequencia: number; valor_total: number }> = {}
    itens.forEach((item) => {
      if (!grouped[item.descricao]) grouped[item.descricao] = { frequencia: 0, valor_total: 0 }
      grouped[item.descricao].frequencia++
      grouped[item.descricao].valor_total += item.valor_total
    })
    return Object.entries(grouped)
      .map(([descricao, data]) => ({ descricao, ...data }))
      .sort((a, b) => b.valor_total - a.valor_total)
      .slice(0, 10)
  }

  private groupByOrgao(contratos: ContratoRaw[]) {
    const grouped: Record<string, { total: number; valor_total: number }> = {}
    contratos.forEach((c) => {
      if (!grouped[c.orgao_publico]) grouped[c.orgao_publico] = { total: 0, valor_total: 0 }
      grouped[c.orgao_publico].total++
      grouped[c.orgao_publico].valor_total += c.valor_total
    })
    return Object.entries(grouped)
      .map(([orgao, data]) => ({ orgao, total_contratos: data.total, valor_total: data.valor_total }))
      .sort((a, b) => b.total_contratos - a.total_contratos)
      .slice(0, 5)
  }

  private groupByEsfera(contratos: ContratoRaw[]) {
    const grouped: Record<string, number> = {}
    contratos.forEach((c) => {
      const esfera = c.esfera ?? 'não informado'
      grouped[esfera] = (grouped[esfera] || 0) + 1
    })
    return Object.entries(grouped).map(([esfera, total]) => ({ esfera, total }))
  }

  private groupByStatus(contratos: ContratoRaw[]) {
    const grouped: Record<string, number> = {}
    contratos.forEach((c) => {
      grouped[c.status] = (grouped[c.status] || 0) + 1
    })
    return grouped
  }

  private buildTimeline(contratos: ContratoRaw[]) {
    const timeline: Record<number, number> = {}
    contratos.forEach((c) => {
      const mes = new Date(c.data_vigencia_inicio).getMonth() + 1
      timeline[mes] = (timeline[mes] || 0) + 1
    })
    return timeline
  }

  private calculateConfidence(rawData: { contratos: ContratoRaw[]; itens: ItemRaw[] }): number {
    const total = rawData.contratos.length + rawData.itens.length
    if (total >= 100) return 0.95
    if (total >= 50) return 0.80
    if (total >= 20) return 0.65
    if (total >= 10) return 0.50
    return 0.30
  }

  private countInsights(insights: Record<string, unknown>): number {
    return [
      'portfolio_materiais',
      'padroes_renovacao',
      'sazonalidade',
      'orgaos_frequentes',
      'esferas_atuacao',
      'ticket_medio',
      'evolucao_portfolio',
    ].filter((k) => insights[k] !== undefined && insights[k] !== null).length
  }
}

export function createDataCollectorAgent() {
  return new DataCollectorAgent()
}
