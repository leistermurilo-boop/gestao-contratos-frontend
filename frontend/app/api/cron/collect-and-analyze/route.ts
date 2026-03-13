import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createDataCollectorAgent } from '@/lib/agents/newsletter/data-collector/data-collector-agent'
import { createSegmentSpecialistAgent } from '@/lib/agents/newsletter/segment-specialist/segment-specialist-agent'
import { createInsightAnalyzerAgent } from '@/lib/agents/newsletter/insight-analyzer/insight-analyzer-agent'

/**
 * CRON: Coleta + Análise (domingo 22h BRT = 01:00 UTC segunda)
 * vercel.json: "0 1 * * 1"
 *
 * Executa Data Collector + Insight Analyzer para todas as empresas.
 * Protegido por CRON_SECRET.
 */
export async function GET(request: Request) {
  // Validar CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const resultados: Record<string, { collector: string; segment: string; analyzer: string }> = {}
  const erros: string[] = []

  try {
    // Buscar todas as empresas ativas
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('id, razao_social')

    if (error) throw error
    if (!empresas || empresas.length === 0) {
      return NextResponse.json({ message: 'Nenhuma empresa encontrada', resultados: {} })
    }

    console.log(`[Cron collect-and-analyze] ${empresas.length} empresas`)

    // Executar sequencialmente para evitar sobrecarga de API
    for (const empresa of empresas) {
      const { id: empresa_id, razao_social } = empresa as { id: string; razao_social: string }

      try {
        // 1. Data Collector
        const collector = createDataCollectorAgent(supabase)
        const collectResult = await collector.collect({ empresa_id })

        // 2. Segment Specialist (Sprint 4F — graceful degradation: se falhar, Insight Analyzer continua)
        let segmentLabel = '⏭️ skipped'
        try {
          const segment = createSegmentSpecialistAgent(supabase)
          const segmentResult = await segment.analyze({ empresa_id })
          segmentLabel = segmentResult.success
            ? `✅ ${segmentResult.from_cache ? 'cache' : segmentResult.segmento}`
            : `❌ ${segmentResult.error}`
        } catch (segErr: unknown) {
          const msg = segErr instanceof Error ? segErr.message : JSON.stringify(segErr)
          segmentLabel = `❌ ${msg}`
          console.error(`[Cron collect-and-analyze] Segment Specialist falhou em ${razao_social}:`, segErr)
        }

        // 3. Insight Analyzer (usa empresa_intelligence + segment knowledge)
        const analyzer = createInsightAnalyzerAgent(supabase)
        const analyzeResult = await analyzer.analyze({ empresa_id })

        resultados[empresa_id] = {
          collector: collectResult.success ? `✅ ${collectResult.insights_gerados ?? 0} insights` : `❌ ${collectResult.error}`,
          segment: segmentLabel,
          analyzer: analyzeResult.success ? `✅ ${analyzeResult.total_insights ?? 0} insights (${analyzeResult.insights_criticos ?? 0} críticos)` : `❌ ${analyzeResult.error}`,
        }

        console.log(`[${razao_social}] collector=${resultados[empresa_id].collector} segment=${resultados[empresa_id].segment} analyzer=${resultados[empresa_id].analyzer}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : JSON.stringify(err)
        erros.push(`${razao_social}: ${msg}`)
        console.error(`[Cron collect-and-analyze] Erro em ${razao_social}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      total_empresas: empresas.length,
      erros: erros.length,
      resultados,
      ...(erros.length > 0 && { detalhes_erros: erros }),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[Cron collect-and-analyze] Erro fatal:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
