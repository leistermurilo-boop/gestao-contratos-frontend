# Story 7.1: Lista de Itens do Contrato

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 3 horas | **Responsável:** @dev

## 🎯 Objetivo
Listar itens de um contrato com indicador de margem.

## 📁 Arquivos
```
app/(dashboard)/contratos/[id]/itens/page.tsx         # ✅ Criar
components/tables/itens-table.tsx                     # ✅ Criar
```

## 🔨 Implementação
- Colunas: número, descrição, quantidade, saldo, valor, margem
- **MargemIndicator** para cada item
- **REGRA:** margem_atual vem do backend (NUNCA recalcular)

## ✅ Critérios
- [ ] Itens listados corretamente
- [ ] MargemIndicator mostra cores (verde/amarelo/vermelho)
- [ ] **TESTE:** margem_atual não recalculada no frontend

**Status:** ⏳ Aguardando | **Criado:** @sm (River) - 2026-02-13
