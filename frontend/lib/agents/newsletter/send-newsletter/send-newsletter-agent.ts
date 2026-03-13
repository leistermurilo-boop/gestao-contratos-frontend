import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

/**
 * SEND NEWSLETTER AGENT (Sprint 4D)
 *
 * Lê newsletter_drafts com status='draft', envia via Resend,
 * atualiza status → 'sent' + enviado_em.
 */

export interface SendNewsletterInput {
  empresa_id: string
  draft_id?: string       // opcional: enviar rascunho específico
  destinatario: string    // email de destino (obrigatório — vem da camada de API)
}

export interface SendNewsletterOutput {
  success: boolean
  empresa_id: string
  draft_id?: string
  resend_id?: string
  destinatario?: string
  subject?: string
  tempo_processamento_ms: number
  error?: string
}

interface DraftRow {
  id: string
  subject: string
  preview_text: string | null
  html: string
  plain_text: string | null
  empresa_id: string
}

export class SendNewsletterAgent {
  private resend: Resend

  constructor(private supabase: SupabaseClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY não configurada')
    this.resend = new Resend(apiKey)
  }

  async send(input: SendNewsletterInput): Promise<SendNewsletterOutput> {
    const startTime = Date.now()
    const { empresa_id } = input

    try {
      const draft = await this.getDraft(empresa_id, input.draft_id)
      if (!draft) {
        return {
          success: false,
          empresa_id,
          error: 'Nenhum newsletter_draft com status "draft" encontrado. Execute o Content Writer primeiro.',
          tempo_processamento_ms: Date.now() - startTime,
        }
      }

      const destinatario = input.destinatario

      // BUG 7 fix: headers obrigatórios (RFC 2369 + Gmail/Yahoo 2024) + replyTo
      const { data: resendData, error: resendError } = await this.resend.emails.send({
        from: 'Radar DUO™ <newsletter@duogovernance.com.br>',
        to: [destinatario],
        replyTo: 'contato@duogovernance.com.br',
        subject: draft.subject,
        html: draft.html,
        text: draft.plain_text ?? undefined,
        headers: {
          'X-Entity-Ref-ID': draft.id,
          'List-Unsubscribe': '<mailto:unsubscribe@duogovernance.com.br>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      if (resendError) {
        throw new Error(`Resend error: ${resendError.message}`)
      }

      await this.markAsSent(draft.id, destinatario)

      return {
        success: true,
        empresa_id,
        draft_id: draft.id,
        resend_id: resendData?.id,
        destinatario,
        subject: draft.subject,
        tempo_processamento_ms: Date.now() - startTime,
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('[SendNewsletterAgent]', error)
      return {
        success: false,
        empresa_id,
        error: msg,
        tempo_processamento_ms: Date.now() - startTime,
      }
    }
  }

  // === SUPABASE ===

  private async getDraft(empresa_id: string, draft_id?: string): Promise<DraftRow | null> {
    // BUG 8 fix: quando draft_id fornecido, busca direta por ID sem filtrar por status
    const baseSelect = 'id, subject, preview_text, html, plain_text, empresa_id'

    if (draft_id) {
      const { data, error } = await this.supabase
        .from('newsletter_drafts')
        .select(baseSelect)
        .eq('empresa_id', empresa_id)
        .eq('id', draft_id)
        .single()
      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      return data as DraftRow
    }

    // Sem draft_id: pega o mais recente com status='draft'
    const { data, error } = await this.supabase
      .from('newsletter_drafts')
      .select(baseSelect)
      .eq('empresa_id', empresa_id)
      .eq('status', 'draft')
      .order('gerado_em', { ascending: false })
      .limit(1)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as DraftRow
  }

  private async markAsSent(draft_id: string, destinatario: string): Promise<void> {
    const { error } = await this.supabase
      .from('newsletter_drafts')
      .update({
        status: 'sent',
        enviado_em: new Date().toISOString(),
        enviado_para: destinatario,
      })
      .eq('id', draft_id)

    if (error) throw error
  }
}

export function createSendNewsletterAgent(supabase: SupabaseClient) {
  return new SendNewsletterAgent(supabase)
}
