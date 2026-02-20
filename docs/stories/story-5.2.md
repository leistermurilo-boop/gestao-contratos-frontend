# Story 5.2: Gráficos do Dashboard

**Tipo:** Feature | **Prioridade:** Média | **Estimativa:** 4 horas | **Responsável:** @dev

## 🎯 Objetivo
Implementar gráficos de margem e vencimentos usando Recharts.

## 📁 Arquivos
```
lib/services/dashboard.service.ts                    # ✅ Expandido — getMargemHistorico() + getVencimentosProximos()
components/charts/margem-chart.tsx                   # ✅ Criado
components/charts/vencimentos-chart.tsx              # ✅ Criado
app/(dashboard)/dashboard/page.tsx                   # ✅ Modificado — seção "Análise" com 2 gráficos
```

## 🔨 Implementação
- Usar Recharts (LineChart, BarChart)
- Gráfico margem: evolução mensal dos últimos 3 meses (itens_contrato.margem_atual)
- Gráfico vencimentos: contratos vencendo nos próximos 90 dias, agrupados por semana
- Responsivo: `<ResponsiveContainer>`
- `'use client'` obrigatório (Recharts acessa DOM)
- Loading state via Skeleton, fallback se dados vazios
- Cores urgência vencimentos: Sem.1 = vermelho, Sem.2 = âmbar, demais = azul

## ✅ Critérios
- [x] Gráficos renderizam com dados reais
- [x] Responsivos (mobile + desktop)
- [x] Tooltips formatados (%, contratos)
- [x] 'use client' em ambos componentes
- [x] ResponsiveContainer com height 256px
- [x] Loading Skeleton durante fetch
- [x] Fallback se dados vazios
- [x] TypeScript: 0 erros
- [x] ESLint: 0 warnings
- [x] Perfil logistica: retorna [] para margem (RLS bloqueia custo_medio)

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
