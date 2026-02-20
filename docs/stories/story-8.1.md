# Story 8.1: Lista Global de Custos

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 2h | **Responsável:** @dev
**Fase:** 8 — Módulo de Custos

## 🎯 Objetivo
Página global de custos (`/dashboard/custos`) com listagem completa, filtros e link para histórico por item.

## 📁 Arquivos
```
app/(dashboard)/dashboard/custos/page.tsx          # 🔄 Substituir placeholder existente
components/tables/custos-table.tsx                 # ✅ NOVO — componente reutilizável
```

## 🔑 Contexto Arquitetural
- **Rota real:** `/dashboard/custos` → `app/(dashboard)/dashboard/custos/page.tsx`
- **RLS:** `custos_item SELECT` → apenas `admin, juridico, financeiro, compras` (logistica excluída no banco e na UI)
- **custos_item NÃO tem `deleted_at`** → custos são append-only (trilha contábil). Listar todos sem filtro de soft-delete.
- **Colunas reais** (database.types.ts): `id, empresa_id, item_contrato_id, data_lancamento, custo_unitario, quantidade, fornecedor, numero_nf, nf_entrada_url, observacao, created_at`
- **Não existe `update()` nem `softDelete()` no `custosService`** — UI de custos é read + create.

## 🔨 Implementação

### CustosTable (componente)
```
Colunas: Data Lançamento | Contrato | Item | Custo Unit. | Qtd | Fornecedor | NF | Ações
```
- `custosService.getAll()` retorna `CustoItemWithRelations` (join com `itens_contrato → contratos`)
- Filtros client-side: busca por fornecedor, numero_nf
- Linha clicável: link para `/contratos/[contrato_id]/itens/[item_id]/custos`
- Sem botão "Deletar" — custos são imutáveis na UI
- Skeleton: 5 linhas durante loading

### Página
- `'use client'`, `useEffect` + `custosService.getAll()`, `setLoading(false)` em **finally**
- `ProtectedRoute allowedPerfis={[PERFIS.admin, PERFIS.juridico, PERFIS.financeiro, PERFIS.compras]}`
- Botão "Registrar Custo" → redireciona para instrução: "Acesse o item pelo módulo de Contratos"
  - (Custo exige contexto de item; não há seleção global)
- Estado vazio: "Nenhum custo registrado ainda."

## ✅ Critérios
- [ ] Custos listados com relações (contrato, item)
- [ ] logistica não acessa (ProtectedRoute + RLS)
- [ ] Sem botão de excluir/editar (custos imutáveis na UI)
- [ ] Filtro por fornecedor e NF funcionando (client-side)
- [ ] LoadingSkeleton durante fetch
- [ ] TypeScript: 0 erros | ESLint: 0 warnings

## ⚠️ Regras Críticas
- NUNCA recalcular `custo_medio` ou `margem_atual` no frontend — exibir do banco
- NUNCA passar `empresa_id` no service — RLS injeta
- `custosService.getAll()` usa `CustoItemWithRelations` — join com item e contrato já incluso

**Status:** ⏳ Aguardando | **Criado:** @sm/@architect — 2026-02-21
