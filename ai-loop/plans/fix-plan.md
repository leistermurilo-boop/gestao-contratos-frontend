# Fix Plan — @architect — Sprint 4E (2026-03-13)

## Fix Plan

**Bug:** Sprint 4E — 8 bugs newsletter agents
**Causa Raiz:** Confirmada por @analyst
**Aprovado:** @architect

---

### BUG 1+2 — insight-analyzer: fetchIPCA()
**Solução:**
- Período dinâmico: calcular `anoAtual` e `mesAtual` no momento da chamada
- Valor: usar `valores[valores.length - 1]` (último valor = acumulado do período)
- Mês referência: extrair da última chave da série

### BUG 3 — insight-analyzer: fetchPNCP()
**Solução:**
- Datas: `.replace(/-/g, '')` para converter `yyyy-MM-dd` → `yyyyMMdd`
- `tamanhoPagina: '10'` (mínimo da API)
- `codigoModalidadeContratacao: '5'` (Pregão Eletrônico)

### BUG 4 — insight-analyzer: fetchIBGE()
**Solução:**
- `const anoRef = new Date().getFullYear() - 2` (defasagem real do IBGE)
- URL e chave `serie[String(anoRef)]` dinâmicos

### BUG 5 — confianca_score para generateInsights()
**Solução:**
- Calcular `confianca_score` em `fetchExternalData()` ou antes de chamar `generateInsights()`
- Passar como parâmetro para `generateInsights()`
- Incluir no system prompt: nível ALTA/MÉDIA/BAIXA + aviso se < 0.6

### BUG 6 — progresso_maturidade
**Solução:**
- Função `calcularProgresso(insights)`: contar quantas das 4 fontes têm dados (ipca, selic, pncp, ibge)
- Resultado: 0/25/50/75/100% baseado em fontes disponíveis

### BUG 7 — headers email
**Solução:**
- Adicionar `replyTo: 'contato@duogovernance.com.br'`
- Adicionar `headers['List-Unsubscribe']` e `headers['List-Unsubscribe-Post']`

### BUG 8 — getDraft com draft_id
**Solução:**
- Se `draft_id` fornecido: query sem filtro de status (busca direta por ID)
- Se não: query com `.eq('status', 'draft')` + order + limit

**Arquivos Afetados:**
- `frontend/lib/agents/newsletter/insight-analyzer/insight-analyzer-agent.ts`
- `frontend/lib/agents/newsletter/content-writer/content-writer-agent.ts`
- `frontend/lib/agents/newsletter/send-newsletter/send-newsletter-agent.ts`

**Migrations Necessárias:** não

**Riscos:** Nenhum — todas as alterações são internas aos métodos privados dos agents.
