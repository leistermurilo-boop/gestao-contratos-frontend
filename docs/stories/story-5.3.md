# Story 5.3: Alertas do Dashboard

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 2 horas | **Responsável:** @dev

## 🎯 Objetivo
Listar contratos próximos vencimento e itens com margem baixa.

## 📁 Arquivos
```
app/(dashboard)/dashboard/page.tsx                    # ✏️ Modificar (adicionar alertas)
```

## 🔨 Implementação
```typescript
// Contratos próximos vencimento
const expiringSoon = await contratosService.getExpiringSoon(30)

// Itens margem baixa
const margemBaixa = await itensService.getWithMargemBaixa()
```

## ✅ Critérios
- [ ] Alertas exibidos em cards/lista
- [ ] MargemIndicator usado (vermelho/amarelo)
- [ ] Link para detalhes do item/contrato

**Status:** ⏳ Aguardando | **Criado:** @sm (River)
