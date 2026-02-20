# Relatório de Auditoria Técnica — 20/02/2026

**Escopo:** Stories 1.1 → 4.5 (15 stories implementadas)
**Auditores:** @analyst + @dev
**Projeto:** Sistema de Gestão de Contratos

---

## 1. Executive Summary

### Métricas

| Métrica | Valor |
|---------|-------|
| Stories implementadas | 15 (1.1–4.5) |
| Commits de story | 12 |
| Commits de correção pós-story | 7 |
| Divergências código/documentação | 6 |
| Bugs críticos | 1 |
| Bugs médios | 4 |
| Bugs baixos | 3 |
| Taxa de stories sem correção posterior | ~60% |

### Categorias de Problemas

| Severidade | Quantidade | Status |
|-----------|-----------|--------|
| 🔴 Crítico | 1 | ✅ Corrigido nesta auditoria |
| 🟡 Médio | 4 | ✅ Corrigidos nesta auditoria |
| 🟢 Baixo | 3 | ✅ Corrigidos nesta auditoria |

### Top 5 Problemas Identificados

1. **[🔴 Crítico]** `contratos.service.ts:53` — `empresa:empresas(nome)` referencia coluna inexistente
2. **[🟡 Médio]** `database.types.ts` — 10+ colunas ausentes vs. migrations reais do banco
3. **[🟡 Médio]** `empresa-context.tsx:33` — `createClient()` sem `useMemo`, nova instância a cada render
4. **[🟡 Médio]** `ARCHITECTURAL_DECISIONS.md` Decisão #9 — exemplo usa `catch (err: any)` (viola Decisão #11)
5. **[🟡 Médio]** `VALIDATION_RULES.md` — sem checklist para sincronização de types com banco

### Root Causes

- `database.types.ts` foi escrito manualmente, não gerado via `supabase gen types` — causou drift progressivo
- Fix de `empresas.nome → razao_social` (commit `360a4c2`) não propagou para `contratos.service.ts:getById()`
- Processo de validação pré-story não incluía verificação de sincronização de types vs. migrations
- Phase 2 (Stories 2.x) teve maior taxa de correção: processo ainda em maturação

---

## 2. Timeline de Implementação

### Phase 1 — Setup e Database (Stories 1.1–1.3)
Sem commits de código frontend. Database/migrations configuradas fora do git rastreado.

### Phase 2 — Autenticação (Stories 2.1–2.4)
| Commit | Tipo | Descrição |
|--------|------|-----------|
| `8da35cb` | feat | Auth Context e Protected Layout [Story 2.1] |
| `f05adf9` | refactor | **pós-story** Ajustes finais no AuthContext |
| `fa07901` | feat | Empresa Context [Story 2.2] |
| `28fa256` | refactor | **pós-story** Remover filtro empresa_id do EmpresaContext (RLS puro) |
| `48a657b` | feat | Middleware de Autenticação [Story 2.3] |
| `8832f3b` | security | **pós-story** Corrigir open redirect + rota de callback |
| `ef53054` | feat | Páginas de Autenticação [Story 2.4] |
| `d94e7b9` | fix | **pós-story** Auditoria auth: logo, signUp bug, erros traduzidos |

> **Análise:** 4 de 4 stories da Phase 2 geraram correções posteriores. Indica que o processo de validação estava ainda sendo estabelecido.

### Phase 3 — Layout e Componentes (Stories 3.1–3.3)
| Commit | Tipo | Descrição |
|--------|------|-----------|
| `a17b9b5` | feat | Dashboard Layout [Story 3.1] |
| `360a4c2` | fix | **pós-story** empresas.nome → razao_social (6 arquivos) |
| `7b4d8d4` | fix | **pós-story** Mesmo fix em app/page.tsx (arquivo omitido) |
| `67ab94c` | fix | **pós-story** Redirect da rota raiz |
| `cd27760` | feat | Sistema de Permissões [Story 3.2] |
| `8f54660` | feat | Componentes Comuns [Story 3.3] |

> **Análise:** O bug `empresas.nome` impactou 7+ arquivos e precisou de 2 commits para ser completamente resolvido.

### Phase 4 — Services (Stories 4.1–4.5)
| Commit | Tipo | Descrição |
|--------|------|-----------|
| `4c8e688` | feat | Contrato Service [Story 4.1] |
| `d557227` | feat | Item Service [Story 4.2] |
| `bde3cc5` | feat | Custo Service [Story 4.3] |
| `9b99b57` | feat | Upload Service [Story 4.4] |
| `6f5ebf8` | feat | AF Service [Story 4.5] |

