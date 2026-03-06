import { createClient as createServerClient } from '@/lib/supabase/server'
import { OCR_SYSTEM_PROMPT } from '@/lib/agents/ocr/system-prompt'
import { OCR_CONFIG } from '@/lib/agents/core/config'
import type { OCRResult } from '@/lib/agents/core/types'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  // 1. Autenticação
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // 2. empresa_id
  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', session.user.id)
    .single()
  if (usuarioError || !usuario) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 403 })
  }

  // 3. Receber arquivo
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Campo "file" é obrigatório' }, { status: 400 })
  }

  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Tipo não suportado. Use PDF, PNG, JPG ou WEBP.' },
      { status: 400 }
    )
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 })
  }

  // 4. Converter para base64
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = file.type as 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp'

  // 5. Chamar Claude — PDF usa type 'document', imagens usam type 'image'
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let rawResponse: string
  let tokensUsados: number | undefined

  try {
    const contentBlock = mediaType === 'application/pdf'
      ? ({
          type: 'document' as const,
          source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 },
        })
      : ({
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: mediaType, data: base64 },
        })

    const response = await anthropic.messages.create({
      model: OCR_CONFIG.model,
      max_tokens: OCR_CONFIG.maxTokens,
      temperature: OCR_CONFIG.temperature,
      system: OCR_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            { type: 'text', text: 'Analise este contrato público e extraia todos os campos solicitados.' },
          ],
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') throw new Error('Resposta sem bloco de texto')
    rawResponse = textBlock.text
    tokensUsados = response.usage.input_tokens + response.usage.output_tokens
  } catch (err) {
    console.error('[OCR] Erro Claude:', err)
    return NextResponse.json(
      { error: 'Falha ao processar documento com IA. Tente novamente.' },
      { status: 500 }
    )
  }

  // 6. Parsear JSON
  let ocrResult: OCRResult
  try {
    const clean = rawResponse.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(clean)

    ocrResult = {
      numero_contrato: parsed.numero_contrato?.valor ?? undefined,
      orgao_nome: parsed.orgao_nome?.valor ?? undefined,
      vigencia_inicio: parsed.vigencia_inicio?.valor ?? undefined,
      vigencia_fim: parsed.vigencia_fim?.valor ?? undefined,
      valor_total: parsed.valor_total?.valor ?? undefined,
      modalidade: parsed.modalidade?.valor ?? undefined,
      cnpj_orgao: parsed.cnpj_orgao?.valor ?? undefined,
      municipio_contrato: parsed.municipio_contrato?.valor ?? undefined,
      estado_contrato: parsed.estado_contrato?.valor ?? undefined,
      objeto_contrato: parsed.objeto_contrato?.valor ?? undefined,
      confidence_geral: parsed.confidence_geral ?? 0,
      campos_extraidos: {
        numero_contrato: parsed.numero_contrato,
        orgao_nome: parsed.orgao_nome,
        cnpj_orgao: parsed.cnpj_orgao,
        vigencia_inicio: parsed.vigencia_inicio,
        vigencia_fim: parsed.vigencia_fim,
        valor_total: parsed.valor_total,
        modalidade: parsed.modalidade,
        municipio_contrato: parsed.municipio_contrato,
        estado_contrato: parsed.estado_contrato,
        objeto_contrato: parsed.objeto_contrato,
      },
    }
  } catch {
    console.error('[OCR] Parse falhou. Resposta raw:', rawResponse)
    return NextResponse.json(
      { error: 'IA retornou formato inesperado. Tente novamente.' },
      { status: 500 }
    )
  }

  // 7. Learning layer (não bloqueia resposta)
  supabase.from('ocr_learning').insert({
    empresa_id: usuario.empresa_id,
    campos_extraidos: ocrResult.campos_extraidos,
    confidence_geral: ocrResult.confidence_geral,
    modelo_usado: OCR_CONFIG.model,
    nome_arquivo: file.name,
    tamanho_arquivo_bytes: file.size,
    tokens_usados: tokensUsados ?? null,
  }).then(({ error }) => {
    if (error) console.warn('[OCR] ocr_learning insert falhou:', error.message)
  })

  return NextResponse.json(ocrResult)
}
