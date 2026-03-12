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
