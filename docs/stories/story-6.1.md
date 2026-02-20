# Story 6.1: Lista de Contratos

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 4 horas | **Responsável:** @dev

## 🎯 Objetivo
Página de listagem de contratos com filtros, busca e paginação.

## 📁 Arquivos
```
app/(dashboard)/contratos/page.tsx                   # ✅ Criado
components/tables/contratos-table.tsx                # ✅ Criado
lib/services/contratos.service.ts                    # ✅ Corrigido — getAll() cnpj → cnpj_numero
components/ui/table.tsx                              # ✅ Adicionado (shadcn/ui)
components/ui/select.tsx                             # ✅ Adicionado (shadcn/ui)
```

## 🔨 Implementação
- DataTable com colunas: número, órgão, valor, vigência, status
- Filtros client-side com `useMemo` (busca por número/órgão + filtro de status)
- StatusBadge para cada linha
- Link para detalhes: `/dashboard/contratos/[id]` (página futura)
- Vigência exibe data prorrogada se `prorrogado = true`
- Contagem de resultados no rodapé da tabela
- **REGRA SOFT DELETE:** `getAll()` filtra `deleted_at IS NULL` ✅
- **BUG FIX:** `getAll()` corrigido de `cnpj` para `cnpj_numero` (auditoria pendente)

## ✅ Critérios
- [x] Listagem carrega contratos
- [x] Filtros funcionam (busca + status, client-side instantâneo)
- [x] StatusBadge renderiza corretamente
- [x] Contratos deletados não aparecem (soft delete via getAll())
- [x] Loading Skeleton (5 linhas)
- [x] Empty state (sem cadastro / sem resultados)
- [x] TypeScript: 0 erros
- [x] ESLint: 0 warnings

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
