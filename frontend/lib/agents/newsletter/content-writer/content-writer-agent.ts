import type { SupabaseClient } from '@supabase/supabase-js'
import { ClaudeClient } from '@/lib/agents/core/claude-client'
import type { NewsletterHTML } from '@/lib/agents/core/types'

/**
 * CONTENT WRITER AGENT (Sprint 4C)
 *
 * 1. Lê newsletter_insights (output do Insight Analyzer)
 * 2. Lê empresa_intelligence para contexto de personalização
 * 3. Gera newsletter HTML completa com Claude
 * 4. Salva em newsletter_drafts
 *
 * Output: HTML pronto para envio via Resend
 */

// === TIPOS INTERNOS ===

export interface ContentWriterInput {
  empresa_id: string
  insights_id?: string // se omitido, usa o mais recente
}

export interface ContentWriterOutput {
  success: boolean
  empresa_id: string
  draft_id?: string
  subject?: string
  tempo_processamento_ms: number
  error?: string
}

type NewsletterInsights = Record<string, unknown>
type Intelligence = Record<string, unknown>

// === AGENT ===

export class ContentWriterAgent {
  private claudeClient: ClaudeClient

  constructor(private supabase: SupabaseClient) {
    this.claudeClient = new ClaudeClient({
      model: 'claude-sonnet-4-6',
      maxTokens: 8000,
      temperature: 0.6,
    })
  }

