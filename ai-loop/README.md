# AIOS Engineering Loop

Loop de engenharia assistida por IA entre Cowork (browser), Claude Code (terminal), agentes AIOS, Supabase e Vercel.

## Fluxo

```
1. Cowork testa a aplicação em produção/staging
       ↓
2. Cowork gera relatório → ai-loop/reports/browser-report.md
       ↓
3. @analyst lê os reports e identifica causa raiz → ai-loop/reports/database-analysis.md
       ↓
4. @architect define solução técnica → ai-loop/plans/fix-plan.md
       ↓
5. @dev implementa correções (código + migrations)
       ↓
6. @qa valida solução → ai-loop/logs/test-history.md
       ↓
7. Deploy (git push → Vercel auto-deploy) → ai-loop/logs/deploy-log.md
       ↓
8. Cowork testa novamente → volta ao passo 1
```

## Arquivos

| Arquivo | Responsável | Descrição |
|---------|------------|-----------|
| `reports/browser-report.md` | Cowork | Relatório de bugs/comportamento observado no browser |
| `reports/runtime-debug.md` | Cowork / @analyst | Erros de console, network e runtime |
| `reports/database-analysis.md` | @analyst | Análise de queries, RLS, triggers, schema |
| `plans/fix-plan.md` | @architect | Plano de correção para o bug atual |
| `plans/architecture-plan.md` | @architect | Decisões arquiteturais de médio/longo prazo |
| `logs/deploy-log.md` | @dev / @devops | Histórico de deploys com hash e status |
| `logs/test-history.md` | @qa | Histórico de resultados de testes por sessão |

## Agentes

Ver `/ai-agents/` para definição completa de responsabilidades.

## Regras

- Reports do Cowork devem seguir o formato em `cowork-integration.md`
- Nenhum agente altera código sem um `fix-plan.md` aprovado pelo @architect
- Todo deploy deve ser registrado em `deploy-log.md`
- `test-history.md` deve ser atualizado antes de fechar qualquer sessão
