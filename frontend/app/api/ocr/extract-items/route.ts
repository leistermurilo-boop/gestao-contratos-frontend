import { createClient as createServerClient } from '@/lib/supabase/server'
import { OCR_ITENS_SYSTEM_PROMPT } from '@/lib/agents/ocr/system-prompt-itens'
import { OCR_CONFIG } from '@/lib/agents/core/config'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export interface ItemOCR {
  numero_item: { valor: number | null; confidence: number }
  descricao: { valor: string; confidence: number }
  unidade: { valor: string; confidence: number }
  quantidade: { valor: number; confidence: number }
  valor_unitario: { valor: number; confidence: number }
}

export interface ExtractItemsResult {
  itens: ItemOCR[]
  total_itens: number
  confidence_geral: number
}

/**
 * POST /api/ocr/extract-items
 *
 * Extrai lista de itens de um contrato usando Claude.
 *
 * Body: multipart/form-data
 *   - file: File (PDF ou imagem)
 *   - contrato_id: string (para buscar cnpj_id)
 */
export async function POST(request: NextRequest) {
  // 1. Auth
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // 2. Receber dados
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const contratoId = formData.get('contrato_id') as string | null

  if (!file) return NextResponse.json({ error: 'Campo "file" é obrigatório' }, { status: 400 })
  if (!contratoId) return NextResponse.json({ error: 'Campo "contrato_id" é obrigatório' }, { status: 400 })

  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo não suportado. Use PDF, PNG, JPG ou WEBP.' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 })
  }

  // 3. Validar contrato (RLS garante isolamento)
  const { data: contrato, error: contratoError } = await supabase
    .from('contratos')
    .select('id, cnpj_id')
    .eq('id', contratoId)
    .is('deleted_at', null)
    .single()

  if (contratoError || !contrato) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }

  // 4. Chamar Claude
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
      max_tokens: OCR_CONFIG.maxTokens,
      temperature: OCR_CONFIG.temperature,
      system: OCR_ITENS_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          contentBlock,
          { type: 'text', text: 'Extraia a lista completa de itens deste contrato.' },
        ],
      }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') throw new Error('Resposta sem texto')
    rawResponse = textBlock.text
  } catch (err) {
    console.error('[OCR-ITENS] Erro Claude:', err)
    return NextResponse.json({ error: 'Falha ao processar documento com IA.' }, { status: 500 })
  }

  // 5. Parsear JSON
  let result: ExtractItemsResult
  try {
    const clean = rawResponse.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(clean)
    result = {
      itens: parsed.itens ?? [],
      total_itens: parsed.total_itens ?? 0,
      confidence_geral: parsed.confidence_geral ?? 0,
    }
  } catch {
    console.error('[OCR-ITENS] Parse falhou:', rawResponse)
    return NextResponse.json({ error: 'IA retornou formato inesperado.' }, { status: 500 })
  }

  // 6. Retornar incluindo cnpj_id (necessário para insert)
  return NextResponse.json({ ...result, cnpj_id: contrato.cnpj_id })
}
