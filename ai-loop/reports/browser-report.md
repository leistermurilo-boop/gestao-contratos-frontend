# Browser Report — Loop #4b: Sprint 4C FIX — Content Writer Agent (2a iteracao)

## Environment
- Date: 2026-03-12
- Tester: Cowork (Claude)
- Environment: Production (Vercel)
- App URL: https://app.duogovernance.com.br

## Fix Testado
commit e16cf98 — maxTokens 16000 + JSON extraction fallback fence

## URL Tested
POST /api/agents/content-writer

## RESULTADO: AINDA FALHOU

### Cenário 1 — POST autenticado (empresa_id: 41e0fceb-ab0e-49a8-9bd8-a7f04cd7cab2)
- Status: HTTP 500
- Tempo: 195s (antes era 94s — maxTokens 16000 esta ativo e gerando mais)
- Body: { "error": "Claude nao retornou JSON valido" }

## NOVO DIAGNÓSTICO — Root Cause Real

O problema NAO é só maxTokens. É truncação estrutural:

1. claude-sonnet-4-6 tem limite máximo de output de ~8192 tokens
2. Setting maxTokens: 16000 nao ultrapassa o limite do modelo
3. A newsletter HTML completa com inline CSS + JSON wrapper excede 8192 tokens
4. A resposta é truncada ANTES do } de fechamento do JSON top-level
5. regex /\{[\s\S]*\}/ requer { de abertura E } de fechamento — sem o } o match é null

Prova: tempo subiu de 94s para 195s — o modelo está gerando mais tokens (chegando ao limite 8192), mas ainda truncando antes de fechar o JSON.

## FIX DEFINITIVO NECESSÁRIO — Separar geração HTML

### Abordagem: 2 chamadas Claude separadas

Chamada 1 — apenas metadados JSON (pequeno, ~200 tokens):
{
  "subject": "...",
  "preview_text": "...",
  "alertas_criticos": [...],
  "insights_semana": [...],
  "radar_b2g": [...],
  "cta_principal": "...",
  "conceitos_ensinados": [...],
  "roi_demonstrado": 0
}

Chamada 2 — apenas o HTML do body (sem JSON wrapper, Claude retorna HTML direto):
- System prompt: "Gere SOMENTE o HTML body (sem doctype, sem JSON). Inline CSS minimal."
- Input: os metadados da Chamada 1
- Output: string HTML pura

Depois montar NewsletterHTML localmente:
const newsletter: NewsletterHTML = {
  ...metadados,
  html: htmlString,
  plain_text: gerarPlainText(metadados)
}

### Alternativa mais simples (se preferir 1 chamada):
Reduzir o HTML: remover inline CSS extenso, usar style tag no head com classes,
limitar o HTML a 3000 tokens máximo pedindo "HTML MINIMO e funcional, sem CSS verboso"

## CENÁRIOS PARA VALIDAR APÓS FIX
1. POST autenticado -> HTTP 200 + { draft_id, subject }
2. newsletter_drafts populada no Supabase com HTML
3. HTML contem: alertas criticos, insights da semana, Radar B2G
4. POST sem autenticacao -> HTTP 401
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