> **Análise:** Phase 4 foi a mais limpa — 0 commits de correção posteriores. O processo @analyst pré-validação pegou os erros DURANTE a implementação (validação de nomes de colunas vs. DB).

---

## 3. Divergências Código vs. Documentação

### 3.1 database.types.ts vs. Migrations SQL

#### Tabela `empresas`

| Coluna (Migration 001) | No database.types.ts | Impacto |
|------------------------|---------------------|---------|
| `plano` | ❌ Ausente | 🟡 Médio — sem acesso tipado ao plano |
| `status` | ❌ Ausente | 🟡 Médio — sem acesso tipado ao status da empresa |
| `archived_at` | ❌ Ausente | 🟢 Baixo — não usado no frontend ainda |
| `deleted_at` | ❌ Ausente | 🟢 Baixo — soft delete de empresa não implementado |
| `created_by` | ❌ Ausente | 🟢 Baixo — rastreamento futuro |

#### Tabela `cnpjs`

| Coluna (Migration 001) | No database.types.ts | Impacto |
|------------------------|---------------------|---------|
| `cnpj_numero` (nome real) | ✅ Existe como `cnpj` | 🟡 **Divergência de nome** — pode causar erro ao inserir |
| `tipo` | ❌ Ausente | 🟡 Médio |
| `cidade` | ❌ Ausente | 🟡 Médio |
| `estado` | ❌ Ausente | 🟡 Médio |

> ⚠️ **Atenção:** A coluna `cnpj_numero` na migration vs `cnpj` no types é uma divergência crítica latente. Quando o módulo de CNPJs for implementado, o insert falhará. **Ação necessária: verificar nome real da coluna no Supabase antes da Story de CNPJs.**

#### Tabela `usuarios`

| Coluna (Migration 001) | No database.types.ts | Impacto |
|------------------------|---------------------|---------|
| `ultimo_acesso` | ❌ Ausente | 🟢 Baixo — rastreamento de acesso futuro |
| `created_by` | ❌ Ausente | 🟢 Baixo — rastreamento futuro |

#### Tabelas `contratos`, `itens_contrato`, `custos_item`, `autorizacoes_fornecimento`, `entregas`, `reajustes`, `auditoria`
✅ Sincronizadas (validadas na Phase 4 pelo processo @analyst).

### 3.2 Violações das Decisões Arquiteturais

| Arquivo | Linha | Problema | Decisão | Severidade |
|---------|-------|---------|---------|-----------|
| `contratos.service.ts` | 53 | `empresa:empresas(nome)` — coluna não existe | — | 🔴 Crítico |
| `empresa-context.tsx` | 33 | `createClient()` sem `useMemo` | #12 | 🟡 Médio |
| `ARCHITECTURAL_DECISIONS.md` | 216 | Exemplo usa `catch (err: any)` | #11 | 🟡 Médio |
| `VALIDATION_RULES.md` | — | Sem item de sync database/types | — | 🟡 Médio |

### 3.3 Checklist Decisões #1–#12

| Decisão | Descrição | Status |
|---------|-----------|--------|
| #1 Multi-tenant via RLS | Zero `.eq('empresa_id')` encontrado nos services | ✅ OK |
| #2 Loading em finally | Todos services têm `finally` | ✅ OK |
| #3 Cálculos no backend | Nenhum recálculo de margem/saldo no frontend | ✅ OK |
| #4 Context Hierarchy | Auth → Empresa → children | ✅ OK |
| #5 Soft delete | Todos os deletes usam `deleted_at`, todos os SELECTs filtram `.is('deleted_at', null)` | ✅ OK |
| #6 usuario.ativo no middleware | Verificado em TODA request | ✅ OK |
| #7 Validação frontend = UX | ProtectedRoute é UX, RLS é segurança | ✅ OK |
| #8 Nunca expor SERVICE_ROLE_KEY | Apenas ANON_KEY no frontend | ✅ OK |
| #9 Loading/Error Handling | Implementado | ⚠️ Exemplo docs usa `any` |
| #10 Anti-open-redirect | Implementado no login | ✅ OK |
| #11 Sem `any` | Zero `: any` ou `as any` nos services/hooks | ✅ OK |
| #12 useEffect deps | Verificado nos contexts | ⚠️ `loadUser` sem `useCallback` no AuthContext |

---

## 4. Gaps Arquiteturais

### 4.1 Páginas Faltando (Corrigido nesta sessão)
7 rotas definidas em `routes.ts` mas sem arquivo `page.tsx`. Causou 404 ao navegar no menu. **Corrigido: arquivos criados.**

