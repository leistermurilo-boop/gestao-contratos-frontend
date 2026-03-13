import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createContentWriterAgent } from '@/lib/agents/newsletter/content-writer/content-writer-agent'
import { createSendNewsletterAgent } from '@/lib/agents/newsletter/send-newsletter/send-newsletter-agent'

/**
 * CRON: Geração + Envio (segunda 07h BRT = 10:00 UTC segunda)
 * vercel.json: "0 10 * * 1"
 *
 * Para cada empresa:
 * 1. Content Writer gera newsletter a partir dos insights da semana
 * 2. Send Newsletter envia via Resend para o email do admin da empresa
 * Protegido por CRON_SECRET.
 */
export async function GET(request: Request) {
  // Validar CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const resultados: Record<string, { writer: string; sender: string }> = {}
  const erros: string[] = []

  try {
    // Buscar todas as empresas com seus admins (email de destino)
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('id, razao_social')

    if (error) throw error
    if (!empresas || empresas.length === 0) {
      return NextResponse.json({ message: 'Nenhuma empresa encontrada', resultados: {} })
    }

    console.log(`[Cron write-and-send] ${empresas.length} empresas`)

    for (const empresa of empresas) {
      const { id: empresa_id, razao_social } = empresa as { id: string; razao_social: string }

      try {
        // Buscar email do admin da empresa
        const destinatario = await getAdminEmail(supabase, empresa_id)
        if (!destinatario) {
          erros.push(`${razao_social}: sem admin com email`)
          continue
        }

        // Content Writer
        const writer = createContentWriterAgent(supabase)
        const writeResult = await writer.write({ empresa_id })

        if (!writeResult.success) {
          resultados[empresa_id] = {
            writer: `❌ ${writeResult.error}`,
            sender: '⏭️ pulado',
          }
          continue
        }

        // Send Newsletter (usa o draft recém gerado)
        const sender = createSendNewsletterAgent(supabase)
        const sendResult = await sender.send({
          empresa_id,
          draft_id: writeResult.draft_id,
          destinatario,
        })

        resultados[empresa_id] = {
          writer: `✅ draft ${writeResult.draft_id?.slice(0, 8)}`,
          sender: sendResult.success ? `✅ enviado para ${destinatario}` : `❌ ${sendResult.error}`,
        }

        console.log(`[${razao_social}] writer=${resultados[empresa_id].writer} sender=${resultados[empresa_id].sender}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : JSON.stringify(err)
        erros.push(`${razao_social}: ${msg}`)
        console.error(`[Cron write-and-send] Erro em ${razao_social}:`, err)
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
    console.error('[Cron write-and-send] Erro fatal:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Busca o email do usuário admin da empresa
async function getAdminEmail(supabase: ReturnType<typeof createServiceRoleClient>, empresa_id: string): Promise<string | null> {
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('empresa_id', empresa_id)
    .eq('perfil', 'admin')
    .limit(1)
    .single()

  if (!data) return null

  // Buscar email no auth.users via admin API
  const { data: authUser } = await supabase.auth.admin.getUserById((data as { id: string }).id)
  return authUser?.user?.email ?? null
}
