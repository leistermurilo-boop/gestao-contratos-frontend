# 📐 ARCHITECT_AUTONOMY.md - Regras de Decisão Técnica

**Versão:** 1.0
**Data:** 21/02/2026
**Aplicável a partir de:** Story 8.1+

---

## 🎯 PRINCÍPIO FUNDAMENTAL

A partir deste ponto, **decisões técnicas de implementação NÃO requerem aprovação do PO**. @architect decide autonomamente sobre estrutura, padrões e implementação — desde que respeite as 12 decisões arquiteturais imutáveis e as regras de negócio já definidas.

```
┌─────────────────────────────────────────────────────────────┐
│  @ARCHITECT PODE DECIDIR SOZINHO:                           │
│ ✓ Componentização (novo vs reutilizar, granularidade)      │
│ ✓ Padrões de fetch/estado (useEffect, React Query, SWR)    │
│ ✓ Upload strategy (path structure, MIME types, size)       │
│ ✓ API Routes vs Server Actions                             │
│ ✓ Validação técnica (Zod schema, regex patterns)           │
│ ✓ Error handling (toast vs inline, retry strategy)         │
│ ✓ Loading states (skeleton, spinner, progress)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 DECISÕES QUE @ARCHITECT PODE TOMAR SOZINHO

### 1. Componentização e Estrutura

**Pode decidir:**
- Criar componente novo vs reutilizar existente
- Granularidade de componentes (atomic design)
- Client Component vs Server Component
- Composição (children, render props, HOC)

**Exemplo:**
```typescript
// ✅ DECISÃO: Criar UploadNFDialog como componente separado
// Justificativa: Reutilizável em custos (NF entrada) e entregas (NF saída)
// Trade-off: +1 arquivo, mas DRY

// ❌ NÃO PRECISA PERGUNTAR AO PO
```

---

### 2. Padrões de Fetch e Estado

**Pode decidir:**
- useEffect + useState vs React Query vs SWR
- Paginação: cursor-based vs offset vs scroll infinito
- Prefetch ou lazy load
- Polling interval para dados em tempo real
- Cache strategy (stale-while-revalidate, cache-first)

**Exemplo:**
```typescript
// ✅ DECISÃO: Usar scroll infinito para lista de custos
// Justificativa: Melhor UX para dados append-only, performance otimizada
// Trade-off: Mais complexo que paginação simples

// ❌ NÃO PRECISA PERGUNTAR AO PO
```

---

### 3. Upload e Storage

**Pode decidir:**
- Bucket path structure
- MIME types aceitos
- File size limits
- Validação de arquivo (client vs server)
- Nome de arquivo (sanitize, hash, timestamp)

**Exemplo:**
```typescript
// ✅ DECISÃO: Path: {empresa_id}/custos/{item_id}/{timestamp}-{filename}
// Justificativa: Isolamento por empresa + auditável por timestamp

// ❌ NÃO PRECISA PERGUNTAR AO PO
```

---

### 4. API e Server-Side

**Pode decidir:**
- Route Handler vs Server Action
- Validação no servidor (Zod, manual)
- Rate limiting strategy
- Error response format (JSON structure)

**Exemplo:**
```typescript
// ✅ DECISÃO: API Route para convite de usuário
// POST /api/admin/users/invite
// Justificativa: Usa SERVICE_ROLE_KEY, isolado do cliente

// ❌ NÃO PRECISA PERGUNTAR AO PO
```

---

### 5. UI/UX Técnico

**Pode decidir:**
- Skeleton vs Spinner vs Progress bar
- Toast duration (3s, 5s, persistent)
- Confirmação modal vs inline
- Debounce time em busca (300ms, 500ms)
- Formato de data/moeda (locale)

**Exemplo:**
```typescript
// ✅ DECISÃO: Confirmação de delete como Dialog modal
// Justificativa: Destrutivo, precisa atenção do usuário

