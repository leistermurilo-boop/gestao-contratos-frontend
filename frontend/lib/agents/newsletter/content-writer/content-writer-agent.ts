import type { SupabaseClient } from '@supabase/supabase-js'
import { ClaudeClient } from '@/lib/agents/core/claude-client'
import type { NewsletterHTML } from '@/lib/agents/core/types'
import { decideTema } from './email-themes'
import { renderEmailTemplate } from './email-template'
import type { EmailTemplateParams, EmailAlerta, EmailInsight, EmailRadarB2G, EmailConceito, EmailROI } from './email-template'

/**
 * CONTENT WRITER AGENT (Sprint 4C — v1.2.0)
 *
 * Arquitetura:
 * 1. Claude gera metadados JSON ricos (conteúdo textual)
 * 2. renderEmailTemplate() constrói o HTML com identidade visual fixa
 *
 * Por que split: claude-sonnet-4-6 tem ~8192 tokens de output.
 * HTML + JSON wrapper excedia esse limite. Template TypeScript resolve:
 * - Claude foca em conteúdo (~500 tokens)
 * - Template garante identidade visual DUO™ sempre consistente
 * - Variação visual via sistema de temas (ALERTA / OPORTUNIDADE / MACRO / PADRÃO)
 */

// === TIPOS INTERNOS ===

export interface ContentWriterInput {
  empresa_id: string
  insights_id?: string
}

export interface ContentWriterOutput {
  success: boolean
  empresa_id: string
  draft_id?: string
  subject?: string
  tempo_processamento_ms: number
  error?: string
}

interface NewsletterMetaRaw {
  subject: string
  preview_text: string
  numero_destaque: { valor: string; label: string }
  alertas: EmailAlerta[]
  insights: EmailInsight[]
  radar_b2g: EmailRadarB2G[]
  conceito: EmailConceito | null
  roi: EmailROI | null
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
      const edicao = await this.getProximaEdicao(empresa_id)

      // Claude gera apenas o conteúdo textual rico (~500 tokens)
      const meta = await this.generateMeta(insights, intelligence, empresaNome)

      // Template TypeScript constrói o HTML com identidade DUO™
      const tema = decideTema({
        insights_criticos: insights.insights_criticos as number ?? 0,
        radar_b2g_count: meta.radar_b2g.length,
        has_macro_dominante: Array.isArray(insights.insights_macro) && (insights.insights_macro as unknown[]).length > 0,
      })

