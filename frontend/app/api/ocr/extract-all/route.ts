import { createClient as createServerClient } from '@/lib/supabase/server'
import { OCR_COMBINED_SYSTEM_PROMPT } from '@/lib/agents/ocr/system-prompt-combined'
import { OCR_CONFIG } from '@/lib/agents/core/config'
import type { OCRResult } from '@/lib/agents/core/types'
import type { ExtractItemsResult } from '@/app/api/ocr/extract-items/route'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export interface ExtractAllResult {
  contrato: OCRResult
  itens: ExtractItemsResult
}

/**
 * POST /api/ocr/extract-all
 *
 * Extrai cabeçalho do contrato + lista de itens em uma única chamada Claude.
 * Evita duplo upload do PDF.
 *
 * Body: multipart/form-data
 *   - file: File (PDF ou imagem)
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Campo "file" é obrigatório' }, { status: 400 })

  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo não suportado. Use PDF, PNG, JPG ou WEBP.' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = file.type as 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp'

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let rawResponse: string
  try {
    const contentBlock = mediaType === 'application/pdf'
      ? ({ type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 } })
      : ({ type: 'image' as const, source: { type: 'base64' as const, media_type: mediaType, data: base64 } })

    const response = await anthropic.messages.create({
      model: OCR_CONFIG.model,
      max_tokens: 8192, // Mais tokens para contrato + itens
      temperature: OCR_CONFIG.temperature,
      system: OCR_COMBINED_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          contentBlock,
          { type: 'text', text: 'Extraia o cabeçalho do contrato e a lista completa de itens.' },
        ],
      }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') throw new Error('Resposta sem texto')
    rawResponse = textBlock.text
  } catch (err) {
    console.error('[OCR-ALL] Erro Claude:', err)
    return NextResponse.json({ error: 'Falha ao processar documento com IA.' }, { status: 500 })
  }

  let result: ExtractAllResult
  try {
    const clean = rawResponse.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(clean)

    const c = parsed.contrato ?? {}

    const contrato: OCRResult = {
      numero_contrato: c.numero_contrato?.valor ?? undefined,
      orgao_nome: c.orgao_nome?.valor ?? undefined,
      vigencia_inicio: c.vigencia_inicio?.valor ?? undefined,
      vigencia_fim: c.vigencia_fim?.valor ?? undefined,
      valor_total: c.valor_total?.valor ?? undefined,
      modalidade: c.modalidade?.valor ?? undefined,
      cnpj_orgao: c.cnpj_orgao?.valor ?? undefined,
      municipio_contrato: c.municipio_contrato?.valor ?? undefined,
      estado_contrato: c.estado_contrato?.valor ?? undefined,
      objeto_contrato: c.objeto_contrato?.valor ?? undefined,
      confidence_geral: c.confidence_geral ?? 0,
      campos_extraidos: {
        numero_contrato: c.numero_contrato,
        orgao_nome: c.orgao_nome,
        cnpj_orgao: c.cnpj_orgao,
        vigencia_inicio: c.vigencia_inicio,
        vigencia_fim: c.vigencia_fim,
        valor_total: c.valor_total,
        modalidade: c.modalidade,
        municipio_contrato: c.municipio_contrato,
        estado_contrato: c.estado_contrato,
        objeto_contrato: c.objeto_contrato,
      },
    }

    result = {
      contrato,
      itens: {
        itens: parsed.itens ?? [],
        total_itens: parsed.total_itens ?? 0,
        confidence_geral: parsed.confidence_itens ?? 0,
      },
    }
  } catch {
    console.error('[OCR-ALL] Parse falhou:', rawResponse)
    return NextResponse.json({ error: 'IA retornou formato inesperado.' }, { status: 500 })
  }

  return NextResponse.json(result)
}