// ❌ NÃO PRECISA PERGUNTAR AO PO
```

---

### 6. Performance e Otimização

**Pode decidir:**
- Lazy loading de componentes pesados
- Code splitting (dynamic imports)
- Memoization (useMemo, useCallback)
- Virtualização de listas longas

---

## ⚠️ DECISÕES QUE REQUEREM CONSULTA AO PO

### Quando DEVE perguntar:

1. **Mudança de Fluxo de Negócio**
```
❌ "Permito registrar entrega parcial em AF cancelada?"
⚠️ CONSULTAR PO (regra de negócio)
```

2. **Alteração de Permissões**
```
❌ "Qual perfil pode cancelar AF?"
⚠️ CONSULTAR PO (regra funcional)
```

3. **Validação de Negócio**
```
❌ "Bloquear custo se item já foi entregue 100%?"
⚠️ CONSULTAR PO
```

4. **Mudança de Experiência Esperada (UX funcional)**
```
❌ "Usuário deve confirmar antes de sair do form com dados não salvos?"
⚠️ CONSULTAR PO (UX desejada)
```

---

## 📐 CHECKLIST DE AUTO-VALIDAÇÃO

Antes de implementar decisão técnica:

```markdown
[ ] Consultar docs/ARCHITECTURAL_DECISIONS.md (12 decisões imutáveis)
[ ] Verificar padrão já usado em Stories 1.1–7.3
[ ] Decisão respeita RLS + Soft Delete + Multi-tenant?
[ ] TypeScript + ESLint passarão sem warnings?
[ ] Afeta regra de negócio? (Se SIM → Consultar PO)
[ ] Há precedente no projeto? (Seguir o padrão)
```

Se TODOS os 5 primeiros ✅ e item 5 ❌ → **PODE DECIDIR SOZINHO**

---

## 🔄 FLUXO ATUALIZADO DE STORY (Story 8.1+)

```
1. @analyst lê story e valida 6 pontos (PRÉ)
   ↓
2. @architect DECIDE SOZINHO:
   - Estrutura técnica
   - Componentização
   - Padrões de código
   - APIs/endpoints
   - Upload strategy
   (DOCUMENTA decisões não-triviais)
   ↓
3. @dev implementa seguindo decisões do @architect
   ↓
4. @analyst valida 6 pontos (PÓS)
   ↓
5. Commit
```

**Ganho:** Velocidade 2–3x maior (menos ida-e-volta)

---

## 🚨 ZONA PROIBIDA (Nunca Alterar Sem PO)

```
❌ Alterar regras de perfil (quem vê/edita o quê)
❌ Mudar fluxo de aprovação/rejeição
❌ Adicionar/remover validação de negócio
❌ Modificar cálculos (margem, CMP, saldos) — backend faz
❌ Alterar políticas de soft delete
❌ Expor SERVICE_ROLE_KEY no cliente
❌ Quebrar multi-tenancy (queries sem RLS)
```

---

## 📚 FONTES DE VERDADE (Consultar Sempre)

1. **docs/ARCHITECTURAL_DECISIONS.md** — 12 decisões imutáveis
2. **frontend/types/database.types.ts** — Fonte da verdade das colunas
3. **.claude/VALIDATION_RULES.md** — Checklist de 6 pontos
4. **frontend/lib/constants/perfis.ts** — Permissões por perfil
5. **Stories 1.1–7.3 implementadas** — Padrões estabelecidos

---

## 🎯 EXEMPLO PRÁTICO — Story 8.3 (Registrar Custo)

### ✅ Decisões do @architect (autônomas):
```typescript
// Componentização: CustoForm + FileInput separados
// Upload path: {empresa_id}/nf-entrada/{timestamp}.pdf
// Validação: Zod client-side + erro surfaced do service
// Loading: Skeleton durante fetch, Progress bar no upload
// Error: Toast global + campo inline para erros de validação
```

### ⚠️ Consultaria PO apenas se:
```
- "Logística pode ver custos cadastrados por outros perfis?" (permissão)
- "Permitir registrar custo retroativo?" (regra funcional)
```

---

**Última atualização:** 21/02/2026
**Aprovado por:** Product Owner
**Vigência:** Stories 8.1 até 12.4
