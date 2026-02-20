# Story 7.1: Lista de Itens do Contrato

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 3 horas | **Responsável:** @dev

## 📁 Arquivos
```
components/tables/itens-table.tsx                     # ✅ NOVO
app/(dashboard)/contratos/[id]/itens/page.tsx         # ✅ NOVO
app/(dashboard)/contratos/[id]/page.tsx               # 🔄 Link "Gerenciar Itens" adicionado
```

## 🔨 Implementação
- `ItensTable`: componente reutilizável com props `contratoId`, `itens`, `loading`, `isAdmin`, `onDelete`
- Colunas: #, Descrição, Un., Qtd, Saldo, Vlr Unit., Margem (+ Ações para admin)
- `MargemIndicator` em cada item | `ConfirmDialog` para remover
- Admin vê botões Editar (link) e Remover (confirm dialog)
- Página `/itens`: Promise.all(getById + getByContrato), botão "Adicionar Item" (admin)
- Link "Gerenciar Itens" adicionado ao card de itens na página de detalhes
- **REGRA:** `margem_atual`, `saldo_quantidade`, `valor_total` exibidos do banco — NUNCA recalculados (Decisão #3)

## ✅ Critérios
- [x] Itens listados corretamente com todas colunas
- [x] MargemIndicator mostra cores (verde/amarelo/vermelho)
- [x] **TESTE:** margem_atual não recalculada no frontend
- [x] Soft delete inline (botão ✕) com confirmação
- [x] LoadingSkeleton durante fetch
- [x] TypeScript: 0 erros | ESLint: 0 warnings

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
