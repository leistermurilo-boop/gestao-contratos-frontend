# @analyst — Database Analysis — Sprint 4E (2026-03-13)

## Causa Raiz por Bug

### BUG 1+2 — fetchIPCA() — CRÍTICO
**Arquivo:** `insight-analyzer-agent.ts:162-172`
- **BUG 1 (linha 171):** `valores.reduce((acc,v) => acc+v, 0)` soma 12 observações.
  A variável 2265 (IPCA acumulado 12m) já é o valor acumulado — não se soma.
  Resultado: 12 × ~4.36% = ~52.4% enviado ao Claude e salvo no banco.
- **BUG 2 (linha 162):** URL com `202401-202412` hardcoded. Em 2027 retorna dados de 2024.
  `mes_referencia: '2024-12'` também hardcoded.

### BUG 3 — fetchPNCP() — CRÍTICO
**Arquivo:** `insight-analyzer-agent.ts:199-211`
- `tamanhoPagina: '5'` → HTTP 400 (mínimo obrigatório: 10)
- `dataInicial/dataFinal` no formato `yyyy-MM-dd` → HTTP 422 (exige `yyyyMMdd`)
- Sem `codigoModalidadeContratacao` → HTTP 400 (obrigatório pela API)
- Resultado: `res.ok === false` → `continue` silencioso → sempre retorna `[]`

### BUG 4 — fetchIBGE() — ALTO
**Arquivo:** `insight-analyzer-agent.ts:242-250`
- URL hardcoded `periodos/2021` e chave `serie?.['2021']`.
- PIB tem defasagem de ~2 anos. Fix: usar `anoAtual - 2` dinamicamente.

### BUG 5 — confianca_score não usada — ALTO
**Arquivo:** `insight-analyzer-agent.ts` — saveInsights (linha 367) vs generateInsights (linha 255)
- `confianca` calculada em `saveInsights()` mas não chega ao `generateInsights()`.
- Claude gera análises sem saber qualidade dos dados (0.40 = 1 API, 0.85 = 4 APIs).

### BUG 6 — progresso_maturidade hardcoded — ALTO
**Arquivo:** `content-writer-agent.ts:114`
- `progresso_maturidade: intelligence ? 70 : undefined` — sempre 70%.
- Fix: calcular baseado em fontes reais disponíveis em `insights` (ipca, selic, pncp, ibge).

### BUG 7 — headers email ausentes — MÉDIO
**Arquivo:** `send-newsletter-agent.ts:63-72`
- Sem `List-Unsubscribe` (RFC 2369 + Gmail/Yahoo 2024 obrigatório).
- Sem `replyTo`.

### BUG 8 — getDraft filtra status mesmo com draft_id — MÉDIO
**Arquivo:** `send-newsletter-agent.ts:103-121`
- `.eq('status', 'draft')` aplicado mesmo quando `draft_id` é fornecido.
- Draft com status='sent' → PGRST116 → null → falha silenciosa.

## Hipóteses Descartadas
- RLS / auth: não envolvidos — todos os erros são lógica de negócio ou parâmetros de API externa.
