# Story 6.3: Detalhes do Contrato

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 3 horas | **Responsável:** @dev

## 🎯 Objetivo
Página de detalhes com dados completos + listagem de itens.

## 📁 Arquivos
```
app/(dashboard)/contratos/[id]/page.tsx              # ✅ Criado
lib/services/contratos.service.ts                    # ✅ Corrigido — getById() cnpj → cnpj_numero
```

## 🔨 Implementação
- Fetch paralelo: `contratosService.getById(id)` + `itensService.getByContrato(id)`
- `useParams()` para capturar o ID dinâmico
- Card "Dados do Contrato": grid 3 cols com todos os campos relevantes
- Card "Itens": tabela com # | Descrição | Un. | Qtd | Saldo | Vlr Unit. | Margem
- `MargemIndicator` em cada item
- Botão "Editar" → `/dashboard/contratos/[id]/editar` (Story 6.4)
- Botão "Ver Anexo" exibido apenas se `anexo_url` existir
- Vigência exibe data prorrogada + label âmbar se `prorrogado = true`
- `LoadingSkeleton` completo durante fetch
- "Not found" state se contrato não retornar
- **BUG FIX:** `getById()` corrigido cnpj → cnpj_numero

## ✅ Critérios
- [x] Detalhes carregam corretamente
- [x] Itens listados com MargemIndicator
- [x] Botões de ação funcionam (Editar, Ver Anexo condicional)
- [x] Promise.all para fetch paralelo
- [x] Loading Skeleton
- [x] TypeScript: 0 erros
- [x] ESLint: 0 warnings

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
