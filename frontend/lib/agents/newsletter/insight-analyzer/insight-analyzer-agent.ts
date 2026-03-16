import type { SupabaseClient } from '@supabase/supabase-js'
import { ClaudeClient } from '@/lib/agents/core/claude-client'
import type { InsightAnalyzerInput, InsightAnalyzerOutput } from '@/lib/agents/core/types'

/**
 * INSIGHT ANALYZER AGENT (Sprint 4B)
 *
 * 1. Lê empresa_intelligence (output do Data Collector)
 * 2. Consulta APIs externas: IPCA, Bacen/Selic, PNCP, IBGE
 * 3. Cruza dados + gera insights com Claude
 * 4. Adiciona contexto educacional a cada insight
 * 5. Salva em newsletter_insights
 *
 * APIs com fallback via Promise.allSettled — falha parcial não para o agent.
 */

// === TIMEZONE BRASÍLIA ===

/**
 * Retorna a data atual no fuso de Brasília (BRT = UTC-3, sem horário de verão desde 2019).
 * Servidores Vercel rodam em UTC — sem este ajuste, datas ficam 3h adiantadas.
 */
function nowBrasilia(): Date {
  return new Date(Date.now() - 3 * 60 * 60 * 1000)
}

/** Formata Date como 'YYYY-MM-DD' usando hora de Brasília */
function dateBrasilia(d: Date): string {
  return d.toISOString().split('T')[0]
}

// === TIPOS INTERNOS ===

interface IPCAData {
  acumulado_12m: number
  mes_referencia: string
}

interface SelicData {
  valor: number
  tendencia: 'alta' | 'queda' | 'estavel'
}

interface PNCPEdital {
  numero: string
  orgao: string
  objeto: string
  valor_estimado: number
  data_abertura: string
  match_score: number
}

interface IBGEData {
  municipio: string
  pib: number | null
  populacao: number | null
}

interface ExternalData {
  ipca: IPCAData | null
  selic: SelicData | null
  pncp: PNCPEdital[]
  ibge: IBGEData[]
  apis_consultadas: string[]
  apis_com_erro: string[]
}

type Intelligence = Record<string, unknown>

// === AGENT ===

export class InsightAnalyzerAgent {
  private claudeClient: ClaudeClient

  constructor(private supabase: SupabaseClient) {
    this.claudeClient = new ClaudeClient({
      model: 'claude-sonnet-4-6',
      maxTokens: 16000,  // BUG 15b: 8000 ainda insuficiente — limite + prompt conciso evitam timeout Vercel
      temperature: 0.4,
    })
  }

