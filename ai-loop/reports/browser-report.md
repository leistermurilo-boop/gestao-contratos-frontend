# Browser Report — Loop #4: Sprint 4C — Content Writer Agent

## Environment
- Date: 2026-03-12
- Tester: Cowork (Claude)
- Environment: Production (Vercel)
- App URL: https://app.duogovernance.com.br

## URL Tested
POST /api/agents/content-writer

## RESULTADO FINAL: FALHOU

### Cenário 1 — POST autenticado
- Status: HTTP 500
- Tempo: 94s
- Body: { "error": "Claude nao retornou JSON valido" }

## DIAGNOSTICO

### Root Cause 1: maxTokens: 8000 insuficiente
Arquivo: frontend/lib/agents/newsletter/content-writer/content-writer-agent.ts
O construtor usa maxTokens: 8000. Newsletter HTML + JSON wrapper estimado em 8000-12000 tokens. Claude trunca no meio do JSON.

### Root Cause 2: JSON extraction sem fallback
response.content.match(/{[\s\S]*}/) falha quando resposta truncada.

## FIX NECESSARIO

### Fix 1: constructor — linha maxTokens
ANTES: maxTokens: 8000,
DEPOIS: maxTokens: 16000,

### Fix 2: metodo generateNewsletter — substituir bloco de extração JSON
ANTES:
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Claude nao retornou JSON valido')
    return JSON.parse(jsonMatch[0]) as NewsletterHTML

DEPOIS:
    let rawContent = response.content
    const fenceMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) rawContent = fenceMatch[1].trim()
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[ContentWriterAgent] Claude raw:', rawContent.substring(0, 500))
      throw new Error('Claude nao retornou JSON valido')
    }
    return JSON.parse(jsonMatch[0]) as NewsletterHTML

## CENARIOS PARA VALIDAR APOS FIX
1. POST autenticado -> HTTP 200 + { draft_id, subject }
2. newsletter_drafts populada no Supabase com HTML
3. HTML contem: alertas criticos, insights da semana, Radar B2G
4. POST sem autenticacao -> HTTP 401
