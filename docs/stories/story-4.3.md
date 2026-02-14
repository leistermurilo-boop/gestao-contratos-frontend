# Story 4.3: Custo Service

**Tipo:** Feature
**Prioridade:** Alta
**Estimativa:** 3 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Criar service layer para custos com verificação de perfil logística e integração com upload service.

---

## 📋 Pré-requisitos

- [x] **Story 4.2 concluída:** Item Service implementado
- [ ] Upload Service será criado na Story 4.4

---

## 📁 Arquivos a Criar

```
frontend/
├── lib/
│   ├── services/
│   │   └── custos.service.ts      # ✅ Service de custos
│   ├── hooks/
│   │   └── use-custos.ts          # ✅ Hook para custos
│   └── validations/
│       └── custo.schema.ts        # ✅ Schema de validação
└── types/
    └── models.ts                  # ✏️ Adicionar tipos de custos
```

---

## 🔨 Tarefas

### 1. Criar Schema de Validação

Criar `frontend/lib/validations/custo.schema.ts`:

```typescript
import { z } from 'zod'

export const custoSchema = z.object({
  item_contrato_id: z.string().uuid('Item inválido'),
  data_lancamento: z.string().min(1, 'Data é obrigatória'),
  custo_unitario: z.number().positive('Custo deve ser positivo'),
  fornecedor: z.string().optional(),
  numero_nf: z.string().optional(),
  observacoes: z.string().optional(),
})

export type CustoFormData = z.infer<typeof custoSchema>
```

### 2. Adicionar Types

Adicionar em `frontend/types/models.ts`:

```typescript
export type CustoItem = Database['public']['Tables']['custos_item']['Row']
export type CustoItemInsert = Database['public']['Tables']['custos_item']['Insert']
```

### 3. Criar Custos Service

Criar `frontend/lib/services/custos.service.ts`:

```typescript
import { createClient } from '@/lib/supabase/client'
import { type CustoItem, type CustoItemInsert } from '@/types/models'

export class CustosService {
  private supabase = createClient()

  /**
   * ⚠️ VERIFICAR PERFIL: Logística NÃO pode acessar custos
   * Esta verificação deve ser feita no componente/hook antes de chamar
   */

  /**
   * Buscar custos de um item
   */
  async getByItem(itemId: string) {
    const { data, error } = await this.supabase
      .from('custos_item')
      .select('*')
      .eq('item_contrato_id', itemId)
      .order('data_lancamento', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Buscar todos custos (com filtros opcionais)
   */
  async getAll(filters?: {
    contratoId?: string
    itemId?: string
    fornecedor?: string
  }) {
    let query = this.supabase
      .from('custos_item')
      .select(`
        *,
        item:itens_contrato (
          numero_item,
          descricao,
          contrato:contratos (
            numero_contrato,
            orgao_publico
          )
        )
      `)

    if (filters?.itemId) {
      query = query.eq('item_contrato_id', filters.itemId)
    }

    if (filters?.fornecedor) {
      query = query.ilike('fornecedor', `%${filters.fornecedor}%`)
    }

    const { data, error } = await query.order('data_lancamento', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Criar novo custo
   * ⚠️ REGRA: Backend recalcula CMP e margem via trigger
   * ⚠️ REGRA: Upload de NF entrada obrigatório (bucket: notas-fiscais-entrada)
   */
  async create(custo: CustoItemInsert, nfFile?: File) {
    const { data, error } = await this.supabase
      .from('custos_item')
      .insert(custo)
      .select()
      .single()

    if (error) throw error

    // Upload será feito pelo upload service (Story 4.4)
    // Path obrigatório: empresa_id/nf_entrada_${item_id}_${date}.pdf

    return data
  }

  /**
   * Buscar último custo de um item
   */
  async getUltimoCusto(itemId: string) {
    const { data, error } = await this.supabase
      .from('custos_item')
      .select('*')
      .eq('item_contrato_id', itemId)
      .order('data_lancamento', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    return data
  }
}

export const custosService = new CustosService()
```

### 4. Criar Hook useCustos

Criar `frontend/lib/hooks/use-custos.ts`:

```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { custosService } from '@/lib/services/custos.service'
import { canViewCosts } from '@/lib/constants/perfis'
import { type CustoItemInsert } from '@/types/models'
import toast from 'react-hot-toast'

export function useCustos() {
  const [loading, setLoading] = useState(false)
  const { usuario } = useAuth()

  // ⚠️ CRÍTICO: Verificar se perfil pode ver custos
  const canAccess = usuario ? canViewCosts(usuario.perfil) : false

  const getByItem = async (itemId: string) => {
    if (!canAccess) {
      throw new Error('Perfil não autorizado a visualizar custos')
    }

    try {
      setLoading(true)
      return await custosService.getByItem(itemId)
    } catch (error: any) {
      console.error('Erro ao buscar custos:', error)
      toast.error(error.message || 'Erro ao buscar custos')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getAll = async (filters?: any) => {
    if (!canAccess) {
      throw new Error('Perfil não autorizado a visualizar custos')
    }

    try {
      setLoading(true)
      return await custosService.getAll(filters)
    } catch (error: any) {
      console.error('Erro ao buscar custos:', error)
      toast.error(error.message || 'Erro ao buscar custos')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const create = async (custo: CustoItemInsert, nfFile?: File) => {
    if (!canAccess) {
      throw new Error('Perfil não autorizado a registrar custos')
    }

    try {
      setLoading(true)
      const result = await custosService.create(custo, nfFile)
      toast.success('Custo registrado com sucesso!')
      return result
    } catch (error: any) {
      console.error('Erro ao registrar custo:', error)
      toast.error(error.message || 'Erro ao registrar custo')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    canAccess, // Expor para componentes verificarem
    getByItem,
    getAll,
    create,
  }
}
```

---

## ✅ Critérios de Aceitação (Done When...)

- [ ] Schema de validação criado
- [ ] CustosService criado
- [ ] **REGRA: Verificação de perfil logística no hook**
- [ ] **REGRA: Backend recalcula CMP e margem (não fazer no frontend)**
- [ ] Hook useCustos com verificação de perfil
- [ ] canAccess exposto pelo hook
- [ ] **Teste:** Perfil logística não pode chamar métodos
- [ ] **Teste:** Outros perfis podem acessar custos
- [ ] **Teste:** create() registra custo e backend atualiza margem

---

## 🔗 Dependências

- **Story 4.2:** Item Service implementado

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **LOGÍSTICA NÃO ACESSA CUSTOS** - Verificar em hook e componentes
2. **Backend recalcula CMP e margem** - Não fazer no frontend
3. **Upload NF obrigatório** - Path: empresa_id/nf_entrada_${item}_${date}.pdf
4. **RLS automático** - empresa_id não passar manualmente

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 4.4:** Upload Service

---

**Status:** ⏳ Aguardando implementação
**Criado por:** @sm (River) - 2026-02-13
