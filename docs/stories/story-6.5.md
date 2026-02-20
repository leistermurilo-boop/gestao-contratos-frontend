# Story 6.5: Soft Delete Contrato

**Tipo:** Feature | **Prioridade:** Média | **Estimativa:** 2 horas | **Responsável:** @dev

## 🎯 Objetivo
Implementar arquivamento (soft delete) de contratos.

## 📁 Arquivos
```
components/modals/confirm-dialog.tsx                  # ✅ NOVO — componente reutilizável
components/ui/alert-dialog.tsx                        # ✅ NOVO — shadcn/ui AlertDialog
app/(dashboard)/contratos/[id]/page.tsx               # 🔄 Atualizado — botão Arquivar (admin only)
```

## 🔨 Implementação
- `ConfirmDialog` reutilizável baseado em shadcn/ui `AlertDialog`
- Botão "Arquivar" visível apenas para `perfil === 'admin'` (`isAdmin` computed de `useAuth`)
- `handleArquivar()`: chama `contratosService.softDelete(id, usuario.id)`, redirect para lista
- Loading state `archiving` separado — botão exibe "Arquivando..." durante operação
- Mensagem de confirmação inclui número do contrato para clareza
- **REGRA:** `softDelete()` atualiza `deleted_at` + `deleted_by` — sem hard delete (Decisão #5)
- RLS garante isolamento — segurança real no banco, verificação admin é UX-level

## ✅ Critérios
- [x] Apenas admin vê botão Arquivar
- [x] Confirmação antes de arquivar (AlertDialog)
- [x] **TESTE:** Contrato arquivado não aparece na lista (filtro `deleted_at IS NULL` em `getAll()`)
- [x] Loading state durante operação
- [x] Redirect para `/contratos` após arquivar
- [x] Toast de sucesso/erro
- [x] ConfirmDialog reutilizável criado em `components/modals/`
- [x] TypeScript: 0 erros
- [x] ESLint: 0 warnings

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
