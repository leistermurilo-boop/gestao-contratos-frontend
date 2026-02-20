# Story 12.1: Quality Gates — Correção de Roteamento e Validações

**Tipo:** Chore/Fix | **Prioridade:** Alta | **Estimativa:** 3h | **Responsável:** @dev
**Fase:** 12 — Deploy

## 🎯 Objetivo
Corrigir o bug crítico de roteamento das Stories 6.x/7.x e executar quality gates completos: TypeScript sem erros, ESLint sem warnings, ProtectedRoute em todas as páginas e auditoria de regras críticas.

## 🐛 Bug Crítico: Roteamento Stories 6.x/7.x

### Problema
```
Stories 6.x/7.x estão em: app/(dashboard)/contratos/[id]/...
Rota real gerada:          /contratos/[id]/...       ← URL ERRADA

Sidebar aponta para:       /dashboard/contratos      ← CORRETO
Placeholder correto em:    app/(dashboard)/dashboard/contratos/page.tsx
```

`(dashboard)` é um route group — o segmento é OMITIDO da URL. Portanto:
- `app/(dashboard)/contratos/` → URL `/contratos/`   ← **ERRADO**
- `app/(dashboard)/dashboard/contratos/` → URL `/dashboard/contratos/` ← **CORRETO**

### Solução: Mover as pastas
```
MOVER:
app/(dashboard)/contratos/ → app/(dashboard)/dashboard/contratos/

Arquivos afetados:
- contratos/page.tsx (já existe em dashboard/contratos — mover conteúdo de 6.x)
- contratos/[id]/page.tsx
- contratos/[id]/editar/page.tsx
- contratos/novo/page.tsx
- contratos/[id]/itens/page.tsx
- contratos/[id]/itens/novo/page.tsx
- contratos/[id]/itens/[itemId]/editar/page.tsx
- contratos/[id]/itens/[itemId]/custos/page.tsx  (Story 8.2)
- contratos/[id]/itens/[itemId]/custos/novo/page.tsx  (Story 8.3)
- dashboard/autorizacoes/[afId]/entregas/nova/page.tsx (Story 10.2 — já correto)
```

**Atualizar links hardcoded:**
- Em todos os componentes: `/contratos/...` → `/dashboard/contratos/...`
- Em `itens-table.tsx`: link editar e custos
- Em `contratos/[id]/page.tsx`: link "Gerenciar Itens"
- Em sidebar (se houver links relativos)

## 📁 Arquivos

```
# Reorganização de rotas (mover diretórios):
app/(dashboard)/contratos/           # ❌ REMOVER após mover conteúdo
app/(dashboard)/dashboard/contratos/ # ✅ DESTINO (substitui placeholder existente)

# Atualizações de links em componentes:
components/tables/itens-table.tsx
components/tables/contratos-table.tsx (se existir)
app/(dashboard)/dashboard/contratos/[id]/page.tsx
app/(dashboard)/dashboard/contratos/[id]/itens/page.tsx
```

## 🔨 Implementação

### Passo 1: Mover estrutura de rotas
```bash
# No Windows (via File Explorer ou mv):
# Copiar conteúdo de app/(dashboard)/contratos/ para app/(dashboard)/dashboard/contratos/
# O dashboard/contratos/page.tsx placeholder já existe — substituir pelo conteúdo de Story 6.1

# ⚠️ Atenção: os arquivos da pasta app/(dashboard)/contratos/ implementam Stories 6.x/7.x
# Os arquivos em app/(dashboard)/dashboard/contratos/ são apenas placeholders
```

### Passo 2: Atualizar links em componentes
```typescript
// Padrão a buscar e substituir:
/contratos/${id}           →  /dashboard/contratos/${id}
/contratos/${id}/itens     →  /dashboard/contratos/${id}/itens
/contratos/${id}/editar    →  /dashboard/contratos/${id}/editar
href="/contratos"          →  href="/dashboard/contratos"
router.push('/contratos')  →  router.push('/dashboard/contratos')
```

### Passo 3: Quality gates
```bash
cd frontend
npx tsc --noEmit    # TypeScript: 0 erros
npm run lint        # ESLint: 0 warnings
```

### Passo 4: Auditoria de regras críticas
Verificar em TODOS os arquivos:
- [ ] Nenhum `empresa_id` passado diretamente nos services
- [ ] Nenhum cálculo de `saldo_af`, `saldo_quantidade`, `valor_total`, `custo_medio`, `margem_atual` no frontend
- [ ] Todos os `delete` nas tabelas sem `deleted_at` removidos (custos_item, entregas)
- [ ] `deleted_at IS NULL` filtrado em contratos e itens (já no service)

### Passo 5: Verificar ProtectedRoute
Páginas que DEVEM ter ProtectedRoute com perfis corretos:
| Página | Perfis permitidos |
|--------|-------------------|
| /dashboard/custos | admin, juridico, financeiro, compras |
| /dashboard/autorizacoes | todos |
| /dashboard/entregas | todos |
| /dashboard/reajustes | admin, juridico |
| /dashboard/usuarios | admin |
| /dashboard/empresas | admin |
| /dashboard/perfil | todos |
| custos/* (histórico, registrar) | admin, juridico, financeiro, compras |
| autorizacoes/nova | admin, compras |
| autorizacoes/[id]/entregas/nova | admin, juridico, compras, logistica |

## ✅ Critérios
- [x] Bug de roteamento corrigido — URLs corretas no browser
- [x] Sidebar links funcionando para todas as rotas
- [x] `npx tsc --noEmit` → 0 erros
- [x] `npm run lint` → 0 warnings
- [x] Auditoria de regras críticas concluída
- [x] Todas as páginas com ProtectedRoute correto

## ⚠️ Notas
- Ao mover arquivos no Windows: criar na pasta destino → copiar conteúdo → deletar original
- Testar navegação completa após mover (não só o build)
- Verificar link "Meu Perfil" na sidebar → `/dashboard/perfil` (adicionar se não existir)

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
