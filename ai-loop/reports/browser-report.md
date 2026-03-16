# Browser Report — Sprint 4G: IPCA 52% Root Cause + Auditoria Completa dos Agentes

**Data:** 2026-03-15
**Testado por:** Cowork (browser agent)
**Ambiente:** https://app.duogovernance.com.br (produção)

---

## Environment

- URL Tested: https://app.duogovernance.com.br
- APIs externas verificadas: IBGE agregado 1737 var 2265, Bacen/Selic SGS 432
- Código fonte lido via: GitHub API (leistermurilo-boop/gestao-contratos-frontend)
- Agentes auditados: insight-analyzer, segment-specialist, content-writer, send-newsletter

---

## Test Scenario

Usuário reportou recorrência do bug "soma de todos meses de IPCA = 52%" após envio da newsletter com agentes refinados (Sprint 4D/4F). Cowork realizou auditoria completa de todos os agentes da pipeline de newsletter para identificar origem do valor 52% e verificar se segment-specialist está corretamente integrado.

---

## Steps Performed

1. Leitura completa de `insight-analyzer-agent.ts` via GitHub API (18.205 chars)
2. Leitura completa de `segment-specialist-agent.ts` via GitHub API
3. Leitura completa de `content-writer-agent.ts` via GitHub API
4. Leitura completa de `send-newsletter-agent.ts` via GitHub API (158 linhas — sem IPCA)
5. Teste ao vivo da IBGE API: `https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/202601-202603/variaveis/2265?localidades=N1[all]`
6. Análise do schema de output de `insights_macro` no prompt do insight-analyzer
7. Análise do objeto `contexto` e prompt template do content-writer
8. Verificação da integração segment-specialist → insight-analyzer

---

## Expected Result

- `ipca_12m` retornado como ~3.81% (último valor 12m acumulado fev/2026)
- Newsletter exibindo IPCA ~3.8–4.5%, não 52%
- Todos os BUGs de sessões anteriores mantidos corrigidos

---

## Actual Result

### IBGE API (teste ao vivo — março 2026)
```
202601: "4.44"   (jan/2026 — 12m acumulado)
202602: "3.81"   (fev/2026 — 12m acumulado)
202603: sem dado ainda
Último valor (BUG 1 fix ativo): 3.81
Soma se bugado: 8.25  ← apenas 2 meses, NÃO é 52%
```
→ `fetchIPCA()` retorna corretamente `3.81`. BUG 1 e BUG 2 fixes estão em produção.

### Segment-specialist: INTEGRADO ✅
- `getSegmentKnowledge()` busca `empresa_segment_knowledge` no Supabase ✅
- Resultado passado como `segmento_empresa: segmentKnowledge` ao Claude ✅
- Schema `benchmarks_mercado` auditado: campos são `margem_media_setor`, `ticket_medio_segmento`, `concorrencia_media_editais`, `prazo_medio_pagamento_dias`, `taxa_renovacao_tipica` — **NÃO tem campo IPCA** ✅
- Segment-specialist NÃO é fonte do 52%

---

## Bugs Encontrados

### BUG 16 — `insights_macro` sem campo `ipca_12m_pct` no schema de output

**Arquivo:** `frontend/lib/agents/newsletter/insight-analyzer/insight-analyzer-agent.ts`
**Linhas afetadas:** ~L354 (objeto contexto) e ~L389–L400 (schema insights_macro no prompt)

**Problema:**
O contexto enviado ao Claude tem `ipca_12m: 3.81` (número puro, sem label de unidade). O schema de output de `insights_macro` só tem:
```json
{
  "selic_atual": 0,
  "tendencia": "alta|queda|estavel",
  "impacto": "string",
  ...
}
```
Não há campo `"ipca_12m_pct": 0.0`. Claude recebe o IPCA no input mas **não tem campo estruturado para emiti-lo no output**. Escreve o valor em campos de texto livres (`impacto`, `educacao.explicacao`) onde pode halucinar "52%" ao calcular 12 × ~4.4% por conta própria em vez de usar o valor fornecido.

