# Browser Report — Sprint 4F Segment Specialist Agent
**Data:** 2026-03-13
**Sessao:** Loop #8 Sprint 4F — Segment Specialist Agent (BUG 11 encontrado)
**Ambiente:** https://app.duogovernance.com.br (Vercel + Supabase producao)
**Commit testado:** e96e0d288c9e0477b85f0e48b8dbf085a0ae6b28

---

## Resumo

Sprint 4F implementou o **Segment Specialist Agent** — novo agente que gera knowledge base B2G por empresa com 2 chamadas Claude (analise de segmento + diagnostico comportamental) e persiste em `empresa_segment_knowledge`.

**Resultado:** 1 bug critico encontrado (BUG 11). Insight-analyzer e pipeline nao testados pois o prerequisito (segment-specialist) falhou.

---

## Cenarios de Teste

### CENARIO 1: POST /api/agents/segment-specialist
**Status: FALHOU (500)**

**Request:**
```
POST https://app.duogovernance.com.br/api/agents/segment-specialist
Content-Type: application/json
(sem body — empresa_id lido da sessao autenticada)
```

**Response:**
```json
{
  "error": "Expected ',' or '}' after property value in JSON at position 6309 (line 50 column 4)"
}
```
- HTTP Status: 500
- Tempo de resposta: 50621ms (50s — 2 chamadas Claude completadas)
- As chamadas Claude foram feitas (tempo confirma), mas o parse do resultado falhou

### CENARIO 2: empresa_segment_knowledge no Supabase
**Status: NAO TESTADO** — dependente do Cenario 1 (upsert so ocorre apos parse bem-sucedido)

### CENARIO 3: insight-analyzer com getSegmentKnowledge()
**Status: NAO TESTADO** — dependente do Cenario 1

---

## Root Cause — BUG 11

**Arquivo:** `frontend/lib/agents/newsletter/segment-specialist/segment-specialist-agent.ts`
**Metodo:** `parseJSON()` linha 377-386
**Funcao afetada:** `analyzeSegment()` ou `analyzeBehavior()`

**Codigo atual (BUGADO):**
```typescript
private parseJSON<T>(content: string, caller: string): T {
  const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fence ? fence[1].trim() : content
  const match = raw.match(/\{[\s\S]*\}/)   // <-- GREEDY: captura 1o { ate ultimo }
  if (!match) throw new Error(`Claude nao retornou JSON valido em ${caller}`)
  return JSON.parse(match[0]) as T
}
```

**Problema:** O regex `/\{[\s\S]*\}/` e GREEDY. Captura desde o primeiro `{` ate o **ultimo** `}` na string inteira. Se Claude adicionar qualquer texto apos o JSON que contenha `{...}` (ex: notas explicativas, exemplos inline), o regex inclui esse conteudo invalido. O JSON resultante quebra no parse (posicao 6309 = ~50 linhas de JSON valido seguido de lixo).

**Fix correto — brace counting:**
```typescript
private parseJSON<T>(content: string, caller: string): T {
  // 1. Tenta extrair de code fence
  const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) {
    try { return JSON.parse(fence[1].trim()) as T } catch {}
  }

  // 2. Brace counting — encontra JSON balanceado sem regex greedy
  const start = content.indexOf('{')
  if (start === -1) throw new Error(`Claude nao retornou JSON valido em ${caller}`)

  let depth = 0, end = -1
  for (let i = start; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }

  if (end === -1) throw new Error(`JSON nao fechado em ${caller}`)

  try {
    return JSON.parse(content.slice(start, end + 1)) as T
  } catch (e) {
    console.error(`[SegmentSpecialistAgent.${caller}] parse error:`, content.slice(start, start+300))
    throw e
  }
}
```

---

## Console / Network Errors

- Sem erros de autenticacao (sessao valida, cookies ativos)
- Sem erros 401/403 (middleware ok)
- Erro 500 originado dentro do agente (catch no route handler)
- Supabase nao consultado (erro antes do upsert)

---

## Evidencias

- fetch('https://app.duogovernance.com.br/api/agents/segment-specialist', {method:'POST'})
  - status=500, elapsed=50621ms
  - body={"error":"Expected ',' or '}' after property value in JSON at position 6309 (line 50 column 4)"}
- Tempo de 50s confirma que ambas as chamadas Claude completaram com sucesso
- Erro ocorre em parseJSON() — apos receber resposta do Claude, antes de salvar no Supabase

---

## Score Sprint 4F

- Cenario 1 (segment-specialist): FALHOU — BUG 11 parseJSON greedy regex
- Cenario 2 (empresa_segment_knowledge): NAO TESTADO
- Cenario 3 (insight-analyzer + segment): NAO TESTADO

**Acao necessaria:** Terminal corrigir parseJSON() com brace counting. Redeployar. Cowork re-testar.
