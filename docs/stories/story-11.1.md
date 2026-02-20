# Story 11.1: Gestão de CNPJs

**Tipo:** Feature | **Prioridade:** Média | **Estimativa:** 3h | **Responsável:** @dev
**Fase:** 11 — Configurações

## 🎯 Objetivo
Página de gestão de CNPJs da empresa (`/dashboard/empresas`). Admin pode listar, criar e editar CNPJs associados à empresa. CNPJs são usados como vínculo entre contratos e fornecedores/filiais.

## 📁 Arquivos
```
lib/services/cnpjs.service.ts                       # ✅ NOVO — não existe ainda
app/(dashboard)/dashboard/empresas/page.tsx          # 🔄 Substituir placeholder existente
components/forms/cnpj-form.tsx                       # ✅ NOVO
```

## 🔑 Contexto Arquitetural
- **Rota:** `/dashboard/empresas` → `app/(dashboard)/dashboard/empresas/page.tsx` ✅
- **Acesso:** apenas `admin` (`canManageUsers` equivalente — apenas admin gerencia configurações)
- **cnpjs table** (database.types.ts):
  - Row: `id, empresa_id, cnpj_numero, tipo ('matriz'|'filial'), razao_social, nome_fantasia, cidade, estado, ativo, created_at, updated_at`
  - Insert: `empresa_id` required no schema, mas NÃO passar — RLS injeta (Decisão #1)
  - ⚠️ Verificar: o Insert de cnpjs requer `empresa_id` explicitamente no schema — confirmar se RLS injeta automaticamente ou se precisa do contexto
- **SEM soft delete** nos cnpjs — apenas `ativo: boolean` (toggle)
- **CNPJs são usados como FK** em contratos e itens — não deletar, apenas desativar

## 🔨 Implementação

### `cnpjs.service.ts` (CRIAR)
```typescript
import { createClient } from '@/lib/supabase/client'
import { type Cnpj, type CnpjInsert, type CnpjUpdate } from '@/types/models'

class CnpjsService {
  async getAll(): Promise<Cnpj[]>          // select *, order by tipo, razao_social
  async create(cnpj: CnpjInsert): Promise<Cnpj>
  async update(id: string, cnpj: Omit<CnpjUpdate, 'id' | 'empresa_id'>): Promise<Cnpj>
  async toggleAtivo(id: string, ativo: boolean): Promise<Cnpj>  // update ativo
}
export const cnpjsService = new CnpjsService()
```

### `cnpj-form.tsx`
```typescript
// Zod schema
const schema = z.object({
  cnpj_numero:   z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos (sem pontuação)'),
  tipo:          z.enum(['matriz', 'filial']),
  razao_social:  z.string().min(1, 'Obrigatório'),
  nome_fantasia: z.string().optional().nullable(),
  cidade:        z.string().optional().nullable(),
  estado:        z.string().length(2, 'UF deve ter 2 letras').optional().nullable(),
})

// Props: mode: 'create' | 'edit', cnpj?: Cnpj, onSuccess: () => void
```

### Página `empresas/page.tsx`
```tsx
'use client'
// Estados: cnpjs (Cnpj[]), loading, showForm, editingCnpj

useEffect → cnpjsService.getAll() → setCnpjs → setLoading(false)

// Tabela com colunas: CNPJ | Tipo | Razão Social | Cidade/UF | Ativo | Ações
// Tipo badge: 'matriz' → verde | 'filial' → azul
// Toggle ativo: switch/botão inline → cnpjsService.toggleAtivo(id, !cnpj.ativo)
// Ações: Editar (abre form inline ou modal) | Toggle ativo
// Botão "Adicionar CNPJ" → abre form

// ProtectedRoute allowedPerfis={[PERFIS.admin]}
```

**Estratégia de form:** Formulário exibido inline na página (não rota separada) via estado `showForm` — mais simples para uma lista de configurações.

## ✅ Critérios
- [ ] `cnpjs.service.ts` criado com getAll, create, update, toggleAtivo
- [ ] Listagem de CNPJs com tipo/ativo
- [ ] Criar CNPJ funcionando
- [ ] Editar CNPJ funcionando (campos mutáveis)
- [ ] Toggle ativo funcional (inline)
- [ ] Apenas admin acessa (ProtectedRoute)
- [ ] TypeScript: 0 erros | ESLint: 0 warnings

## ⚠️ Regras Críticas
- NUNCA passar `empresa_id` manualmente — RLS injeta (Decisão #1)
- ⚠️ Se RLS para cnpjs não injetar empresa_id automaticamente no Insert → usar `useEmpresa()` e passar `empresa_id: empresa.id` explicitamente (verificar migrations)
- NUNCA deletar CNPJ — apenas toggleAtivo (FK usada em contratos e itens)
- cnpj_numero: armazenar apenas dígitos (14), formatar apenas para exibição

**Status:** ⏳ Aguardando | **Criado:** @sm/@architect — 2026-02-21
