# Story 9.1: Lista de Autorizações de Fornecimento (AFs)

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 3h | **Responsável:** @dev
**Fase:** 9 — Módulo de AFs

## 🎯 Objetivo
Página global de AFs (`/dashboard/autorizacoes`) com listagem completa, filtros e StatusBadge estendido para status de AF. Todos os perfis têm acesso (logistica: read-only; admin+compras: podem emitir nova AF).

## 📁 Arquivos
```
app/(dashboard)/dashboard/autorizacoes/page.tsx      # 🔄 Substituir placeholder existente
components/tables/af-table.tsx                        # ✅ NOVO — componente reutilizável
components/common/status-badge.tsx                    # 🔄 Estender: adicionar StatusAF
```

## 🔑 Contexto Arquitetural
- **Rota real:** `/dashboard/autorizacoes` → `app/(dashboard)/dashboard/autorizacoes/page.tsx` ✅ (rota correta)
- **Status AF** (database.types.ts): `'pendente' | 'parcial' | 'concluida' | 'cancelada'`
  - ⚠️ StatusBadge atual NÃO suporta esses valores → precisa ser estendido
- **Colunas reais** (database.types.ts): `id, empresa_id, contrato_id, item_id, numero_af, quantidade_autorizada, quantidade_entregue, saldo_af, status, data_emissao, data_vencimento, observacao, anexo_url, created_at, updated_at`
- **saldo_af é GENERATED ALWAYS** — nunca recalcular no frontend
- **canEmitAF**: apenas `admin` e `compras`
- **Todos os perfis** acessam (logistica: read-only via PERMISSIONS)

## 🔨 Implementação

### 1. Estender `status-badge.tsx`
```typescript
// Adicionar tipo e configs
export type StatusAF = 'pendente' | 'parcial' | 'concluida' | 'cancelada'
export type StatusBadgeType = StatusContrato | StatusReajuste | StatusAF

// Adicionar ao STATUS_CONFIG:
pendente:  { label: 'Pendente',   className: 'bg-amber-50 text-amber-700 border-amber-200' },
parcial:   { label: 'Parcial',    className: 'bg-blue-50 text-blue-700 border-blue-200' },
concluida: { label: 'Concluída',  className: 'border-transparent bg-green-100 text-green-800 hover:bg-green-100' },
cancelada: { label: 'Cancelada',  className: 'border-transparent bg-red-100 text-red-800 hover:bg-red-100' },
```
- ⚠️ `concluida` e `cancelada` coincidem em nome com StatusContrato (`concluido`, `rescindido`) — são chaves DIFERENTES, sem conflito

### 2. `af-table.tsx`
```
Props: { afs: AFWithRelations[], loading: boolean, canEmitir: boolean }

Colunas: AF# | Contrato | Item | Qtd Aut. | Qtd Entregue | Saldo AF | Status | Data Emissão | Ações

Ações:
  - Link "Detalhes" → /dashboard/autorizacoes/${af.id}  (todos os perfis)

Saldo AF: exibir do banco (saldo_af) — NUNCA recalcular
Status: <StatusBadge status={af.status} />
Loading: Skeleton 5 linhas
Estado vazio: "Nenhuma autorização de fornecimento registrada."
```

### 3. Página `autorizacoes/page.tsx`
```tsx
'use client'
// Estados: afs (AFWithRelations[]), loading, filtroStatus, busca

useEffect → afService.getAll() → setAfs → setLoading(false)

// Filtro client-side: busca por numero_af
// Filtro server-side: filtroStatus via afService.getAll({ status })

// canEmitir = canEmitAF(usuario?.perfil)
// Botão "Emitir AF" visível apenas se canEmitir
//   → router.push('/dashboard/autorizacoes/nova')

// ProtectedRoute: todos os perfis (sem restrição — lógica está nas ações)
```

## ✅ Critérios
- [ ] StatusBadge estendido: pendente/parcial/concluida/cancelada funcionando
- [ ] AFs listadas com relações (contrato, item via AFWithRelations)
- [ ] saldo_af exibido do banco — nunca recalculado
- [ ] Filtro por status funcional (client ou server-side)
- [ ] Botão "Emitir AF" visível apenas admin/compras
- [ ] Link "Detalhes" funciona para todos os perfis
- [ ] LoadingSkeleton durante fetch
- [ ] TypeScript: 0 erros | ESLint: 0 warnings

## ⚠️ Regras Críticas
- NUNCA recalcular `saldo_af` no frontend — é GENERATED ALWAYS (Decisão #3)
- NUNCA passar `empresa_id` ao service — RLS injeta (Decisão #1)
- Status 'ativa' NÃO existe na enum do banco — usar apenas: pendente/parcial/concluida/cancelada
- `afService.getAll()` retorna `AFWithRelations` com join item→contrato ✅

**Status:** ⏳ Aguardando | **Criado:** @sm/@architect — 2026-02-21
