# INBOX — Loop Trigger

> Arquivo de estado entre Cowork (browser) e Claude Code (terminal).
> **Cowork escreve aqui.** O terminal monitora via '/loop'.

---

## Estado Atual

---

**Status: DONE**

---

---

## Sprint 4E — Correção de Agentes Newsletter

**Data:** 2026-03-13
**Sessão:** Audit completo de todos os 4 agentes pelo Cowork (ai-production-debugger)
**Prioridade:** 🔴 CRÍTICO — newsletter enviando dados incorretos em produção

---

## Tasks para o Terminal

### 🔴 BUG 1+2 — insight-analyzer: fetchIPCA() cálculo errado + período hardcoded

**Arquivo:** `frontend/lib/agents/newsletter/insight-analyzer/insight-analyzer-agent.ts`

**Problema:** IPCA retornando 52.41% (soma de 12 meses) em vez de 4.83% (último valor).
A variável 2265 do IBGE SIDRA já é acumulada em 12 meses por observação — somar os 12 valores é erro duplo.
Além disso, o período está hardcoded como `202401-202412` — em 2027 vai buscar dados de 2024.

**Fix BUG 1 — cálculo (linha ~172):**
```typescript
// ANTES (errado):
const soma = valores.reduce((acc, v) => acc + v, 0)
return { acumulado_12m: parseFloat(soma.toFixed(2)), mes_referencia: '2024-12' }

// DEPOIS (correto):
const ultimo = valores[valores.length - 1]
const ultimoMes = Object.keys(serie).pop() ?? ''
return { acumulado_12m: parseFloat(ultimo.toFixed(2)), mes_referencia: ultimoMes }
```

**Fix BUG 2 — período dinâmico (linha ~155):**
```typescript
// ANTES (hardcoded):
'https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/202401-202412/variaveis/2265?localidades=N1[all]'

// DEPOIS (dinâmico):
const now = new Date()
const anoAtual = now.getFullYear()
const mesAtual = String(now.getMonth() + 1).padStart(2, '0')
const periodoInicio = `${anoAtual}01`
const periodoFim = `${anoAtual}${mesAtual}`
const url = `https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/${periodoInicio}-${periodoFim}/variaveis/2265?localidades=N1[all]`
```

---

### 🔴 BUG 3 — insight-analyzer: fetchPNCP() 3 parâmetros errados (sempre retorna [])

**Arquivo:** `frontend/lib/agents/newsletter/insight-analyzer/insight-analyzer-agent.ts`

**Problema:** PNCP sempre retorna array vazio. Confirmado live com 3 erros simultâneos:
- Sem `codigoModalidadeContratacao` → HTTP 400: "Required parameter not present"
- Data formato `yyyy-MM-dd` → HTTP 422: "Data Inicial inválida, deve estar no formato yyyyMMdd"  
- `tamanhoPagina: '5'` → HTTP 400: "deve ser maior que ou igual à 10"
- Com as 3 correções → HTTP 200 + 739 editais disponíveis

**Fix:**
```typescript
// ANTES (errado):
const params = new URLSearchParams({
  q: material,
  dataInicial: hoje,        // ex: '2026-03-13'
  dataFinal: em30dias,      // ex: '2026-04-12'
  pagina: '1',
  tamanhoPagina: '5',
})

// DEPOIS (correto):
const params = new URLSearchParams({
  q: material,
  dataInicial: hoje.replace(/-/g, ''),       // ex: '20260313'
  dataFinal: em30dias.replace(/-/g, ''),     // ex: '20260412'
  pagina: '1',
  tamanhoPagina: '10',
  codigoModalidadeContratacao: '5',          // Pregão
})
```

---

### 🟡 BUG 4 — insight-analyzer: fetchIBGE() ano hardcoded 2021 (PIB desatualizado)

**Arquivo:** `frontend/lib/agents/newsletter/insight-analyzer/insight-analyzer-agent.ts`

**Problema:** URL hardcoded com `periodos/2021` — retorna PIB R$9.01T.
Dado correto disponível: `periodos/2022` → PIB R$10.08T.

**Fix:**
```typescript
// ANTES:
'https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/2021/variaveis/37?localidades=N1[all]'

// DEPOIS:
'https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/2022/variaveis/37?localidades=N1[all]'
// Obs: considerar tornar dinâmico pegando (anoAtual - 2) pois dado tem 2 anos de defasagem
```

---

### 🟡 BUG 5 — insight-analyzer: confianca_score calculado mas nunca usado