  async write(input: ContentWriterInput): Promise<ContentWriterOutput> {
    const startTime = Date.now()
    const { empresa_id } = input

    try {
      const insights = await this.getInsights(empresa_id, input.insights_id)
      if (!insights) {
        return {
          success: false,
          empresa_id,
          error: 'Nenhum newsletter_insights encontrado. Execute o Insight Analyzer primeiro.',
          tempo_processamento_ms: Date.now() - startTime,
        }
      }

      const intelligence = await this.getLatestIntelligence(empresa_id)
      const empresaNome = await this.getEmpresaNome(empresa_id)

      const newsletter = await this.generateNewsletter(insights, intelligence, empresaNome)
      const draftId = await this.saveDraft(empresa_id, insights.id as string, newsletter, startTime)

      return {
        success: true,
        empresa_id,
        draft_id: draftId,
        subject: newsletter.subject,
        tempo_processamento_ms: Date.now() - startTime,
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('[ContentWriterAgent]', error)
      return {
        success: false,
        empresa_id,
        error: msg,
        tempo_processamento_ms: Date.now() - startTime,
      }
    }
  }

  // === SUPABASE ===

  private async getInsights(empresa_id: string, insights_id?: string): Promise<NewsletterInsights | null> {
    let query = this.supabase
      .from('newsletter_insights')
      .select('*')
      .eq('empresa_id', empresa_id)

    if (insights_id) {
      query = query.eq('id', insights_id)
    } else {
      query = query.order('gerado_em', { ascending: false })
    }

    const { data, error } = await query.limit(1).single()
    if (error) throw error
    return data as NewsletterInsights
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

  private async getEmpresaNome(empresa_id: string): Promise<string> {
    const { data } = await this.supabase
      .from('empresas')
      .select('nome')
      .eq('id', empresa_id)
      .single()
    return (data as { nome?: string } | null)?.nome ?? 'sua empresa'
  }

  // === GERAÇÃO DE HTML COM CLAUDE ===

  private async generateNewsletter(
    insights: NewsletterInsights,
    intelligence: Intelligence | null,
    empresaNome: string
  ): Promise<NewsletterHTML> {
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    const contexto = {
      empresa_nome: empresaNome,
      data_newsletter: hoje,
      insights_precificacao: insights.insights_precificacao,
      insights_radar_b2g: insights.insights_radar_b2g,
      insights_macro: insights.insights_macro,
      insights_regionais: insights.insights_regionais,
      ipca_12m: insights.ipca_12m,
      selic_atual: insights.selic_atual,
      total_insights: insights.total_insights,
      insights_criticos: insights.insights_criticos,
      confianca_score: insights.confianca_score,
      // Contexto histórico (se disponível)
      total_contratos: intelligence?.total_contratos_analisados ?? null,
      ticket_medio: intelligence?.ticket_medio ?? null,
      margem_media: intelligence?.margem_media_historica ?? null,
      total_analises: (intelligence?.total_pontos_dados as number ?? 0),
    }

    const response = await this.claudeClient.chat({
      systemPrompt: `Você é o Content Writer Agent do DUO Governance — sistema de newsletter para empresas fornecedoras B2G brasileiras.
Gere HTML de email profissional, responsivo e persuasivo. Use inline CSS (não external).
Responda APENAS com JSON válido (sem markdown). O HTML deve ser completo e funcional.`,

      prompt: `Gere uma newsletter HTML completa para ${empresaNome} baseada nos insights abaixo.

DADOS:
${JSON.stringify(contexto, null, 2)}

ESTRUTURA OBRIGATÓRIA do HTML:
1. Header: logo DUO Governance (texto, fundo #0F172A), data
2. Resumo executivo: cards com números-chave (contratos, alertas críticos, oportunidades)
3. Alertas críticos: insights de prioridade "critica" ou "alta" dos insights_precificacao
4. Insights da semana: todos os insights com contexto educacional de cada um
5. Radar B2G™: insights_radar_b2g com editais/oportunidades do PNCP
6. Contexto de mercado: insights_macro (Selic, IPCA)
7. Oportunidades regionais: insights_regionais
8. Lista de ações da semana: top 4 ações prioritárias
9. Seção de aprendizado contínuo: "${contexto.total_analises} pontos de dados analisados"
10. Disclaimer legal: dicas baseadas em dados, não consultoria jurídica
11. Footer: DUO Governance, desinscrever

REGRAS DE DESIGN:
- max-width: 650px, margin: 0 auto
- Cores: navy #0F172A, emerald #10B981, fundo branco
- Caixas educacionais: fundo #F0FDF4, borda esquerda #10B981
- Alertas críticos: fundo #FEF2F2, borda #EF4444
- Disclaimer: fundo #FEF3C7, borda #F59E0B
- Font: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

RETORNE exatamente este JSON:
{
  "subject": "string — assunto do email (max 60 chars, mencionar número de alertas críticos)",
  "preview_text": "string — texto de preview (max 100 chars)",
  "html": "string — HTML completo do email",
  "plain_text": "string — versão texto simples (resumida)",
  "metadata": {
    "palavras": 0,
    "tempo_leitura_estimado": "X min",
    "secoes": 0,
    "ctas": 0
  },
  "conceitos_ensinados": ["array de conceitos educacionais mencionados"],
  "roi_demonstrado": 0,
  "personalizacao": {
    "empresa": "${empresaNome}",
    "contratos_referenciados": 0,
    "orgaos_mencionados": 0,
    "historico_usado": false
  }
}`,
    })

    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Claude não retornou JSON válido')
    return JSON.parse(jsonMatch[0]) as NewsletterHTML
  }

  // === SALVAR ===

  private async saveDraft(
    empresa_id: string,
    insights_id: string,
    newsletter: NewsletterHTML,
    startTime: number
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('newsletter_drafts')
      .insert({
        empresa_id,
        insights_id,
        periodo_referencia: new Date().toISOString().split('T')[0],
        subject: newsletter.subject,
        preview_text: newsletter.preview_text,
        html: newsletter.html,
        plain_text: newsletter.plain_text,
        palavras: newsletter.metadata.palavras,
        tempo_leitura_estimado: newsletter.metadata.tempo_leitura_estimado,
        secoes: newsletter.metadata.secoes,
        ctas: newsletter.metadata.ctas,
        conceitos_ensinados: newsletter.conceitos_ensinados,
        roi_demonstrado: newsletter.roi_demonstrado ?? null,
        contratos_referenciados: newsletter.personalizacao.contratos_referenciados,
        orgaos_mencionados: newsletter.personalizacao.orgaos_mencionados,
        historico_usado: newsletter.personalizacao.historico_usado,
        versao_agent: '1.0.0',
        tempo_processamento_ms: Date.now() - startTime,
      })
      .select('id')
      .single()

    if (error) throw error
    return (data as { id: string }).id
  }
}

export function createContentWriterAgent(supabase: SupabaseClient) {
  return new ContentWriterAgent(supabase)
}
