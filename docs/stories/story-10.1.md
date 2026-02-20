# Story 10.1: Lista Global de Entregas

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 2h | **Responsável:** @dev
**Fase:** 10 — Módulo de Entregas

## 🎯 Objetivo
Página global de entregas (`/dashboard/entregas`) com listagem completa e filtros. Entregas são imutáveis após registro — sem botão de editar/excluir na UI.

## 📁 Arquivos
```
app/(dashboard)/dashboard/entregas/page.tsx       # 🔄 Substituir placeholder existente
components/tables/entregas-table.tsx              # ✅ NOVO — componente reutilizável
```

## 🔑 Contexto Arquitetural
- **Rota:** `/dashboard/entregas` → `app/(dashboard)/dashboard/entregas/page.tsx` ✅
- **Service:** `entregasService.getAll()` → `EntregaWithRelations[]`
- **EntregaWithRelations** inclui: `af` → `item` → `contrato` (join completo)
- **Colunas reais** (database.types.ts): `id, empresa_id, af_id, quantidade_entregue, data_entrega, nf_saida_numero, anexo_nf_url, observacao, created_at`
- **Entregas são imutáveis** — sem deleted_at, sem update, sem delete na UI
- **Perfis**: todos têm acesso de leitura; logistica pode registrar entregas

## 🔨 Implementação

### `entregas-table.tsx`
```
Props: { entregas: EntregaWithRelations[], loading: boolean }

Colunas: Data Entrega | AF# | Contrato | Item | Qtd Entregue | NF Saída | Ações

Ações:
  - Link "Ver AF" → /dashboard/autorizacoes/${entrega.af_id}

NF Saída:
  - Se anexo_nf_url → link "Ver NF" (nova aba)
  - Se apenas nf_saida_numero → exibir número
  - Se nenhum → '—'

Loading: Skeleton 5 linhas
Estado vazio: "Nenhuma entrega registrada."
Sem botão Excluir/Editar — entregas são imutáveis
```

**Filtros client-side:**
- Busca por número AF ou número NF saída

### Página `entregas/page.tsx`
```tsx
'use client'
// Estados: entregas, loading, busca

useEffect → entregasService.getAll() → setEntregas → setLoading(false)

// Botão "Registrar Entrega":
//   - Redireciona para instrução: "Acesse a AF pelo módulo de Autorizações"
//   - OU: link direto para /dashboard/autorizacoes (para selecionar AF contextualmente)
//   - Visível para todos exceto financeiro: canRegisterEntrega(usuario?.perfil)

// ProtectedRoute: todos os perfis
```

## ✅ Critérios
- [x] Entregas listadas com relações (AF, item, contrato)
- [x] Filtro por AF ou NF funcionando (client-side)
- [x] Link "Ver AF" abre detalhes da AF corretamente
- [x] nf_saida_numero exibido com link se anexo_nf_url presente
- [x] Sem botão de excluir/editar (imutabilidade respeitada)
- [x] LoadingSkeleton durante fetch
- [x] TypeScript: 0 erros | ESLint: 0 warnings

## ⚠️ Regras Críticas
- NUNCA exibir botão de excluir/editar — entregas não têm `deleted_at`
- Coluna real: `nf_saida_numero` (NÃO `nota_fiscal_saida` — era nome antigo no migration)
- NUNCA passar `empresa_id` ao service — RLS injeta (Decisão #1)
- `entregasService.getAll()` ordenado por `data_entrega DESC` ✅

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
