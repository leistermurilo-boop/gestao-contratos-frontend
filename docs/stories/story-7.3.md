# Story 7.3: Soft Delete Item (inline na ItensTable)

**Tipo:** Feature | **Prioridade:** Média | **Estimativa:** 1 hora | **Responsável:** @dev

## 📁 Arquivos
```
components/tables/itens-table.tsx       # ✅ Incluído na Story 7.1 (ConfirmDialog + onDelete prop)
app/(dashboard)/contratos/[id]/itens/page.tsx  # ✅ handleDelete inline — atualiza lista sem reload
```

## 🔨 Implementação
- Botão ✕ na tabela (admin only) abre `ConfirmDialog`
- `handleDelete(itemId)`: `itensService.softDelete(id)` + `setItens(prev => prev.filter(...))`
- Lista atualizada localmente sem reload de página
- **REGRA:** NUNCA hard delete — `softDelete()` atualiza `deleted_at` (Decisão #5)

## ✅ Critérios
- [x] Apenas admin vê botão de remover
- [x] Confirmação antes de remover (ConfirmDialog)
- [x] Item desaparece da lista imediatamente (optimistic update)
- [x] Toast de sucesso/erro
- [x] TypeScript: 0 erros | ESLint: 0 warnings

**Nota:** Esta story foi implementada junto com 7.1 pois o soft delete inline é parte natural da ItensTable.

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
