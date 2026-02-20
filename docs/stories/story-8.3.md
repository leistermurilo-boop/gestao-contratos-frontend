# Story 8.3: Registrar Custo

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 2h | **Responsável:** @dev
**Fase:** 8 — Módulo de Custos

## 🎯 Objetivo
Formulário para registrar novo lançamento de custo em um item, com upload opcional de NF de entrada. O insert dispara automaticamente o trigger `processar_novo_custo()` que recalcula `custo_medio` e `margem_atual` no banco.

## 📁 Arquivos
```
components/forms/custo-form.tsx                                         # ✅ NOVO
app/(dashboard)/contratos/[id]/itens/[itemId]/custos/novo/page.tsx      # ✅ NOVO
```

## 🔑 Contexto Arquitetural
- **Rota real:** `/contratos/[id]/itens/[itemId]/custos/novo` (mesmo grupo 6.x/7.x, bug corrigido em 12.1)
- **Trigger backend:** `processar_novo_custo()` → recalcula `custo_medio` e `margem_atual` no item (NUNCA fazer isso no frontend)
- **Upload NF:** bucket `notas-fiscais-entrada` (BUCKETS.NF_ENTRADA), aceita .pdf/.xml, máx 5MB
- **uploadService.upload()** exige `empresaId` → obter de `useEmpresa()`
- **custos_item Insert** (database.types.ts):
  - Required: `item_contrato_id`, `data_lancamento`, `custo_unitario`, `quantidade`
  - Optional: `fornecedor`, `numero_nf`, `nf_entrada_url`, `observacao`
  - NUNCA passar `empresa_id` — RLS injeta automaticamente

## 🔨 Implementação

### `custo-form.tsx`
```typescript
// Zod schema
const schema = z.object({
  data_lancamento: z.string().min(1, 'Data obrigatória'),
  custo_unitario:  z.number({ invalid_type_error: 'Informe um valor' }).positive('Deve ser positivo'),
  quantidade:      z.number({ invalid_type_error: 'Informe uma quantidade' }).positive('Deve ser positivo'),
  fornecedor:      z.string().optional(),
  numero_nf:       z.string().optional(),
  observacao:      z.string().optional(),
})

// Props
interface CustoFormProps {
  contratoId: string
  itemId: string
}
```

**Fluxo de submit:**
1. Validar form com Zod (React Hook Form)
2. Se arquivo NF selecionado → `uploadService.upload(BUCKETS.NF_ENTRADA, empresa.id, file)` → capturar `url`
3. `custosService.create({ item_contrato_id: itemId, ...values, nf_entrada_url: url ?? null })`
4. Toast "Custo registrado com sucesso"
5. `router.push(`/contratos/${contratoId}/itens/${itemId}/custos`)`

**Campos UI:**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Data Lançamento | `<input type="date">`, default hoje | ✅ |
| Custo Unitário (R$) | number, casas decimais | ✅ |
| Quantidade | number inteiro | ✅ |
| Fornecedor | text | ❌ |
| Nº NF | text | ❌ |
| Upload NF | FileInput, accept=".pdf,.xml" | ❌ |
| Observação | textarea | ❌ |

- Upload NF: exibir nome do arquivo selecionado + botão limpar
- Se upload falhar → abortar submit inteiro com toast.error

### Página `novo/page.tsx`
```tsx
'use client'
// useParams: { id: contratoId, itemId }
// Busca item para exibir descrição no cabeçalho (loading + not-found)
// ProtectedRoute: admin, financeiro, compras
// Renderiza: <CustoForm contratoId={contratoId} itemId={itemId} />
```

## ✅ Critérios
- [x] Form salva custo com 4 campos obrigatórios
- [x] Upload NF opcional: funciona com e sem arquivo
- [x] nf_entrada_url preenchido somente após upload bem-sucedido
- [x] Redirect para `/contratos/[id]/itens/[itemId]/custos` após salvar
- [x] Toast de erro em falha (service ou upload)
- [x] logistica não acessa (ProtectedRoute)
- [x] TypeScript: 0 erros | ESLint: 0 warnings

## ⚠️ Regras Críticas
- NUNCA enviar `empresa_id` no insert — RLS injeta (Decisão #1)
- NUNCA calcular `custo_medio` ou `margem_atual` — trigger backend cuida (Decisão #3)
- Upload path deve começar com `empresa_id/` — uploadService valida isso
- Se upload falhar → abort todo o submit (não criar custo sem NF vinculada quando foi selecionada)

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
