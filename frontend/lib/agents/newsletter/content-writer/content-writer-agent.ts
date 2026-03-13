import type { SupabaseClient } from '@supabase/supabase-js'
import { ClaudeClient } from '@/lib/agents/core/claude-client'
import type { NewsletterHTML } from '@/lib/agents/core/types'

/**
 * CONTENT WRITER AGENT (Sprint 4C)
 *
 * 1. Lê newsletter_insights (output do Insight Analyzer)
 * 2. Lê empresa_intelligence para contexto de personalização
 * 3. Gera newsletter em 2 chamadas Claude separadas:
 *    - Chamada 1: metadados JSON pequeno (~300 tokens)
 *    - Chamada 2: HTML body direto, sem JSON wrapper (~3000-5000 tokens)
 * 4. Monta NewsletterHTML localmente e salva em newsletter_drafts
 *
 * Motivo do split: claude-sonnet-4-6 tem limite ~8192 tokens de output.
 * Newsletter HTML completa + JSON wrapper excede esse limite causando truncação.
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

interface NewsletterMeta {
  subject: string
  preview_text: string
  alertas_criticos: Array<{ titulo: string; descricao: string; acao: string }>
  insights_semana: Array<{ titulo: string; contexto: string; impacto: string }>
  radar_b2g: Array<{ oportunidade: string; prazo: string; relevancia: string }>
  cta_principal: string
  conceitos_ensinados: string[]
  roi_demonstrado: number
}

type NewsletterInsights = Record<string, unknown>
type Intelligence = Record<string, unknown>

// === AGENT ===

export class ContentWriterAgent {
  private claudeClient: ClaudeClient

  constructor(private supabase: SupabaseClient) {
    this.claudeClient = new ClaudeClient({
      model: 'claude-sonnet-4-6',
      maxTokens: 4000,
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

      // Chamada 1: metadados JSON pequeno
      const meta = await this.generateMeta(insights, intelligence, empresaNome)

      // Chamada 2: HTML body direto (sem JSON wrapper)
      const htmlBody = await this.generateHTML(meta, empresaNome)

      const newsletter = this.assembleNewsletter(meta, htmlBody, empresaNome)
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

  // === CHAMADA 1: METADADOS JSON (~300 tokens output) ===

  private async generateMeta(
    insights: NewsletterInsights,
    intelligence: Intelligence | null,
    empresaNome: string
  ): Promise<NewsletterMeta> {
    const contexto = {
      empresa_nome: empresaNome,
      insights_precificacao: insights.insights_precificacao,
      insights_radar_b2g: insights.insights_radar_b2g,
      insights_macro: insights.insights_macro,
      insights_regionais: insights.insights_regionais,
      ipca_12m: insights.ipca_12m,
      selic_atual: insights.selic_atual,
      total_insights: insights.total_insights,
      insights_criticos: insights.insights_criticos,
      total_contratos: intelligence?.total_contratos_analisados ?? null,
      margem_media: intelligence?.margem_media_historica ?? null,
    }

    const response = await this.claudeClient.chat({
      systemPrompt: 'Você é um analista B2G. Responda APENAS com JSON válido. Sem markdown, sem texto extra.',
      prompt: `Extraia os metadados de newsletter para ${empresaNome}. Seja conciso — máximo 3 itens por array.

DADOS:
${JSON.stringify(contexto, null, 2)}

RETORNE:
{
  "subject": "string (max 60 chars, mencionar alertas críticos)",
  "preview_text": "string (max 100 chars)",
  "alertas_criticos": [{ "titulo": "string", "descricao": "string (1 frase)", "acao": "string (1 frase)" }],
  "insights_semana": [{ "titulo": "string", "contexto": "string (1 frase)", "impacto": "string (1 frase)" }],
  "radar_b2g": [{ "oportunidade": "string", "prazo": "string", "relevancia": "string (1 frase)" }],
  "cta_principal": "string (ação mais urgente)",
  "conceitos_ensinados": ["string"],
  "roi_demonstrado": 0
}`,
    })

    let raw = response.content
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fence) raw = fence[1].trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Chamada 1 (meta): Claude não retornou JSON válido')
    return JSON.parse(jsonMatch[0]) as NewsletterMeta
  }

  // === CHAMADA 2: HTML BODY DIRETO (~3000 tokens output) ===

  private async generateHTML(meta: NewsletterMeta, empresaNome: string): Promise<string> {
    const response = await this.claudeClient.chat({
      systemPrompt: `Você é um desenvolvedor de emails HTML.
Gere SOMENTE o HTML body do email — sem DOCTYPE, sem <html>, sem JSON, sem markdown.
Use inline CSS minimalista. Estrutura clara. Max 3000 tokens.`,

      prompt: `Gere o body HTML de newsletter para ${empresaNome}.

METADADOS:
${JSON.stringify(meta, null, 2)}

ESTRUTURA (div container max-width:650px):
1. Header navy (#0F172A): "DUO Governance" + data de hoje
2. Alertas críticos (fundo #FEF2F2, borda #EF4444): lista de alertas_criticos
3. Insights da semana (fundo #F8FAFC): lista de insights_semana com contexto educacional (fundo #F0FDF4, borda esq #10B981)
4. Radar B2G™ (fundo #ECFDF5): lista de radar_b2g
5. Ação principal: cta_principal em destaque verde #10B981
6. Disclaimer (fundo #FEF3C7): "Dicas baseadas em dados. Não é consultoria jurídica."
7. Footer: "DUO Governance | Desinscrever"

Retorne APENAS o HTML, começando com <div style="...">`,
    })

    // HTML direto — extrair apenas o bloco <div...> se vier com texto extra
    const htmlMatch = response.content.match(/<div[\s\S]*/)
    return htmlMatch ? htmlMatch[0] : response.content
  }

  // === MONTAGEM LOCAL ===

  private assembleNewsletter(meta: NewsletterMeta, htmlBody: string, empresaNome: string): NewsletterHTML {
    const plainText = [
      `Assunto: ${meta.subject}`,
      '',
      'ALERTAS CRÍTICOS:',
      ...meta.alertas_criticos.map(a => `- ${a.titulo}: ${a.acao}`),
      '',
      'INSIGHTS DA SEMANA:',
      ...meta.insights_semana.map(i => `- ${i.titulo}: ${i.impacto}`),
      '',
      'RADAR B2G:',
      ...meta.radar_b2g.map(r => `- ${r.oportunidade} (${r.prazo})`),
      '',
      `AÇÃO PRINCIPAL: ${meta.cta_principal}`,
    ].join('\n')

    const palavras = htmlBody.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length

    return {
      subject: meta.subject,
      preview_text: meta.preview_text,
      html: htmlBody,
      plain_text: plainText,
      metadata: {
        palavras,
        tempo_leitura_estimado: `${Math.max(1, Math.round(palavras / 200))} min`,
        secoes: 5,
        ctas: 1,
      },
      conceitos_ensinados: meta.conceitos_ensinados,
      roi_demonstrado: meta.roi_demonstrado || undefined,
      personalizacao: {
        empresa: empresaNome,
        contratos_referenciados: meta.alertas_criticos.length,
        orgaos_mencionados: meta.radar_b2g.length,
        historico_usado: false,
      },
    }
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
        versao_agent: '1.1.0',
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
