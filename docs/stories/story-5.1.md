# Story 5.1: Métricas do Dashboard

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 4 horas | **Responsável:** @dev

## 🎯 Objetivo
Implementar cards de métricas no dashboard principal com dados agregados do backend.

## 📋 Pré-requisitos
- [x] Story 4.6 concluída: Todos services implementados

## 📁 Arquivos a Criar
```
frontend/app/(dashboard)/dashboard/page.tsx          # ✏️ Modificar
frontend/components/charts/dashboard-cards.tsx        # ✅ Criar
frontend/lib/services/dashboard.service.ts            # ✅ Criar
```

## 🔨 Implementação

### dashboard.service.ts
```typescript
export class DashboardService {
  async getMetrics() {
    const [contratos, itens, alertas] = await Promise.all([
      this.getContratosMetrics(),
      this.getItensMetrics(),
      this.getAlertasMetrics(),
    ])
    return { contratos, itens, alertas }
  }
  
  private async getContratosMetrics() {
    const { count } = await supabase
      .from('contratos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo')
      .is('deleted_at', null)
    
    const { data: valores } = await supabase
      .from('contratos')
      .select('valor_total')
      .eq('status', 'ativo')
      .is('deleted_at', null)
    
    const valorTotal = valores?.reduce((acc, c) => acc + c.valor_total, 0) || 0
    return { total: count, valorTotal }
  }
}
```

### dashboard-cards.tsx
Exibir: Total Contratos, Valor Total, Margem Média, Alertas

## ✅ Critérios
- [x] Métricas carregam do backend
- [x] Cards responsivos (grid)
- [x] **REGRA: NUNCA recalcular valores - backend agrega**
- [x] Loading state implementado (Skeleton)

## 🔗 Dependências
Story 4.6: Todos services criados

**Status:** ✅ Concluída — 2026-02-21
**Criado:** @sm (River) - 2026-02-13
