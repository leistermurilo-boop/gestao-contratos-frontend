# Story 9.3: Detalhes da Autorização de Fornecimento

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 2h | **Responsável:** @dev
**Fase:** 9 — Módulo de AFs

## 🎯 Objetivo
Página de detalhes de uma AF mostrando dados completos, saldo visual e lista de entregas vinculadas. Ponto de entrada para registrar nova entrega (Story 10.2).

## 📁 Arquivos
```
app/(dashboard)/dashboard/autorizacoes/[afId]/page.tsx           # ✅ NOVO
```

## 🔑 Contexto Arquitetural
- **Rota:** `/dashboard/autorizacoes/[afId]`
- **Services:** `afService.getById(afId)` + `entregasService.getByAF(afId)`
- **saldo_af é GENERATED ALWAYS** — exibir do banco, NUNCA recalcular
- **StatusBadge** para AF — estendido na Story 9.1
- **canRegisterEntrega**: todos exceto `financeiro`
- **Entrega**: `nf_saida_numero` (não `nota_fiscal_saida`) — coluna real conforme database.types.ts

## 🔨 Implementação

### Página `[afId]/page.tsx`
```tsx
'use client'
useParams: { afId }
Estados: af (AFWithRelations | null), entregas (Entrega[]), loading

useEffect:
  Promise.all([
    afService.getById(afId),
    entregasService.getByAF(afId),
  ])
  .then(([afData, entregasData]) => { setAf(afData); setEntregas(entregasData) })
  .catch(err => toast.error(err.message))
  .finally(() => setLoading(false))

// Not-found state se af === null após loading
```

### Layout
**Card principal — Dados da AF:**
```
AF: {af.numero_af}
Contrato: {af.item?.contrato?.numero_contrato} — {af.item?.contrato?.orgao_publico}
Item: #{af.item?.numero_item} — {af.item?.descricao}
Data Emissão: {formatDate(af.data_emissao)}
Data Vencimento: {af.data_vencimento ? formatDate(af.data_vencimento) : '—'}
Status: <StatusBadge status={af.status} />
Observação: {af.observacao ?? '—'}
Documento AF: {af.anexo_url ? <Link href={af.anexo_url} target="_blank">Ver documento</Link> : '—'}
```

**Card de saldo — Progress visual:**
```
Qtd Autorizada:  {af.quantidade_autorizada}
Qtd Entregue:    {af.quantidade_entregue}
Saldo Atual:     {af.saldo_af}  ← do banco — NUNCA recalcular

Barra de progresso:
  width = (quantidade_entregue / quantidade_autorizada) * 100 + '%'
  cor: saldo_af > 0 → azul | saldo_af === 0 → verde (concluída)
```

**Card de entregas:**
```
Cabeçalho: "Entregas" + botão "Registrar Entrega" (condicional)

Botão "Registrar Entrega":
  - Visível se canRegisterEntrega(usuario?.perfil) && af.status !== 'cancelada' && af.saldo_af > 0
  - href: /dashboard/autorizacoes/${afId}/entregas/nova

Tabela de entregas:
  Colunas: Data Entrega | Qtd Entregue | NF Saída | Observação
  - nf_saida_numero: exibir número (coluna real do banco)
  - anexo_nf_url: se presente → link "Ver NF Saída"
  Estado vazio: "Nenhuma entrega registrada para esta AF."
```

### ProtectedRoute
```tsx
// Todos os perfis acessam — sem restrição (logistica precisa ver AFs)
// Restrição está apenas no botão "Registrar Entrega"
```

## ✅ Critérios
- [x] Dados da AF exibidos corretamente com relações (contrato, item)
- [x] saldo_af do banco sem recalcular
- [x] Barra de progresso funcional (azul com saldo, verde quando concluída)
- [x] Lista de entregas da AF com nf_saida_numero e link anexo_nf_url
- [x] Botão "Registrar Entrega" visível apenas quando permitido (canRegisterEntrega + status + saldo)
- [x] Not-found state quando AF não existe
- [x] LoadingSkeleton durante fetch
- [x] TypeScript: 0 erros | ESLint: 0 warnings

## ⚠️ Regras Críticas
- NUNCA calcular saldo_af = quantidade_autorizada - quantidade_entregue no frontend (Decisão #3)
- Coluna correta: `nf_saida_numero` (não `nota_fiscal_saida`)
- Coluna correta: `af_id` (FK de entregas para autorizacoes_fornecimento)

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
