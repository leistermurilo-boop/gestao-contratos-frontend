# Story 8.2: Histórico de Custos por Item

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 2h | **Responsável:** @dev
**Fase:** 8 — Módulo de Custos

## 🎯 Objetivo
Página de histórico de custos de um item específico, acessível a partir da tabela de itens do contrato. Exibe custo_medio e margem_atual do item + lista de lançamentos.

## 📁 Arquivos
```
app/(dashboard)/contratos/[id]/itens/[itemId]/custos/page.tsx  # ✅ NOVO
components/tables/itens-table.tsx                               # 🔄 Adicionar link "Custos" na coluna Ações
```

## 🔑 Contexto Arquitetural
- **Rota real:** `/contratos/[id]/itens/[itemId]/custos` (mesmo grupo de rota que 6.x/7.x)
  - Este bug de roteamento será corrigido na Story 12.1 junto com o restante de 6.x/7.x
- **RLS:** acesso restrito — logistica NÃO vê custos
- **custos_item NÃO tem `deleted_at`** — append-only, listar todos
- **Coluna real:** `item_contrato_id` (FK para itens_contrato) — usar conforme service
- **custo_medio e margem_atual** vêm do banco (NUNCA recalcular — Decisão #3)

## 🔨 Implementação

### Modificação em `itens-table.tsx`
- Na coluna Ações (visível para admin + financeiro + compras), adicionar link:
  ```
  <Link href={`/contratos/${contratoId}/itens/${item.id}/custos`}>Custos</Link>
  ```
- Usar `canViewCosts(perfil)` de `@/lib/constants/perfis` para condicionar o link
- Props novas: nenhuma — apenas usa `contratoId` já existente e `isAdmin` (ampliar para include financeiro/compras via canViewCosts)
- **Solução limpa:** adicionar prop `canViewCustos: boolean` passada pela página pai

### Página `/contratos/[id]/itens/[itemId]/custos/page.tsx`
```
'use client'
useParams: { id: contratoId, itemId }
Estado: item (ItemContrato | null), custos (CustoItem[]), loading, error

useEffect:
  Promise.all([
    itensService.getById(itemId),     // para exibir custo_medio e margem_atual
    custosService.getByItem(itemId),  // CustoItem[] — sem join necessário
  ])
  .finally(() => setLoading(false))
```

### Layout da Página
- Breadcrumb: Contratos → Contrato [numero] → Itens → [descricao] → Histórico de Custos
- Card resumo do item:
  - Descrição | Unidade | Custo Médio (CMP) | Margem Atual
  - custo_medio null → exibir '—'
  - margem_atual null → exibir '—' (logistica nunca chega aqui via ProtectedRoute)
- Tabela de lançamentos:

```
Colunas: Data Lançamento | Custo Unit. | Qtd | Total | Fornecedor | NF | Obs
```
  - Total = custo_unitario × quantidade (cálculo de exibição, não persistido)
  - NF: se nf_entrada_url → link "Ver NF" (nova aba); se não → numero_nf apenas
- Botão "Registrar Custo" → `/contratos/${contratoId}/itens/${itemId}/custos/novo`
- Estado vazio: "Nenhum custo registrado para este item."
- Skeleton: 5 linhas durante loading

### ProtectedRoute
```tsx
<ProtectedRoute allowedPerfis={[PERFIS.admin, PERFIS.juridico, PERFIS.financeiro, PERFIS.compras]}>
```
- logistica → redirecionada (RLS também bloqueia no banco)

## ✅ Critérios
- [x] custo_medio e margem_atual exibidos do banco sem recalcular
- [x] Lançamentos ordenados por data_lancamento DESC
- [x] Link "Ver NF" abre nf_entrada_url em nova aba quando presente
- [x] Botão "Registrar Custo" visível apenas para admin, financeiro, compras
- [x] logistica não acessa (ProtectedRoute)
- [x] LoadingSkeleton durante fetch
- [x] TypeScript: 0 erros | ESLint: 0 warnings

## ⚠️ Regras Críticas
- NUNCA recalcular `custo_medio` ou `margem_atual` — exibir do banco (Decisão #3)
- NUNCA passar `empresa_id` ao service — RLS injeta (Decisão #1)
- `custosService.getByItem(itemId)` usa `item_contrato_id` internamente ✅

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
