# Story 5.3: Alertas do Dashboard

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 2 horas | **Responsável:** @dev

## 🎯 Objetivo
Listar contratos próximos vencimento e itens com margem baixa.

## 📁 Arquivos
```
components/charts/dashboard-alertas.tsx              # ✅ Criado
app/(dashboard)/dashboard/page.tsx                   # ✅ Modificado — seção "Alertas"
```

## 🔨 Implementação
- `contratosService.getExpiringSoon(30)` — contratos ativos vencendo em 30 dias
- `itensService.getWithMargemBaixa()` — itens com `margem_alerta_disparado = true`
- Fetch paralelo com `Promise.all`
- `MargemIndicator` para exibir margem de cada item (vermelho/âmbar/verde)
- Colorização dos dias restantes: ≤7 dias = vermelho, ≤14 = âmbar
- Loading via Skeleton (3 linhas)
- Fallback "Nenhum alerta no momento" (verde) se arrays vazios

## ✅ Critérios
- [x] Alertas exibidos em cards/lista
- [x] MargemIndicator usado (vermelho/amarelo)
- [x] Link para detalhes (preparado — future: /contratos/[id])
- [x] 'use client' — Client Component
- [x] Loading Skeleton em finally
- [x] Error handling sem any
- [x] Promise.all para fetch paralelo
- [x] TypeScript: 0 erros
- [x] ESLint: 0 warnings

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
