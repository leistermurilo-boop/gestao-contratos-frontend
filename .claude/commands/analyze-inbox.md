# analyze-inbox

> Comando slash do loop de engenharia DUO Governance.
> Detecta relatórios pendentes do Cowork e dispara o ciclo de agentes AIOS.

---

## Protocolo de Execução

Ao ser invocado, execute EXATAMENTE nesta ordem:

### PASSO 0 — Sincronizar com GitHub

Execute antes de qualquer leitura:
```bash
git pull origin main
```

Isso garante que o INBOX.md e browser-report.md refletem o que o Cowork escreveu via GitHub API.

### PASSO 1 — Verificar INBOX

Leia `ai-loop/INBOX.md` e extraia o campo `Status`.

- Se `Status: IDLE` → responda apenas: `🔵 INBOX: idle — nenhum relatório pendente.` e encerre.
- Se `Status: IN_PROGRESS` → responda: `⏳ INBOX: análise em andamento.` e encerre.
- Se `Status: DONE` → responda: `✅ INBOX: ciclo anterior completo. Redefina para IDLE quando pronto.` e encerre.
- Se `Status: READY` → continue para o PASSO 2.

---

### PASSO 2 — Marcar como IN_PROGRESS

Atualize `ai-loop/INBOX.md`:
- Altere `Status: READY` → `Status: IN_PROGRESS`

---

### PASSO 3 — Ativar @analyst (modo DUO Governance)

Leia `ai-loop/reports/browser-report.md` e `ai-agents/analyst.md`.

Aplique o protocolo de diagnóstico:

```
1. Leia browser-report.md completo
2. Reproduza mentalmente o fluxo de execução
3. Identifique o componente que falhou (RLS / trigger / service / component / config)
4. Verifique evidências:
   - frontend/types/database.types.ts (schema real)
   - database/migrations/ (migration relevante)
   - frontend/lib/services/ (service envolvido)
   - memory/MEMORY.md (contexto histórico de bugs similares)
5. Formule hipótese principal + hipóteses alternativas
6. Confirme via evidências nos arquivos
```

Preencha `ai-loop/reports/database-analysis.md` com:
- **Causa raiz confirmada** (nunca aceitar "erro de RLS" sem identificar qual policy e por quê)
- **Evidências** (arquivo:linha onde o problema se manifesta)
- **Impacto** (o que mais pode ser afetado)
- **Hipóteses descartadas** (e por quê)

---

### PASSO 4 — Briefar @architect

Leia `ai-agents/architect.md` e ative o protocolo de decisão técnica.

Com base no `database-analysis.md`, preencha `ai-loop/plans/fix-plan.md`:

```
## Fix Plan

**Bug:** [nome curto]
**Causa Raiz:** [confirmada pelo @analyst]
**Solução Técnica:** [definida pelo @architect]
**Arquivos Afetados:** [lista]
**Migrations Necessárias:** sim/não — [qual]
**Riscos:** [side effects possíveis]
**Aprovado:** @architect
```

Regra: @architect define TÉCNICA, não aceita soluções propostas pelo @analyst.

---

### PASSO 5 — Ativar @dev (se fix-plan aprovado)

Leia `ai-agents/dev.md`.

Implemente as correções definidas no `fix-plan.md`:
- Siga exatamente o plano — sem adicionar funcionalidades não previstas
- Atualize `ai-loop/logs/deploy-log.md` após cada arquivo alterado
- Execute `npm run typecheck && npm run lint` antes de commitar

---

### PASSO 6 — Ativar @qa (validação)

Leia `ai-agents/qa.md`.

Valide a solução:
- Verifique se a causa raiz foi realmente endereçada
- Liste cenários de regressão possíveis
- Preencha `ai-loop/logs/test-history.md` com resultado

---

### PASSO 7 — Marcar como DONE

Atualize `ai-loop/INBOX.md`:
- `Status: IN_PROGRESS` → `Status: DONE`
- Adicione linha no histórico: `| Data | Sessão | DONE | analyst → architect → dev → qa |`

---

### PASSO 8 — Notificar

Exiba resumo final:

```
✅ Ciclo completo

Bug: [nome]
Causa raiz: [1 linha]
Fix: [1 linha]
Arquivos alterados: [lista]
Próximo passo: git push → Vercel auto-deploy → Cowork re-testa
```

---

## Regras

- **Nunca** pular etapas — o ciclo é sequencial
- **Nunca** implementar sem `fix-plan.md` aprovado pelo @architect
- Se o report estiver vazio ou inválido → marcar INBOX como IDLE + notificar
- Se análise for inconclusiva → preencher `database-analysis.md` com dúvidas e aguardar input do usuário
- Todo commit deve referenciar a sessão de teste: `fix: [descrição] [Cowork YYYY-MM-DD]`
