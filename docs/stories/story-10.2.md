# Story 10.2: Registrar Entrega

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 2h | **Responsável:** @dev
**Fase:** 10 — Módulo de Entregas

## 🎯 Objetivo
Formulário para registrar entrega de uma AF. Acessível a partir dos Detalhes da AF (Story 9.3), com AF pré-selecionada. `entregasService.create()` valida saldo da AF internamente antes de inserir.

## 📁 Arquivos
```
components/forms/entrega-form.tsx                                           # ✅ NOVO
app/(dashboard)/dashboard/autorizacoes/[afId]/entregas/nova/page.tsx        # ✅ NOVO
```

## 🔑 Contexto Arquitetural
- **Rota:** `/dashboard/autorizacoes/[afId]/entregas/nova`
- **Acesso:** todos exceto `financeiro` (`canRegisterEntrega`) — ProtectedRoute
- **entregasService.create()** valida saldo da AF internamente via `validateSaldoAF()` → lança erro se insuficiente
- **Trigger backend:** `processar_entrega()` atualiza `quantidade_entregue` e `saldo_af` na AF + `saldo_quantidade` no item
- **Upload NF Saída:** bucket `notas-fiscais-saida` (BUCKETS.NF_SAIDA), aceita .pdf/.xml, máx 5MB
- **Entrega Insert** (database.types.ts):
  - Required: `af_id`, `quantidade_entregue`, `data_entrega`
  - Optional: `nf_saida_numero`, `anexo_nf_url`, `observacao`
  - NUNCA passar: `empresa_id`

## 🔨 Implementação

### `entrega-form.tsx`
```typescript
// Zod schema
const schema = z.object({
  quantidade_entregue: z.number().positive('Deve ser positivo'),
  data_entrega:        z.string().min(1, 'Data obrigatória'),
  nf_saida_numero:     z.string().optional().nullable(),
  observacao:          z.string().optional(),
})

interface EntregaFormProps {
  afId: string
  af: AFWithRelations  // pré-carregada pela página
}
```

**Exibir contexto da AF no topo do form:**
```
AF: {af.numero_af} | Item: {af.item?.descricao}
Saldo disponível: {af.saldo_af} {af.item?.unidade}
```
- Saldo exibido do banco — NUNCA calcular

**Fluxo de submit:**
1. Validar form (Zod)
2. Se arquivo NF Saída selecionado → `uploadService.upload(BUCKETS.NF_SAIDA, empresa.id, file)` → `url`
3. `entregasService.create({ af_id: afId, quantidade_entregue, data_entrega, nf_saida_numero, observacao, anexo_nf_url: url ?? null })`
   - Se saldo insuficiente → service lança erro → `toast.error(error.message)`
4. Toast "Entrega registrada com sucesso"
5. `router.push(`/dashboard/autorizacoes/${afId}`)`

**Campos UI:**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Quantidade Entregue | number | ✅ |
| Data Entrega | date, default hoje | ✅ |
| Nº NF Saída | text | ❌ |
| Upload NF Saída | FileInput .pdf/.xml | ❌ |
| Observação | textarea | ❌ |

### Página `[afId]/entregas/nova/page.tsx`
```tsx
'use client'
// useParams: { afId }
// Carrega AF: afService.getById(afId) → setAf
// Verifica: af.status === 'cancelada' || af.saldo_af <= 0 → toast + redirect
// ProtectedRoute: todos exceto financeiro
//   allowedPerfis={[PERFIS.admin, PERFIS.juridico, PERFIS.compras, PERFIS.logistica]}
// Renderiza: <EntregaForm afId={afId} af={af} />
```

## ✅ Critérios
- [ ] Contexto da AF exibido (AF#, item, saldo)
- [ ] Saldo da AF exibido do banco sem recalcular
- [ ] Validação de saldo: erro claro quando quantidade > saldo_af
- [ ] Upload NF Saída opcional
- [ ] Redirect para Detalhes da AF após registrar
- [ ] Financeiro não acessa (ProtectedRoute)
- [ ] AF cancelada ou com saldo zero → redirect automático
- [ ] TypeScript: 0 erros | ESLint: 0 warnings

## ⚠️ Regras Críticas
- NUNCA enviar `empresa_id` no insert (Decisão #1)
- NUNCA calcular saldo_af no frontend — `entregasService.create()` valida via banco (Decisão #3)
- Trigger `processar_entrega()` atualiza saldos automaticamente — frontend não precisa fazer nada pós-insert
- Coluna NF: `nf_saida_numero` (não `nota_fiscal_saida`)
- Upload path deve começar com `empresa_id/`

**Status:** ⏳ Aguardando | **Criado:** @sm/@architect — 2026-02-21
