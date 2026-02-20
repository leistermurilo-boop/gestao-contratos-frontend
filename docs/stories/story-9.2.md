# Story 9.2: Emitir Autorização de Fornecimento

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 3h | **Responsável:** @dev
**Fase:** 9 — Módulo de AFs

## 🎯 Objetivo
Formulário para emitir nova AF com seleção cascata contrato→item, validação de saldo, upload opcional de documento e criação via `afService.create()` (que valida saldo internamente).

## 📁 Arquivos
```
components/forms/af-form.tsx                                # ✅ NOVO
app/(dashboard)/dashboard/autorizacoes/nova/page.tsx        # ✅ NOVO
```

## 🔑 Contexto Arquitetural
- **Rota:** `/dashboard/autorizacoes/nova`
- **Acesso:** apenas `admin` e `compras` (`canEmitAF`) — ProtectedRoute + verificação visual
- **afService.create()** já valida saldo via `validateSaldo(itemId, quantidade)` internamente → erro é surfaced como `throw new Error(...)`
- **saldo_af** é GENERATED ALWAYS → nunca enviar
- **Upload AF:** bucket `autorizacoes-fornecimento` (BUCKETS.AF), aceita .pdf/.doc/.docx, máx 10MB
- **AF Insert** (database.types.ts):
  - Required: `contrato_id`, `item_id`, `numero_af`, `data_emissao`, `quantidade_autorizada`
  - Optional: `data_vencimento`, `observacao`, `anexo_url`, `status` (default: 'pendente')
  - NUNCA passar: `empresa_id`, `id`, `saldo_af`, `quantidade_entregue`

## 🔨 Implementação

### `af-form.tsx`
```typescript
// Zod schema
const schema = z.object({
  contrato_id:          z.string().min(1, 'Selecione um contrato'),
  item_id:              z.string().min(1, 'Selecione um item'),
  numero_af:            z.string().min(1, 'Número AF obrigatório'),
  data_emissao:         z.string().min(1, 'Data obrigatória'),
  quantidade_autorizada: z.number().positive('Deve ser positivo'),
  data_vencimento:      z.string().optional().nullable(),
  observacao:           z.string().optional(),
})
```

**Seleção em cascata (contrato → item):**
1. Carregar contratos: `contratosService.getAll()` → select "Selecione o contrato"
2. Ao selecionar contrato → `itensService.getByContrato(contratoId)` → popula select de itens
   - Mostrar saldo atual no label: `#${item.numero_item} — ${item.descricao} (Saldo: ${item.saldo_quantidade} ${item.unidade})`
   - Filtrar itens com `deleted_at IS NULL` e `saldo_quantidade > 0`
3. Ao selecionar item → exibir chip de saldo: "Saldo disponível: X un."

**Fluxo de submit:**
1. Validar form (Zod)
2. Se arquivo selecionado → `uploadService.upload(BUCKETS.AF, empresa.id, file)` → `url`
3. `afService.create({ contrato_id, item_id, numero_af, data_emissao, quantidade_autorizada, data_vencimento, observacao, anexo_url: url ?? null })`
   - Se saldo insuficiente → `afService.create()` lança erro → `toast.error(error.message)`
4. Toast "AF emitida com sucesso"
5. `router.push('/dashboard/autorizacoes')`

**Campos UI:**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Contrato | Select (numero_contrato + orgao) | ✅ |
| Item | Select (cascata, desabilitado até contrato selecionado) | ✅ |
| Número AF | text | ✅ |
| Data Emissão | date | ✅ |
| Qtd Autorizada | number | ✅ |
| Data Vencimento | date | ❌ |
| Observação | textarea | ❌ |
| Upload Documento AF | FileInput .pdf/.doc/.docx | ❌ |

### Página `nova/page.tsx`
```tsx
'use client'
// ProtectedRoute allowedPerfis={[PERFIS.admin, PERFIS.compras]}
// Renderiza: <AFForm />
// Cabeçalho: "Emitir Autorização de Fornecimento"
// Link "Voltar" → /dashboard/autorizacoes
```

## ✅ Critérios
- [ ] Seleção cascata contrato → item funcional
- [ ] Saldo do item exibido em tempo real no select
- [ ] Validação de saldo: mensagem de erro clara quando insuficiente
- [ ] Upload documento AF opcional
- [ ] Redirect para lista de AFs após emissão
- [ ] Apenas admin e compras acessam (ProtectedRoute)
- [ ] TypeScript: 0 erros | ESLint: 0 warnings

## ⚠️ Regras Críticas
- NUNCA enviar `empresa_id`, `saldo_af`, `quantidade_entregue` no insert
- `afService.create()` já valida saldo — capturar e exibir o erro
- Status inicial default 'pendente' é gerenciado pelo banco (não enviar na UI)
- itensService.getByContrato usa `deleted_at IS NULL` internamente ✅

**Status:** ⏳ Aguardando | **Criado:** @sm/@architect — 2026-02-21
