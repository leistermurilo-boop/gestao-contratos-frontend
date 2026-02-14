# Story 6.5: Soft Delete Contrato

**Tipo:** Feature | **Prioridade:** Média | **Estimativa:** 2 horas | **Responsável:** @dev

## 🎯 Objetivo
Implementar arquivamento (soft delete) de contratos.

## 📁 Arquivos
```
app/(dashboard)/contratos/[id]/page.tsx               # ✏️ Adicionar botão arquivar
components/modals/confirm-dialog.tsx                  # ✅ Criar
```

## 🔨 Implementação
- Botão "Arquivar" (apenas admin)
- Confirm dialog antes de arquivar
- Chamar `contratosService.softDelete()`
- **REGRA:** Atualiza deleted_at, não deleta registro

## ✅ Critérios
- [ ] Apenas admin vê botão
- [ ] Confirmação antes de arquivar
- [ ] **TESTE:** Contrato arquivado não aparece na lista

**Status:** ⏳ Aguardando | **Criado:** @sm (River)
