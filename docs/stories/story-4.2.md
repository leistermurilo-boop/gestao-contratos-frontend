# Story 4.2: Item Service

**Tipo:** Feature
**Prioridade:** Alta
**Estimativa:** 3 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Criar service layer para itens de contrato com regras de negócio e cálculos do backend.

---

## 📋 Pré-requisitos

- [x] **Story 4.1 concluída:** Contrato Service implementado

---

## 📁 Arquivos a Criar

```
frontend/
├── lib/
│   ├── services/
│   │   └── itens.service.ts       # ✅ Service de itens
│   ├── hooks/
│   │   └── use-itens.ts           # ✅ Hook para itens
│   └── validations/
│       └── item.schema.ts         # ✅ Schema de validação
└── types/
    └── models.ts                  # ✏️ Adicionar tipos de itens
```

---

## 🔨 Tarefas

### 1. Criar Schema de Validação

Criar `frontend/lib/validations/item.schema.ts`:

```typescript
import { z } from 'zod'

export const itemContratoSchema = z.object({
  contrato_id: z.string().uuid('Contrato inválido'),
  numero_item: z.number().int().positive('Número do item deve ser positivo'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  unidade_medida: z.string().optional(),
  quantidade: z.number().positive('Quantidade deve ser positiva'),
  valor_unitario: z.number().positive('Valor unitário deve ser positivo'),
})

export type ItemContratoFormData = z.infer<typeof itemContratoSchema>
```

### 2. Adicionar Types de Domínio

Adicionar em `frontend/types/models.ts`:

```typescript
export type ItemContrato = Database['public']['Tables']['itens_contrato']['Row']
export type ItemContratoInsert = Database['public']['Tables']['itens_contrato']['Insert']
export type ItemContratoUpdate = Database['public']['Tables']['itens_contrato']['Update']
```

### 3. Criar Itens Service

Criar `frontend/lib/services/itens.service.ts`:

```typescript
import { createClient } from '@/lib/supabase/client'
import { type ItemContrato, type ItemContratoInsert, type ItemContratoUpdate } from '@/types/models'

export class ItensService {
  private supabase = createClient()

  /**
   * Buscar itens de um contrato
   * ⚠️ REGRA: Soft delete aplicado
   * ⚠️ REGRA: margem_atual, saldo_quantidade vêm do backend (NUNCA recalcular)
   */
  async getByContrato(contratoId: string) {
    const { data, error } = await this.supabase
      .from('itens_contrato')
      .select('*')
      .eq('contrato_id', contratoId)
      .is('deleted_at', null)
      .order('numero_item', { ascending: true })

    if (error) throw error
    return data
  }

  /**
   * Buscar item por ID
   */
  async getById(id: string) {
    const { data, error } = await this.supabase
      .from('itens_contrato')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Criar novo item
   * ⚠️ REGRA: empresa_id e cnpj_id vêm do contrato (trigger valida)
   */
  async create(item: ItemContratoInsert) {
    const { data, error } = await this.supabase
      .from('itens_contrato')
      .insert(item)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Atualizar item
   * ⚠️ REGRA: NUNCA recalcular margem_atual, CMP ou saldo
   */
  async update(id: string, item: ItemContratoUpdate) {
    // Remove campos calculados se estiverem presentes
    const {
      margem_atual,
      saldo_quantidade,
      valor_total,
      ultimo_custo_unitario,
      custo_medio_ponderado,
      ...updateData
    } = item as any

    const { data, error } = await this.supabase
      .from('itens_contrato')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Soft delete
   */
  async softDelete(id: string) {
    const { data, error } = await this.supabase
      .from('itens_contrato')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Buscar itens com margem baixa (alerta disparado)
   */
  async getWithMargemBaixa() {
    const { data, error } = await this.supabase
      .from('itens_contrato')
      .select(`
        *,
        contrato:contratos (
          numero_contrato,
          orgao_publico
        )
      `)
      .eq('margem_alerta_disparado', true)
      .is('deleted_at', null)
      .order('margem_atual', { ascending: true })

    if (error) throw error
    return data
  }
}

export const itensService = new ItensService()
```

### 4. Criar Hook useItens

Criar `frontend/lib/hooks/use-itens.ts`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { itensService } from '@/lib/services/itens.service'
import { type ItemContratoInsert, type ItemContratoUpdate } from '@/types/models'
import toast from 'react-hot-toast'

export function useItens() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const getByContrato = async (contratoId: string) => {
    try {
      setLoading(true)
      return await itensService.getByContrato(contratoId)
    } catch (error: any) {
      console.error('Erro ao buscar itens:', error)
      toast.error(error.message || 'Erro ao buscar itens')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getById = async (id: string) => {
    try {
      setLoading(true)
      return await itensService.getById(id)
    } catch (error: any) {
      console.error('Erro ao buscar item:', error)
      toast.error(error.message || 'Erro ao buscar item')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const create = async (item: ItemContratoInsert) => {
    try {
      setLoading(true)
      const result = await itensService.create(item)
      toast.success('Item criado com sucesso!')
      return result
    } catch (error: any) {
      console.error('Erro ao criar item:', error)
      toast.error(error.message || 'Erro ao criar item')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const update = async (id: string, item: ItemContratoUpdate) => {
    try {
      setLoading(true)
      const result = await itensService.update(id, item)
      toast.success('Item atualizado com sucesso!')
      return result
    } catch (error: any) {
      console.error('Erro ao atualizar item:', error)
      toast.error(error.message || 'Erro ao atualizar item')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const softDelete = async (id: string) => {
    try {
      setLoading(true)
      await itensService.softDelete(id)
      toast.success('Item removido com sucesso!')
      router.refresh()
    } catch (error: any) {
      console.error('Erro ao remover item:', error)
      toast.error(error.message || 'Erro ao remover item')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    getByContrato,
    getById,
    create,
    update,
    softDelete,
  }
}
```

---

## ✅ Critérios de Aceitação (Done When...)

- [x] Schema de validação criado
- [x] ItensService criado com todos métodos
- [x] **REGRA: NUNCA recalcular margem_atual, CMP ou saldo**
- [x] **REGRA: Soft delete aplicado**
- [x] getWithMargemBaixa() implementado
- [x] Hook useItens criado
- [x] **Teste:** getByContrato() retorna itens do contrato
- [x] **Teste:** create() não tenta calcular margem
- [x] **Teste:** update() remove campos calculados
- [x] **Teste:** getWithMargemBaixa() retorna apenas alertas

---

## 🔗 Dependências

- **Story 4.1:** Contrato Service implementado

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **NUNCA recalcular margem, CMP ou saldo** - Backend calcula via triggers
2. **Valores calculados são READ-ONLY** - Remover do update
3. **Soft delete obrigatório** - Sempre filtrar deleted_at

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 4.3:** Custo Service

---

**Status:** ✅ Concluída - 2026-02-19
**Criado por:** @sm (River) - 2026-02-13
