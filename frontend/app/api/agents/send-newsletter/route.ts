import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSendNewsletterAgent } from '@/lib/agents/newsletter/send-newsletter/send-newsletter-agent'

export async function POST(request: Request) {
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

    // Parâmetros opcionais do body
    let draft_id: string | undefined
    let destinatario: string | undefined
    try {
      const body = await request.json()
      draft_id = body?.draft_id
      destinatario = body?.destinatario
    } catch {
      // body opcional — ignora parse error
    }

    // Fallback: usa email do usuário autenticado
    const emailDestino = destinatario ?? user.email
    if (!emailDestino) {
      return NextResponse.json({ error: 'Destinatário não informado e usuário sem email.' }, { status: 400 })
    }

    const agent = createSendNewsletterAgent(supabase)
    const result = await agent.send({
      empresa_id: usuario.empresa_id,
      draft_id,
      destinatario: emailDestino,
    })

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 })

    return NextResponse.json({
      success: true,
      message: `Newsletter enviada para ${result.destinatario}`,
      data: result,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[SendNewsletterAgent API]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
