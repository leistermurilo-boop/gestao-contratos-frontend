import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createContentWriterAgent } from '@/lib/agents/newsletter/content-writer/content-writer-agent'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .single()
    if (!usuario?.empresa_id) return NextResponse.json({ error: 'Usuário sem empresa' }, { status: 400 })

    const agent = createContentWriterAgent(supabase)
    const result = await agent.write({ empresa_id: usuario.empresa_id })

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 })

    return NextResponse.json({
      success: true,
      message: 'Newsletter gerada com sucesso',
      data: result,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[ContentWriterAgent API]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