**Fix:**
```typescript
// 1. No objeto contexto (~L354) — renomear para deixar unidade explícita:
// ANTES:
ipca_12m: external.ipca?.acumulado_12m ?? null,
// DEPOIS:
ipca_12m_pct: external.ipca?.acumulado_12m ?? null,  // % acumulado últimos 12 meses

// 2. No schema insights_macro no prompt (~L393) — adicionar campo numérico:
// ANTES:
"selic_atual": 0,
// DEPOIS:
"selic_atual": 0,
"ipca_12m_pct": 0.0,   // preencher com o valor exato de ipca_12m_pct dos DADOS — não calcular
```

---

### BUG 17 — Greedy regex no content-writer (BUG 14 nunca aplicado aqui)

**Arquivo:** `frontend/lib/agents/newsletter/content-writer/content-writer-agent.ts`
**Linha:** 281

**Código atual:**
```typescript
const jsonMatch = raw.match(/\{[\s\S]*\}/)   // ← GREEDY
```

**Problema:** Mesmo bug do BUG 14 corrigido no insight-analyzer, mas **nunca replicado ao content-writer**. Com respostas Claude longas, captura do primeiro `{` ao último `}` do response, podendo incluir múltiplos objetos aninhados e corromper o parse.

**Fix:** Aplicar brace-counting idêntico ao `parseInsightResponse` já implementado no insight-analyzer.

---

### BUG 18 — content-writer sem instrução de uso do `ipca_12m` no prompt

**Arquivo:** `frontend/lib/agents/newsletter/content-writer/content-writer-agent.ts`
**Linhas:** 224–228 (prompt template)

**Problema:** O prompt passa `contexto` com `ipca_12m` mas não instrui Claude sobre o que o valor representa nem proíbe cálculo próprio. Claude pode escrever "52%" nos campos `alertas[].descricao`, `insights[].impacto` ou `numero_destaque.valor`.

**Fix:** Adicionar instrução explícita no prompt após "DADOS:":
```
ATENÇÃO: ipca_12m = IPCA acumulado nos últimos 12 meses em % (ex: 3.81 = 3.81% ao ano).
Use EXATAMENTE o valor fornecido. NÃO calcule IPCA por conta própria. NÃO some meses.
```

---

## Console Errors

Nenhum erro de console durante os testes.

---

## Network Errors

Nenhum. IBGE API: 200. Supabase dashboard queries: 200.

---

## Database Errors

Não identificados.

---

## Root Cause Hypothesis

**O 52% é gerado pelo Claude (insight-analyzer) em campos de texto do `insights_macro`**, não pelo `fetchIPCA()`.

Fluxo do bug:
1. `fetchIPCA()` retorna corretamente `3.81` ✅
2. Insight-analyzer passa `ipca_12m: 3.81` ao Claude **sem unidade e sem campo de output**
3. Claude escreve IPCA em `impacto` ou `educacao.explicacao` — usa conhecimento de treinamento para "calcular" 12m: `12 × 4.4% ≈ 52.8%`
4. Content-writer recebe `insights_macro` com texto contendo "52%" e o propaga no newsletter
5. Newsletter exibe "52%" em campo de texto

**Por que 52% especificamente?** 12 meses × ~4.4% (IPCA médio histórico recente no treinamento do Claude) = 52.8% ≈ 52%. Claude está tratando o `ipca_12m` como variação mensal e multiplicando por 12 meses.

---

## Suggested Fix Direction

### Prioridade CRÍTICA:
- **BUG 16** — adicionar `"ipca_12m_pct": 0.0` ao schema `insights_macro` + renomear no contexto
- **BUG 18** — instrução explícita no prompt do content-writer

### Prioridade ALTA:
- **BUG 17** — brace-counting no content-writer (prevenção de truncamento futuro)

---

## Confirmações (sem bug — fixes anteriores OK)

- ✅ fetchIPCA() BUG 1 fix mantido — retorna 3.81 (último valor fev/2026), não soma
- ✅ fetchIPCA() BUG 2 fix mantido — período dinâmico (202601-202603)
- ✅ Segment-specialist integrado ao insight-analyzer
- ✅ Brace-counting no insight-analyzer (BUG 14)
- ✅ maxTokens 16000 no insight-analyzer (BUG 15)
