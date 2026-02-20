# Story 11.4: Reajustes de Contrato (Escopo Mínimo)

**Tipo:** Feature | **Prioridade:** Média | **Estimativa:** 3h | **Responsável:** @dev
**Fase:** 11 — Configurações

## 🎯 Objetivo
Página global de reajustes (`/dashboard/reajustes`) com listagem, criação e atualização manual de status. Escopo mínimo: sem workflow de aprovação — juridico solicita e altera status manualmente. Sidebar já tem link para esta rota.

## 📁 Arquivos
```
lib/services/reajustes.service.ts                    # ✅ NOVO — não existe ainda
app/(dashboard)/dashboard/reajustes/page.tsx          # 🔄 Substituir placeholder existente
components/forms/reajuste-form.tsx                    # ✅ NOVO
```

## 🔑 Contexto Arquitetural
- **Rota:** `/dashboard/reajustes` → `app/(dashboard)/dashboard/reajustes/page.tsx` ✅
- **Acesso:** `juridico` (contratos.*) e `admin` — outros perfis sem acesso
- **StatusBadge:** JÁ suporta `StatusReajuste` (`solicitado|analise|aprovado|rejeitado|implementado`) ✅
- **reajustes table** (database.types.ts):
  - Row: `id, empresa_id, contrato_id, tipo, percentual, indice_referencia, data_referencia, data_aplicacao, status, justificativa, documentacao_url, aprovado_por, created_at, updated_at`
  - Status inicial: `solicitado` (default)
- **Upload documentação:** bucket `reajustes` (BUCKETS.REAJUSTES), aceita .pdf/.doc/.docx, máx 10MB

## 🔨 Implementação

### `reajustes.service.ts` (CRIAR)
```typescript
import { createClient } from '@/lib/supabase/client'
import { type Reajuste, type ReajusteInsert, type ReajusteUpdate } from '@/types/models'

type ReajusteUpdateSeguro = Omit<ReajusteUpdate, 'id' | 'empresa_id' | 'contrato_id'>

export interface ReajusteWithRelations extends Reajuste {
  contrato?: {
    numero_contrato: string
    orgao_publico: string
  } | null
}

class ReajustesService {
  async getAll(): Promise<ReajusteWithRelations[]>    // join com contratos, order by created_at DESC
  async getByContrato(contratoId: string): Promise<Reajuste[]>
  async create(reajuste: ReajusteInsert): Promise<Reajuste>
  async updateStatus(id: string, status: Reajuste['status']): Promise<Reajuste>
}
export const reajustesService = new ReajustesService()
```

### `reajuste-form.tsx`
```typescript
// Zod schema
const schema = z.object({
  contrato_id:       z.string().min(1, 'Selecione um contrato'),
  tipo:              z.string().min(1, 'Informe o tipo'),  // livre: 'IPCA', 'INPC', 'IGPM', etc.
  percentual:        z.number().positive('Deve ser positivo'),
  indice_referencia: z.string().optional().nullable(),
  data_referencia:   z.string().min(1, 'Data obrigatória'),
  data_aplicacao:    z.string().optional().nullable(),
  justificativa:     z.string().optional().nullable(),
})
// Props: onSuccess: () => void
```

**Fluxo:**
1. Select contrato (contratosService.getAll() → somente ativos)
2. Upload documentação (opcional) → BUCKETS.REAJUSTES
3. `reajustesService.create({ contrato_id, tipo, percentual, ..., documentacao_url, status: 'solicitado' })`
4. Toast + refresh lista

### Página `reajustes/page.tsx`
```tsx
'use client'
// Estados: reajustes (ReajusteWithRelations[]), loading, showForm

useEffect → reajustesService.getAll() → setReajustes

// Tabela:
//   Colunas: Contrato | Tipo | % | Índice Ref. | Data Ref. | Status | Ações
//   Status: <StatusBadge status={reajuste.status} />
//   Ações: dropdown de atualizar status (juridico + admin)
//     [solicitado → analise → aprovado/rejeitado → implementado]

// Botão "Solicitar Reajuste" → abre ReajusteForm inline

// ProtectedRoute allowedPerfis={[PERFIS.admin, PERFIS.juridico]}
```

**Atualização de status (inline):**
- Select/dropdown por linha → `reajustesService.updateStatus(id, novoStatus)` → toast + update local

## ✅ Critérios
- [ ] `reajustes.service.ts` criado com getAll, getByContrato, create, updateStatus
- [ ] Listagem com StatusBadge correto
- [ ] Criar reajuste com upload de documento (opcional)
- [ ] Atualizar status manualmente
- [ ] Apenas admin e juridico acessam (ProtectedRoute)
- [ ] TypeScript: 0 erros | ESLint: 0 warnings

## ⚠️ Regras Críticas
- NUNCA passar `empresa_id` ao service — RLS injeta (Decisão #1)
- StatusBadge já suporta StatusReajuste ✅ — NÃO duplicar configurações
- Escopo mínimo: sem cálculo automático de novos valores de contrato — apenas registro do percentual
- `aprovado_por` é preenchido manualmente (nome/id do aprovador) ou deixado null — fora de escopo automático

**Status:** ⏳ Aguardando | **Criado:** @sm/@architect — 2026-02-21