**Arquivo:** `frontend/lib/agents/newsletter/insight-analyzer/insight-analyzer-agent.ts`

**Problema:** `saveInsights()` calcula `confianca_score` (0.85/0.65/0.40) e salva no banco,
mas `generateInsights()` nunca recebe esse valor. Claude gera análises sem saber a qualidade dos dados.

**Fix — passar confianca_score para o prompt de generateInsights():**
```typescript
// Adicionar ao prompt de generateInsights():
const confiancaLabel = confianca_score >= 0.8 ? 'ALTA' : confianca_score >= 0.6 ? 'MÉDIA' : 'BAIXA'
// No system prompt incluir:
`Qualidade dos dados disponíveis: ${confiancaLabel} (score: ${confianca_score}).
${confianca_score < 0.6 ? 'ATENÇÃO: dados incompletos — adicione ressalvas nas análises.' : ''}`
```

---

### 🟡 BUG 6 — content-writer: progresso_maturidade sempre 70% (hardcoded)

**Arquivo:** `frontend/lib/agents/newsletter/content-writer/content-writer-agent.ts`

**Problema:** `progresso_maturidade: intelligence ? 70 : undefined` — sempre 70% quando há dados.
Nunca reflete o estado real do contrato/licitação.

**Fix — calcular baseado em campos reais:**
```typescript
// Substituir por lógica real, ex:
function calcularProgresso(intelligence: IntelligenceData): number {
  const scores = []
  if (intelligence.dados_mercado?.ipca) scores.push(100)
  if (intelligence.dados_pncp?.length > 0) scores.push(100)
  if (intelligence.dados_ibge?.pib) scores.push(100)
  if (intelligence.dados_selic) scores.push(100)
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0
}
```

---

### 🔵 BUG 7 — send-newsletter: faltam headers List-Unsubscribe e replyTo

**Arquivo:** `frontend/lib/agents/newsletter/send-newsletter/send-newsletter-agent.ts`

**Problema:** Email enviado sem `List-Unsubscribe` (obrigatório por RFC 2369 + Google/Yahoo 2024)
e sem `replyTo` configurado.

**Fix:**
```typescript
await resend.emails.send({
  from: 'Radar DUO™ <newsletter@duogovernance.com.br>',
  to: destinatario,
  subject: assunto,
  html: html_content,
  replyTo: 'contato@duogovernance.com.br',
  headers: {
    'List-Unsubscribe': '<mailto:unsubscribe@duogovernance.com.br>',
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  },
})
```

---

### 🔵 BUG 8 — send-newsletter: getDraft() ignora draft_id quando status != 'draft'

**Arquivo:** `frontend/lib/agents/newsletter/send-newsletter/send-newsletter-agent.ts`

**Problema:** Quando `draft_id` é fornecido, `getDraft()` ainda filtra `.eq('status', 'draft')`.
Se o draft foi enviado antes (status='sent'), retorna null e falha silenciosamente.

**Fix:**
```typescript
async function getDraft(draft_id?: string) {
  let query = supabase.from('newsletter_drafts').select('*')
  
  if (draft_id) {
    // Busca direta por ID — ignora status
    query = query.eq('id', draft_id)
  } else {
    // Sem ID: pega o draft mais recente com status='draft'
    query = query.eq('status', 'draft').order('criado_em', { ascending: false }).limit(1)
  }
  
  const { data, error } = await query.single()
  if (error || !data) return null
  return data
}
```

---

## Resumo de Prioridades

| # | Arquivo | Severidade | Impacto |
|---|---------|-----------|---------|
| 1+2 | insight-analyzer: fetchIPCA() | 🔴 CRÍTICO | IPCA 52.41% em vez de ~4.83% |
| 3 | insight-analyzer: fetchPNCP() | 🔴 CRÍTICO | Radar B2G sempre vazio |
| 4 | insight-analyzer: fetchIBGE() | 🟡 ALTO | PIB 2 anos desatualizado |
| 5 | insight-analyzer: confianca_score | 🟡 ALTO | Qualidade não influencia IA |
| 6 | content-writer: progresso_maturidade | 🟡 ALTO | Sempre 70% hardcoded |
| 7 | send-newsletter: headers email | 🔵 MÉDIO | Sem unsubscribe (compliance) |
| 8 | send-newsletter: getDraft status | 🔵 MÉDIO | Falha ao reenviar drafts |

---

**Após implementar todos os fixes acima, execute os testes de validação e atualize o Status para DONE.**
