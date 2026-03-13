# Browser Report — Sprint 4E FINAL

**Data:** 2026-03-13
**Sessão:** Sprint 4E — Validação pós-fix de 9 bugs nos agentes newsletter
**Ambiente:** Produção — https://app.duogovernance.com.br
**Validado por:** Cowork (ai-production-debugger + browser-qa-tester)

---

## Resultado Geral

APROVADO — 4 cenários testados, todos passaram.
1 sub-bug novo identificado (PIB ano offset) — documentado abaixo.

---

## Cenário 1 — POST /api/agents/insight-analyzer

**Test Scenario:** Verificar IPCA correto (~3.81%), PNCP retornando editais, PIB dinâmico, confianca_score passado ao Claude.

**Steps Performed:**
1. POST /api/agents/insight-analyzer via fetch no browser
2. Aguardou resposta (~97s)
3. Verificou IPCA diretamente via fetch à API IBGE (variável 2265)
4. Verificou PNCP via fetch direto com params corrigidos
5. Verificou newsletter_insights no Supabase (confianca_score, gerado_em)

**Expected Result:**
- IPCA: ~3.81% (último valor, não soma)
- PNCP: mais de 0 editais com params yyyyMMdd + tamanhoPagina=10 + codigoModalidade
- PIB: ano dinâmico disponível
- confianca_score: salvo no banco

**Actual Result:**
- success: true, apis_com_erro: [] ✅
- IPCA live: ultimoValor=3.81, ultimoMes=202602, periodo=202601-202603 ✅ (BUG 1+2 CORRIGIDO)
  - Soma errada que seria: 8.25% — confirmado que NAO está sendo usada
- PNCP live: total=978, count=10, error=none ✅ (BUG 3 CORRIGIDO)
- confianca_score: 0.85 salvo no newsletter_insights ✅ (BUG 5 CORRIGIDO)
- PIB 2024 (anoAtual-2): undefined ⚠️ — dado não disponível ainda no IBGE
  - PIB disponível: 2020, 2021, 2022, 2023 apenas
  - anoAtual-2 = 2024 retorna vazio — precisa ser anoAtual-3 ou fallback dinâmico
  - NOVO BUG 10 ENCONTRADO: PIB offset incorreto

**Console Errors:** Nenhum
**Network Errors:** Nenhum (todas as APIs responderam 200)
**Database Errors:** Nenhum

**Root Cause Hypothesis (sub-bug PIB):** Terminal usou anoAtual - 2 como offset, mas IBGE publica PIB com defasagem de 2-3 anos. Em março de 2026, o dado de 2024 ainda não foi publicado. O offset correto seria anoAtual - 3 ou buscar o último ano disponível dinamicamente.

**Suggested Fix Direction:** Alterar fetchIBGE() para buscar range e pegar último ano com valor não-nulo:
  const url = periodos/2021-2026
  const ultimo = Object.entries(serie).reverse().find(([,v]) => v && v !== '-')

**Reproducibility:** Sempre
**Severity:** MÉDIO — PIB retorna undefined mas o resto do agente funciona (Promise.allSettled)

---

## Cenário 2 — POST /api/agents/content-writer

**Test Scenario:** Verificar nome da empresa correto no conteúdo da newsletter (não mais null).

**Steps Performed:**
1. POST /api/agents/content-writer via fetch
2. Aguardou resposta (~51s)
3. Consultou newsletter_drafts gerado (id: 813e2ea7...)
4. Buscou "MGL" e percentuais no HTML via regexp_matches

**Expected Result:**
- Nome da empresa aparece corretamente (ex: "MGL")
- progresso_maturidade não é hardcoded em 70%

**Actual Result:**
- Nome "MGL" encontrado no HTML: "a MGL poderia adicionar R$ 350.000..." ✅ (BUG 9 CORRIGIDO)
- Draft gerado, subject: "4 alertas críticos + R$ 75,3K recuperáveis esta semana" ✅
- Percentuais no HTML: 0%, 100%, 81%, 46%, 15%, 17% — nenhum "70%" hardcoded ✅ (BUG 6 CORRIGIDO)

**Console Errors:** Nenhum
**Network Errors:** Nenhum
**Database Errors:** Nenhum

**Reproducibility:** Passou ✅
**Severity:** N/A

---

## Cenário 3 — POST /api/agents/send-newsletter

**Test Scenario:** Verificar envio com draft_id específico (mesmo quando status=sent), email enviado com sucesso.

**Steps Performed:**
1. POST /api/agents/send-newsletter com draft_id: 813e2ea7 e destinatario: leistermurilo@gmail.com
2. Verificou resposta com resend_id
3. Verificou Supabase: status=sent, enviado_em, enviado_para
4. BUG 8 test: Reenviou mesmo draft_id (status já=sent) para confirmar que getDraft não bloqueia
5. Verificou segundo resend_id gerado com sucesso

**Expected Result:**
- Email enviado (resend_id retornado)
- status=sent + enviado_em + enviado_para atualizado
- Reenvio por draft_id funciona mesmo com status=sent

**Actual Result:**
- 1º envio: resend_id=6b062993-828d-443c-a3b4-82bb114d483c ✅
- Supabase: status=sent, enviado_em=2026-03-13 14:58:20, enviado_para=leistermurilo@gmail.com ✅ (BUG 7 CORRIGIDO)
- 2º envio (status já=sent): resend_id=5cae540b-1cb4-4ce2-b6a0-42a5ecc0dfde ✅ (BUG 8 CORRIGIDO)
  - getDraft com draft_id encontra o draft independente do status

**Console Errors:** Nenhum
**Network Errors:** Nenhum
**Database Errors:** Nenhum

**Reproducibility:** Passou ✅
**Severity:** N/A

---

## Cenário 4 — Progresso Maturidade dinâmico

Validado em conjunto com Cenário 2.
Percentuais variados no HTML (0%, 81%, 46%) — "70%" hardcoded não existe mais ✅ (BUG 6 CORRIGIDO)

---

## Resumo Final

| # | Bug | Status |
|---|-----|--------|
| 1+2 | fetchIPCA() — soma para último + período dinâmico | CORRIGIDO ✅ |
| 3 | fetchPNCP() — 3 params (data, tamanho, modalidade) | CORRIGIDO ✅ |
| 4 | fetchIBGE() — ano offset dinâmico | PARCIAL ⚠️ (2024 indisponível, precisa -3) |
| 5 | confianca_score no Claude context | CORRIGIDO ✅ |
| 6 | progresso_maturidade calculado | CORRIGIDO ✅ |
| 7 | Send Newsletter headers email | CORRIGIDO ✅ |
| 8 | getDraft por draft_id ignora status | CORRIGIDO ✅ |
| 9 | empresa_nome razao_social/nome_fantasia | CORRIGIDO ✅ |

Score: 8/9 fixes validados — 1 sub-bug residual no PIB offset

---

## Novo Bug Identificado — BUG 10

**Arquivo:** frontend/lib/agents/newsletter/insight-analyzer/insight-analyzer-agent.ts
**Problema:** anoAtual - 2 = 2024 retorna undefined — IBGE não publicou 2024 ainda
**Anos disponíveis confirmados:** 2020, 2021, 2022, 2023 (último = 2023 = R$10.94T)
**Fix sugerido:** Buscar range e pegar último ano com valor definido em vez de offset fixo
**Severidade:** MÉDIO — agente não falha, PIB fica undefined mas outros dados funcionam