      // Hora de Brasília (Vercel roda em UTC — UTC-3 sem horário de verão desde 2019)
      const nowBRT = new Date(Date.now() - 3 * 60 * 60 * 1000)
      const hoje = nowBRT.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })

      const templateParams: EmailTemplateParams = {
        tema,
        edicao,
        data_formatada: hoje,
        empresa_nome: empresaNome,
        numero_destaque: meta.numero_destaque,
        alertas: meta.alertas,
        insights: meta.insights,
        radar_b2g: meta.radar_b2g,
        ipca_12m: insights.ipca_12m as number | null ?? null,
        selic_atual: insights.selic_atual as number | null ?? null,
        conceito: meta.conceito,
        roi: meta.roi,
        cta_principal: meta.cta_principal,
        nivel_maturidade: intelligence ? 'Estratégico' : undefined,
        // BUG 6 fix: calcular baseado em fontes reais disponíveis nos insights
        progresso_maturidade: intelligence ? this.calcularProgresso(insights) : undefined,
      }

      const html = renderEmailTemplate(templateParams)
      const newsletter = this.assembleNewsletter(meta, html, empresaNome)
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
      .select('razao_social, nome_fantasia')
      .eq('id', empresa_id)
      .single()
    const d = data as { razao_social?: string; nome_fantasia?: string } | null
    return d?.nome_fantasia ?? d?.razao_social ?? 'sua empresa'
  }

  private async getProximaEdicao(empresa_id: string): Promise<number> {
    const { count } = await this.supabase
      .from('newsletter_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa_id)
    return (count ?? 0) + 1
  }

  // === CLAUDE: CONTEÚDO TEXTUAL RICO ===

  private async generateMeta(
    insights: NewsletterInsights,
    intelligence: Intelligence | null,
    empresaNome: string
  ): Promise<NewsletterMetaRaw> {
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
      ticket_medio: intelligence?.ticket_medio ?? null,
    }

    const response = await this.claudeClient.chat({
      systemPrompt: `Você é redator sênior da newsletter Radar DUO™ — consultoria B2G brasileira.

TOM OBRIGATÓRIO:
- Dados concretos, não promessas vagas
- Urgência calculada, não sensacionalismo
- Comparação clara (empresa vs mercado)
- CTAs específicos e acionáveis

Responda APENAS com JSON válido. Sem markdown, sem texto extra.`,

      prompt: `Gere o conteúdo editorial da newsletter para ${empresaNome}.

DADOS:
ATENÇÃO: ipca_12m = IPCA acumulado nos últimos 12 meses em % (ex: 3.81 = 3.81% ao ano). Use EXATAMENTE o valor fornecido. NÃO calcule IPCA por conta própria. NÃO some meses.
${JSON.stringify(contexto, null, 2)}

RETORNE:
{
  "subject": "string (max 60 chars, número concreto, ex: '3 alertas críticos + R$ 1.2M em oportunidades')",
  "preview_text": "string (max 100 chars, gancho forte)",
  "numero_destaque": {
    "valor": "string (ex: 'R$ 2,3M' ou '4 alertas' ou '8.5%')",
    "label": "string (ex: 'em oportunidades B2G detectadas esta semana')"
  },
  "alertas": [
    {
      "titulo": "string (específico, ex: 'Contrato PM-089 vence em 18 dias')",
      "descricao": "string (1-2 frases com dados concretos)",
      "acao": "string (ação específica e acionável)",
      "prioridade": "critica|alta|media|baixa"
    }
  ],
  "insights": [
    {
      "titulo": "string (específico com números)",
      "contexto": "string (cruzamento de dados interno × API)",
      "impacto": "string (impacto financeiro estimado)"
    }
  ],
  "radar_b2g": [
    {
      "oportunidade": "string (nome do edital/pregão)",
      "prazo": "string (ex: '12 dias' ou 'vence 25/03')",
      "relevancia": "string (por que é relevante para este portfolio)"
    }
  ],
  "conceito": {
    "titulo": "string (conceito educacional desta edição)",
    "explicacao": "string (2-3 frases em linguagem acessível, com base legal se aplicável)",
    "exemplo": "string (exemplo real com números)",
    "cta": "string (como o DUO ajuda com isso)"
  },
  "roi": {
    "valor_total": 0,
    "breakdown": [
      { "descricao": "string", "valor": 0 }
    ],
    "custo_duo": 540
  },
  "cta_principal": "string (ação mais urgente da semana)",
  "conceitos_ensinados": ["string"],
  "roi_demonstrado": 0
}`,
    })

    let raw = response.content
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fence) raw = fence[1].trim()
    // BUG 17: greedy regex substituída por brace-counting (mesmo padrão do BUG 14 fix)
    const start = raw.indexOf('{')
    if (start === -1) {
      console.error('[ContentWriterAgent] Claude raw:', raw.substring(0, 500))
      throw new Error('Claude não retornou JSON válido nos metadados')
    }
    let depth = 0, end = -1
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === '{') depth++
      else if (raw[i] === '}') { depth--; if (depth === 0) { end = i; break } }
    }
    if (end === -1) throw new Error('JSON não fechado em generateMeta')
    return JSON.parse(raw.slice(start, end + 1)) as NewsletterMetaRaw
  }

  // === HELPERS ===

  private calcularProgresso(insights: NewsletterInsights): number {
    const fontes = [
      insights.ipca_12m !== null && insights.ipca_12m !== undefined,
      insights.selic_atual !== null && insights.selic_atual !== undefined,
      Array.isArray(insights.dados_pncp) && (insights.dados_pncp as unknown[]).length > 0,
      Array.isArray(insights.dados_ibge) && (insights.dados_ibge as unknown[]).length > 0,
    ]
    const disponiveis = fontes.filter(Boolean).length
    return Math.round((disponiveis / fontes.length) * 100)
  }

  // === MONTAGEM ===

  private assembleNewsletter(meta: NewsletterMetaRaw, html: string, empresaNome: string): NewsletterHTML {
    const plainText = [
      `Assunto: ${meta.subject}`,
      '',
      'ALERTAS:',
      ...meta.alertas.map(a => `- ${a.titulo}: ${a.acao}`),
      '',
      'INSIGHTS:',
      ...meta.insights.map(i => `- ${i.titulo}: ${i.impacto}`),
      '',
      'RADAR B2G:',
      ...meta.radar_b2g.map(r => `- ${r.oportunidade} (${r.prazo})`),
      '',
      `AÇÃO PRINCIPAL: ${meta.cta_principal}`,
    ].join('\n')

    const palavras = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length

    return {
      subject: meta.subject,
      preview_text: meta.preview_text,
      html,
      plain_text: plainText,
      metadata: {
        palavras,
        tempo_leitura_estimado: `${Math.max(1, Math.round(palavras / 200))} min`,
        secoes: 8,
        ctas: 2,
      },
      conceitos_ensinados: meta.conceitos_ensinados,
      roi_demonstrado: meta.roi_demonstrado || undefined,
      personalizacao: {
        empresa: empresaNome,
        contratos_referenciados: meta.alertas.length,
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
        periodo_referencia: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().split('T')[0],
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
        versao_agent: '1.2.0',
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
