# Story 6.1: Lista de Contratos

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 4 horas | **Responsável:** @dev

## 🎯 Objetivo
Página de listagem de contratos com filtros, busca e paginação.

## 📁 Arquivos
```
app/(dashboard)/contratos/page.tsx                    # ✅ Criar
components/tables/contratos-table.tsx                 # ✅ Criar
```

## 🔨 Implementação
- DataTable com colunas: número, órgão, valor, vigência, status
- Filtros: status, órgão, busca por número
- Status Badge para cada status
- Link para detalhes: `/contratos/[id]`
- **REGRA SOFT DELETE:** Filtrar `deleted_at IS NULL`

## ✅ Critérios
- [ ] Listagem carrega contratos
- [ ] Filtros funcionam
- [ ] StatusBadge renderiza corretamente
- [ ] **TESTE:** Contratos deletados não aparecem

**Status:** ⏳ Aguardando | **Criado:** @sm (River)