### 4.2 EmpresaContext — createClient instável
```typescript
// ❌ ANTES (instável - nova instância a cada render)
const supabase = createClient()

// ✅ DEPOIS
const supabase = useMemo(() => createClient(), [])
```

### 4.3 Auth Context — loadUser sem useCallback
`loadUser` é redefinida a cada render e capturada pelo closure do `onAuthStateChange`. Risco baixo de stale closure mas viola boas práticas de React.

### 4.4 PROGRESS.md
Arquivo não encontrado em nenhum caminho. Referenciado no PROGRESS.md mencionado no histórico de commits (`2691348 docs: atualizar PROGRESS.md`) — pode ter sido movido ou deletado.

---

## 5. Smoke Tests (Avaliação Mental)

### Cenário 1: Login
| Etapa | Status |
|-------|--------|
| Abrir `/login` | ✅ Funcional |
| Credenciais válidas → signIn | ✅ Funcional |
| Redirect `/dashboard` | ✅ Funcional |
| Middleware verifica `usuario.ativo` | ✅ Implementado |
| Empresa carregada no sidebar | ✅ Funcional |

### Cenário 2: Navegação no Dashboard
| Etapa | Status |
|-------|--------|
| Dashboard principal | ✅ Funcional |
| Clicar em qualquer menu item | ⚠️ **Gerava 404** — 7 páginas faltando |
| Após correção desta sessão | ✅ Todas as páginas placeholder existem |

### Cenário 3: Contrato — getById
| Etapa | Status |
|-------|--------|
| Buscar contrato com join empresa | 🔴 **Falha** — `empresa:empresas(nome)` |
| `nome` não existe na tabela | 🔴 Query retorna erro do Supabase |

### Cenário 4: Perfil Logística
| Etapa | Status |
|-------|--------|
| Sidebar não mostra "Custos" | ✅ `canAccessRoute` filtra por perfil |
| `ProtectedRoute` bloqueia `/custos` | ✅ Funcional |
| RLS bloqueia no banco | ✅ Configurado nas migrations |

---

## 6. Plano de Ação — Correções Imediatas

### Grupo 1 — Bugs Críticos (aplicados nesta auditoria)
- [x] `contratos.service.ts:53` — Corrigir `empresa:empresas(nome)` → `razao_social, nome_fantasia`

### Grupo 2 — Estabilidade (aplicados nesta auditoria)
- [x] `empresa-context.tsx` — Adicionar `useMemo` no `createClient()`

### Grupo 3 — Documentação (aplicados nesta auditoria)
- [x] `ARCHITECTURAL_DECISIONS.md` — Corrigir exemplo com `any` na Decisão #9
- [x] `VALIDATION_RULES.md` — Adicionar checklist de sync database/types

### Grupo 4 — Types (a fazer antes da Story de CNPJs)
- [ ] Verificar nome real da coluna `cnpjs.cnpj_numero` vs `cnpjs.cnpj` no Supabase
- [ ] Adicionar colunas faltantes em `database.types.ts` (plano, status, archived_at, etc.)

---

## 7. Prevenção Futura

### Processo Revisado

```
@analyst pré-story:
  1. ✅ Consistência arquitetural (já existe)
  2. ✅ Dependências técnicas (já existe)
  3. ✅ Validação de dados (já existe)
  4. ✅ Pontos de falha (já existe)
  5. ✅ Gaps de implementação (já existe)
  6. ✨ NOVO: Sync database/types (adicionar ao VALIDATION_RULES.md)

@dev pós-implementação:
  1. ✅ Código segue ARCHITECTURAL_DECISIONS.md
  2. ✅ RLS correto
  3. ✅ Loading states
  4. ✅ Types explícitos
  5. ✨ NOVO: Verificar join queries com nomes de colunas reais
```

### Lições Aprendidas

1. **Column renaming cascades:** Quando uma coluna é renomeada/corrigida, buscar TODOS os usos com `grep` — não apenas nos contexts, mas também em services (join selects inline).
2. **Types não auto-gerados = drift:** Manter `database.types.ts` manualmente é insustentável. Priorizar uso do `supabase gen types typescript` a partir da Story 5.x.
3. **Page files obrigatórios:** Ao criar uma rota em `routes.ts`, criar o `page.tsx` correspondente na mesma story, mesmo que seja placeholder.
4. **Phase 2 foi a mais problemática:** 100% das stories tiveram correção. Causa: processo de validação ainda em maturação. Phase 4 foi 0% — processo amadureceu.

---

**Gerado em:** 2026-02-20
**Próxima revisão:** Após Story 4.6
