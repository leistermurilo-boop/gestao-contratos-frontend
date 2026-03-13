# Test History

> Histórico de resultados de testes por sessão. Atualizado pelo @qa antes de fechar cada sessão.

---

## Formato

```
### [YYYY-MM-DD] — descrição da sessão
| Cenário | Perfil | Resultado | Notas |
|---------|--------|-----------|-------|
| ... | admin | ✅ / ❌ / ⏳ | ... |
```

---

## Histórico

### [2026-03-12] — Sprint 4C fix definitivo — 2 chamadas Claude (Cowork loop #4b)
| Cenário | Perfil | Resultado | Notas |
|---------|--------|-----------|-------|
| POST → 500 com maxTokens 16000 (antes do fix) | admin | ❌ | modelo tem hard limit ~8192 tokens output |
| Split: Chamada 1 metadados JSON ~300 tokens | — | ✅ | dentro do limite |
| Split: Chamada 2 HTML body direto ~3000 tokens | — | ✅ | sem JSON wrapper |
| Montagem NewsletterHTML local | — | ✅ | sem chamada Claude extra |

### [2026-03-12] — Sprint 4C Content Writer Agent fix (Cowork loop #4)
| Cenário | Perfil | Resultado | Notas |
|---------|--------|-----------|-------|
| POST autenticado → 500 (antes do fix) | admin | ❌ | maxTokens 8000 truncava JSON |
| Fix maxTokens 8000→16000 | — | ✅ | aplicado no constructor |
| Fix JSON extraction fence fallback | — | ✅ | aplicado em generateNewsletter |

### [2026-03-12] — Sprint 4B Insight Analyzer Agent (Cowork loop #3)
| Cenário | Perfil | Resultado | Notas |
|---------|--------|-----------|-------|
| POST autenticado → 200 | admin | ✅ | 9 insights, 4 críticos, 102s |
| newsletter_insights populada | admin | ✅ | confianca_score 0.85 |
| IPCA/IBGE consultada | — | ✅ | acumulado_12m retornado |
| Bacen/Selic consultada | — | ✅ | tendência retornada |
| PNCP consultada | — | ✅ | editais para portfolio materiais |
| IBGE/PIB consultado | — | ✅ | PIB nacional retornado |
| Fallback parcial (apis_com_erro: []) | — | ✅ | nenhuma falha nesta rodada |
| POST sem auth → 401 | — | ✅ | {"error":"Não autenticado"} |

### [2026-03-12] — Sprint 4A Data Collector Agent (Cowork loop #2)
| Cenário | Perfil | Resultado | Notas |
|---------|--------|-----------|-------|
| POST autenticado → 200 | admin | ✅ | 4 contratos, 7 itens, 7 insights, 14s |
| empresa_intelligence populada | admin | ✅ | insert confirmado via resposta |
| Campos JSON válidos | — | ✅ | portfolio_materiais, padroes_renovacao, sazonalidade, orgaos_frequentes |
| confianca_score 0-1 | — | ✅ | 11 pontos → 0.50 |
| POST sem auth → 401 | — | ✅ | {"error":"Não autenticado"} |

### [2026-03-12] — Resend email endpoint (Cowork loop #1)
| Cenário | Perfil | Resultado | Notas |
|---------|--------|-----------|-------|
| GET /api/test-resend sem auth | — | ❌ 404 | Middleware bloqueava — fix aplicado |
| GET /api/test-resend após fix | — | ⏳ aguardando Cowork | Vercel auto-deploy em andamento |
| Rotas /api/ protegidas sem auth | — | ✅ não alteradas | isPublicRoute cirúrgico |

### [2026-03-11] — Soft delete via RPC
| Cenário | Perfil | Resultado | Notas |
|---------|--------|-----------|-------|
| Arquivar contrato | admin | ⏳ pendente | Aguardando teste Cowork pós-deploy |
| Remover item | admin | ⏳ pendente | Aguardando teste Cowork pós-deploy |
| Diagnóstico: PATCH deleted_at=null | admin | ✅ 204 | UPDATE funciona |
| Diagnóstico: PATCH deleted_at=timestamp | admin | ❌ 403 | Causa raiz confirmada |

### [2026-03-09] — Auth stress test
| Cenário | Perfil | Resultado | Notas |
|---------|--------|-----------|-------|
| Login após logout | admin | ✅ ~4s | Sem timeout |
| LockManager timed out | admin | ✅ não ocorreu | — |
| F5 #1-#5 no /dashboard | admin | ✅ 5/5 | Sem spinner |

### [2026-02-25] — Auth + deploy (Playwright)
| Cenário | Perfil | Resultado | Notas |
|---------|--------|-----------|-------|
| Proteção /dashboard sem sessão | — | ✅ | Redireciona /login?redirect= |
| Login com credenciais válidas | admin | ✅ | Redireciona /dashboard |
| Dashboard carrega | admin | ✅ | KPIs, gráficos, perfil |
| Logout | admin | ✅ | Redireciona /login |
| Proteção após logout | admin | ✅ | /dashboard bloqueado |

---

## Pendentes (próxima sessão)
- [ ] Soft delete de contrato em produção (pós Migration 021)
- [ ] Soft delete de item em produção (pós Migration 021)
- [ ] OCR completo em produção (depende de ANTHROPIC_API_KEY no Vercel)
- [ ] Matriz de permissões — 5 perfis (`docs/tests/matriz-permissoes.md`)