  async analyze(input: InsightAnalyzerInput): Promise<InsightAnalyzerOutput> {
    const startTime = Date.now()
    const { empresa_id } = input

    try {
      const intelligence = await this.getLatestIntelligence(empresa_id)
      if (!intelligence) {
        return {
          success: false,
          empresa_id,
          error: 'Nenhum empresa_intelligence encontrado. Execute o Data Collector primeiro.',
          total_insights: 0,
          insights_criticos: 0,
          tempo_processamento_ms: Date.now() - startTime,
        }
      }

      const externalData = await this.fetchExternalData(intelligence)
      // BUG 5 fix: calcular confiança antes de gerar insights para passar ao Claude
      const apisOk = externalData.apis_consultadas.length
      const confianca_score = apisOk >= 3 ? 0.85 : apisOk >= 2 ? 0.65 : 0.40
      // Sprint 4F: enriquecer com knowledge base do segmento (graceful degradation)
      const segmentKnowledge = await this.getSegmentKnowledge(empresa_id)
      const insights = await this.generateInsights(intelligence, externalData, confianca_score, segmentKnowledge)
      await this.saveInsights(empresa_id, intelligence.id as string, insights, externalData, confianca_score, startTime)

      return {
        success: true,
        empresa_id,
        intelligence_id: intelligence.id as string,
        total_insights: this.countInsights(insights),
        insights_criticos: this.countCriticos(insights),
        apis_consultadas: externalData.apis_consultadas,
        apis_com_erro: externalData.apis_com_erro,
        tempo_processamento_ms: Date.now() - startTime,
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('[InsightAnalyzerAgent]', error)
      return {
        success: false,
        empresa_id,
        error: msg,
        total_insights: 0,
        insights_criticos: 0,
        tempo_processamento_ms: Date.now() - startTime,
      }
    }
  }

  // === SUPABASE ===

  private async getLatestIntelligence(empresa_id: string): Promise<Intelligence | null> {
    const { data, error } = await this.supabase
      .from('empresa_intelligence')
      .select('*')
      .eq('empresa_id', empresa_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (error) throw error
    return data as Intelligence
  }

  // === APIS EXTERNAS ===

  private async fetchExternalData(intelligence: Intelligence): Promise<ExternalData> {
    const apis_consultadas: string[] = []
    const apis_com_erro: string[] = []

    const [ipca, selic, pncp, ibge] = await Promise.allSettled([
      this.fetchIPCA(),
      this.fetchSelic(),
      this.fetchPNCP(intelligence),
      this.fetchIBGE(),
    ])

    const resolve = <T>(result: PromiseSettledResult<T>, name: string): T | null => {
      if (result.status === 'fulfilled') {
        apis_consultadas.push(name)
        return result.value
      }
      console.warn(`[InsightAnalyzer] API ${name} falhou:`, result.reason)
      apis_com_erro.push(name)
      return null
    }

    return {
      ipca: resolve(ipca, 'IPCA/IBGE'),
      selic: resolve(selic, 'Bacen/Selic'),
      pncp: resolve(pncp, 'PNCP') ?? [],
      ibge: resolve(ibge, 'IBGE/PIB') ?? [],
      apis_consultadas,
      apis_com_erro,
    }
  }

  private async fetchIPCA(): Promise<IPCAData> {
    // BUG 2 fix: período dinâmico — usa hora de Brasília (Vercel roda em UTC)
    const now = nowBrasilia()
    const anoAtual = now.getUTCFullYear()
    const mesAtual = String(now.getUTCMonth() + 1).padStart(2, '0')
    const periodoInicio = `${anoAtual}01`
    const periodoFim = `${anoAtual}${mesAtual}`

    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/${periodoInicio}-${periodoFim}/variaveis/2265?localidades=N1[all]`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) throw new Error(`IPCA HTTP ${res.status}`)
    const json = await res.json() as Array<{
      resultados: Array<{ series: Array<{ serie: Record<string, string> }> }>
    }>
    const serie = json[0]?.resultados?.[0]?.series?.[0]?.serie ?? {}
    const chaves = Object.keys(serie)
    // BUG 1 fix: variável 2265 já é acumulado 12m — usar último valor, não somar
    const ultimaChave = chaves[chaves.length - 1] ?? ''
    const ultimo = parseFloat(serie[ultimaChave] || '0')
    const mesReferencia = ultimaChave ? `${ultimaChave.slice(0, 4)}-${ultimaChave.slice(4, 6)}` : `${anoAtual}-${mesAtual}`
    return { acumulado_12m: parseFloat(ultimo.toFixed(2)), mes_referencia: mesReferencia }
  }

  private async fetchSelic(): Promise<SelicData> {
    const res = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/3?formato=json',
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) throw new Error(`Bacen HTTP ${res.status}`)
    const json = await res.json() as Array<{ valor: string }>
    const valores = json.map((d) => parseFloat(d.valor))
    const atual = valores[valores.length - 1]
    const anterior = valores[0]
    const tendencia: SelicData['tendencia'] =
      atual > anterior ? 'alta' : atual < anterior ? 'queda' : 'estavel'
    return { valor: atual, tendencia }
  }

  private async fetchPNCP(intelligence: Intelligence): Promise<PNCPEdital[]> {
    const materiais = intelligence.portfolio_materiais as Array<{ descricao: string }> | null
    if (!materiais?.length) return []

    const top3 = materiais.slice(0, 3)
    // Datas em hora de Brasília (evita erro de dia na virada meia-noite UTC)
    const hoje = dateBrasilia(nowBrasilia())
    const em30dias = dateBrasilia(new Date(nowBrasilia().getTime() + 30 * 86400000))
    const resultados: PNCPEdital[] = []

    for (const material of top3) {
      try {
        // BUG 3 fix: formato yyyyMMdd, tamanhoPagina mínimo 10, codigoModalidadeContratacao obrigatório
        const params = new URLSearchParams({
          q: material.descricao.substring(0, 50),
          dataInicial: hoje.replace(/-/g, ''),
          dataFinal: em30dias.replace(/-/g, ''),
          pagina: '1',
          tamanhoPagina: '10',
          codigoModalidadeContratacao: '6',
        })
        const res = await fetch(
          `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?${params}`,
          { signal: AbortSignal.timeout(10000) }
        )
        if (!res.ok) continue
        const json = await res.json() as {
          data?: Array<{
            numeroControlePNCP: string
            unidadeOrgao?: { nomeUnidade: string }
            objetoCompra: string
            valorTotalEstimado: number
            dataAberturaProposta: string
          }>
        }
        for (const item of json.data ?? []) {
          resultados.push({
            numero: item.numeroControlePNCP,
            orgao: item.unidadeOrgao?.nomeUnidade ?? 'N/A',
            objeto: item.objetoCompra,
            valor_estimado: item.valorTotalEstimado ?? 0,
            data_abertura: item.dataAberturaProposta,
            match_score: this.calcMatchScore(material.descricao, item.objetoCompra),
          })
        }
      } catch {
        // falha silenciosa por material — continua com os outros
      }
    }
    return resultados.filter((e) => e.match_score > 0.3).slice(0, 10)
  }

  private async fetchIBGE(): Promise<IBGEData[]> {
    // BUG 10 fix: buscar range 2020-anoAtual e pegar último ano com valor publicado.
    // IBGE tem defasagem variável (2-3 anos) — offset fixo falha quando dado ainda não publicado.
    const anoAtual = nowBrasilia().getUTCFullYear()
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/2020-${anoAtual}/variaveis/37?localidades=N1[all]`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) throw new Error(`IBGE HTTP ${res.status}`)
    const json = await res.json() as Array<{
      resultados: Array<{ series: Array<{ serie: Record<string, string> }> }>
    }>
    const serie = json[0]?.resultados?.[0]?.series?.[0]?.serie ?? {}
    // Pegar último ano com valor válido (não nulo e não '-')
    const ultimoAno = Object.entries(serie)
      .reverse()
      .find(([, v]) => v && v !== '-' && v !== '0')
    const pibStr = ultimoAno?.[1] ?? null
    return [{ municipio: 'Brasil', pib: pibStr ? parseFloat(pibStr) : null, populacao: 214000000 }]
  }

  // === INSIGHTS COM CLAUDE ===

  private async getSegmentKnowledge(empresa_id: string): Promise<Record<string, unknown> | null> {
    try {
      const { data } = await this.supabase
        .from('empresa_segment_knowledge')
        .select('segmento_primario, nicho_b2g, best_practices, benchmarks_mercado, estrategia_detectada, padroes_comportamentais')
        .eq('empresa_id', empresa_id)
        .single()
      return data as Record<string, unknown> | null
    } catch {
      // knowledge base ausente não impede geração de insights
      return null
    }
  }

  private async generateInsights(
    intelligence: Intelligence,
    external: ExternalData,
    confianca_score: number,
    segmentKnowledge: Record<string, unknown> | null = null
  ): Promise<Record<string, unknown>> {
    const contexto = {
      portfolio_materiais: intelligence.portfolio_materiais,
      ticket_medio: intelligence.ticket_medio,
      margem_media: intelligence.margem_media_historica,
      orgaos_frequentes: intelligence.orgaos_frequentes,
      esferas_atuacao: intelligence.esferas_atuacao,
      padroes_renovacao: intelligence.padroes_renovacao,
      total_contratos: intelligence.total_contratos_analisados,
      ipca_12m_pct: external.ipca?.acumulado_12m ?? null,  // BUG 16: nome explícito evita Claude calcular 12×mês
      selic: external.selic ?? null,
      pncp_total_oportunidades: external.pncp.length,
      pncp_editais: external.pncp.slice(0, 5),
      ibge: external.ibge,
      apis_disponiveis: external.apis_consultadas,
    }

    // Sprint 4F: incluir knowledge base do segmento se disponível
    const contextoComSegmento = segmentKnowledge
      ? { ...contexto, segmento_empresa: segmentKnowledge }
      : contexto

    // BUG 5 fix: incluir confiança no contexto para Claude ajustar tom das análises
    const confiancaLabel = confianca_score >= 0.8 ? 'ALTA' : confianca_score >= 0.6 ? 'MÉDIA' : 'BAIXA'
    const confiancaAviso = confianca_score < 0.6
      ? 'ATENÇÃO: dados incompletos — adicione ressalvas quando necessário.'
      : ''

    const segmentoInfo = segmentKnowledge
      ? `\nSEGMENTO DETECTADO: ${segmentKnowledge.segmento_primario ?? 'N/A'} — use best_practices e benchmarks do segmento para calibrar os insights.`
      : ''

    const response = await this.claudeClient.chat({
      systemPrompt:
        `Você é o Insight Analyzer Agent do DUO Governance. Analise dados de empresa fornecedora B2G brasileira. Responda APENAS com JSON válido, sem markdown ou texto adicional. Use números reais dos dados fornecidos.\nQualidade dos dados: ${confiancaLabel} (score: ${confianca_score}). ${confiancaAviso}${segmentoInfo}`,
      prompt: `Com base nos dados internos e macroeconômicos, gere insights acionáveis com contexto educacional.
IMPORTANTE: gere no máximo 2 itens em cada array (insights_precificacao, insights_radar_b2g, insights_macro, insights_regionais). Seja direto e conciso em cada campo.
Se uma API não retornou dados (null), ignore os insights que dependem dela.
${segmentKnowledge ? 'Use o campo segmento_empresa.best_practices e benchmarks_mercado para tornar os insights mais precisos ao segmento da empresa.' : ''}

DADOS:
${JSON.stringify(contextoComSegmento, null, 2)}

RETORNE exatamente este JSON:
{
  "insights_precificacao": [
    {
      "titulo": "string",
      "prioridade": "critica|alta|media|baixa",
      "dados": {},
      "acao_recomendada": "string",
      "valor_recuperavel": 0,
      "educacao": {
        "conceito": "string",
        "explicacao": "string",
        "como_aplicar": "string",
        "exemplo_pratico": "string"
      }
    }
  ],
  "insights_radar_b2g": [
    {
      "titulo": "string",
      "prioridade": "alta|media",
      "oportunidades": 0,
      "valor_total_oportunidades": 0,
      "acao_recomendada": "string",
      "educacao": {
        "conceito": "string",
        "explicacao": "string",
        "como_aplicar": "string",
        "exemplo_pratico": "string"
      }
    }
  ],
  "insights_macro": [
    {
      "titulo": "string",
      "prioridade": "media|baixa",
      "selic_atual": 0,
      "ipca_12m_pct": 0.0,
      "tendencia": "alta|queda|estavel",
      "impacto": "string",
      "acao_recomendada": "string",
      "educacao": {
        "conceito": "string",
        "explicacao": "string",
        "como_aplicar": "string",
        "exemplo_pratico": "string"
      }
    }
  ],
  "insights_regionais": [
    {
      "titulo": "string",
      "prioridade": "media|baixa",
      "regiao": "string",
      "potencial_estimado": 0,
      "acao_recomendada": "string",
      "educacao": {
        "conceito": "string",
        "explicacao": "string",
        "como_aplicar": "string",
        "exemplo_pratico": "string"
      }
    }
  ]
}`,
    })

    // BUG 14: greedy regex capturava até o último } — brace counting para no objeto correto
    const content = response.content
    const start = content.indexOf('{')
    if (start === -1) throw new Error('Claude não retornou JSON válido em parseInsightResponse')
    let depth = 0, end = -1
    for (let i = start; i < content.length; i++) {
      if (content[i] === '{') depth++
      else if (content[i] === '}') { depth--; if (depth === 0) { end = i; break } }
    }
    if (end === -1) throw new Error('JSON não fechado em parseInsightResponse')
    return JSON.parse(content.slice(start, end + 1))
  }

  // === SALVAR ===

  private async saveInsights(
    empresa_id: string,
    intelligence_id: string,
    insights: Record<string, unknown>,
    external: ExternalData,
    confianca_score: number,
    startTime: number
  ) {
    const total = this.countInsights(insights)
    const criticos = this.countCriticos(insights)
    const confianca = confianca_score

    const { error } = await this.supabase.from('newsletter_insights').insert({
      empresa_id,
      intelligence_id,
      periodo_referencia: dateBrasilia(nowBrasilia()),
      insights_precificacao: insights.insights_precificacao,
      insights_radar_b2g: insights.insights_radar_b2g,
      insights_macro: insights.insights_macro,
      insights_regionais: insights.insights_regionais,
      ipca_12m: external.ipca?.acumulado_12m ?? null,
      selic_atual: external.selic?.valor ?? null,
      dados_pncp: external.pncp,
      dados_ibge: external.ibge,
      total_insights: total,
      insights_criticos: criticos,
      confianca_score: confianca,
      versao_agent: '1.0.0',
      tempo_processamento_ms: Date.now() - startTime,
      apis_consultadas: external.apis_consultadas,
      apis_com_erro: external.apis_com_erro,
    })
    if (error) throw error
  }

  // === HELPERS ===

  private calcMatchScore(portfolio: string, objeto: string): number {
    const palavras = portfolio.toLowerCase().split(' ').filter((w) => w.length > 3)
    const texto = objeto.toLowerCase()
    const matches = palavras.filter((w) => texto.includes(w)).length
    return Math.min(matches / Math.max(palavras.length, 1), 1)
  }

  private countInsights(insights: Record<string, unknown>): number {
    return ['insights_precificacao', 'insights_radar_b2g', 'insights_macro', 'insights_regionais'].reduce(
      (sum, k) => sum + ((insights[k] as unknown[])?.length ?? 0),
      0
    )
  }

  private countCriticos(insights: Record<string, unknown>): number {
    return ['insights_precificacao', 'insights_radar_b2g', 'insights_macro', 'insights_regionais'].reduce(
      (sum, k) => {
        const arr = (insights[k] as Array<{ prioridade: string }>) ?? []
        return sum + arr.filter((i) => i.prioridade === 'critica' || i.prioridade === 'alta').length
      },
      0
    )
  }
}

export function createInsightAnalyzerAgent(supabase: SupabaseClient) {
  return new InsightAnalyzerAgent(supabase)
}
