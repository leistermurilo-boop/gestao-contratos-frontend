import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDataCollectorAgent } from '@/lib/agents/newsletter/data-collector/data-collector-agent'

/**
 * POST /api/agents/data-collector
 *
 * Executa Data Collector Agent para a empresa do usuário autenticado.
 * Coleta dados internos, analisa padrões com Claude e salva em empresa_intelligence.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userError || !usuario?.empresa_id) {
      return NextResponse.json({ error: 'Usuário sem empresa associada' }, { status: 400 })
    }

    const agent = createDataCollectorAgent()
    const result = await agent.collect({
      empresa_id: usuario.empresa_id,
      periodo_meses: 12,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Erro ao coletar dados' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Análise concluída com sucesso',
      data: result,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    console.error('[DataCollectorAgent API]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
