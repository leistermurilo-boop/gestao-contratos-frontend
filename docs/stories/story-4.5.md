# Story 4.5: AF Service

**Tipo:** Feature
**Prioridade:** Alta
**Estimativa:** 3 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Criar service layer para Autorizações de Fornecimento (AFs) com validação de saldo disponível.

---

## 📋 Pré-requisitos

- [x] **Story 4.4 concluída:** Upload Service implementado

---

## 📁 Arquivos a Criar

```
frontend/
├── lib/
│   ├── services/
│   │   └── af.service.ts          # ✅ Service de AFs
│   ├── hooks/
│   │   └── use-af.ts              # ✅ Hook para AFs
│   └── validations/
│       └── af.schema.ts           # ✅ Schema de validação
└── types/
    └── models.ts                  # ✏️ Adicionar tipos de AF
```

---

## 🔨 Tarefas

### 1. Criar Schema de Validação

Criar `frontend/lib/validations/af.schema.ts`:

```typescript
import { z } from 'zod'

export const afSchema = z.object({
  item_contrato_id: z.string().uuid('Item inválido'),
  numero_af: z.string().min(1, 'Número da AF é obrigatório'),
  data_emissao: z.string().min(1, 'Data de emissão é obrigatória'),
  quantidade: z.number().positive('Quantidade deve ser positiva'),
  fornecedor: z.string().min(1, 'Fornecedor é obrigatório'),
  cnpj_fornecedor: z
    .string()
    .regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos')
    .optional()
    .or(z.literal('')),
  valor_total: z.number().positive('Valor total deve ser positivo'),
  prazo_entrega: z.number().int().positive('Prazo deve ser positivo (dias)'),
  observacoes: z.string().optional(),
})

export type AFFormData = z.infer<typeof afSchema>
```

### 2. Adicionar Types

Adicionar em `frontend/types/models.ts`:

```typescript
export type AutorizacaoFornecimento = Database['public']['Tables']['autorizacoes_fornecimento']['Row']
export type AutorizacaoFornecimentoInsert = Database['public']['Tables']['autorizacoes_fornecimento']['Insert']
export type AutorizacaoFornecimentoUpdate = Database['public']['Tables']['autorizacoes_fornecimento']['Update']
```

### 3. Criar AF Service

Criar `frontend/lib/services/af.service.ts`:

```typescript
import { createClient } from '@/lib/supabase/client'
import { type AutorizacaoFornecimento, type AutorizacaoFornecimentoInsert, type AutorizacaoFornecimentoUpdate } from '@/types/models'

export class AFService {
  private supabase = createClient()

  /**
   * Buscar todas AFs
   */
  async getAll(filters?: {
    status?: string
    contratoId?: string
    itemId?: string
  }) {
    let query = this.supabase
      .from('autorizacoes_fornecimento')
      .select(`
        *,
        item:itens_contrato (
          numero_item,
          descricao,
          quantidade,
          saldo_quantidade,
          contrato:contratos (
            numero_contrato,
            orgao_publico
          )
        )
      `)
      .order('data_emissao', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.itemId) {
      query = query.eq('item_contrato_id', filters.itemId)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  /**
   * Buscar AF por ID
   */
  async getById(id: string) {
    const { data, error } = await this.supabase
      .from('autorizacoes_fornecimento')
      .select(`
        *,
        item:itens_contrato (
          *,
          contrato:contratos (
            numero_contrato,
            orgao_publico
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Validar saldo disponível do item antes de criar AF
   */
  async validateSaldo(itemId: string, quantidade: number): Promise<{ valid: boolean; saldoAtual: number; error?: string }> {
    const { data: item, error } = await this.supabase
      .from('itens_contrato')
      .select('saldo_quantidade')
      .eq('id', itemId)
      .single()

    if (error) {
      return { valid: false, saldoAtual: 0, error: 'Erro ao buscar item' }
    }

    const saldoAtual = item.saldo_quantidade || 0

    if (quantidade > saldoAtual) {
      return {
        valid: false,
        saldoAtual,
        error: `Saldo insuficiente. Disponível: ${saldoAtual}, Solicitado: ${quantidade}`,
      }
    }

    return { valid: true, saldoAtual }
  }

  /**
   * Criar nova AF
   * ⚠️ REGRA: Validar saldo disponível antes
   * ⚠️ REGRA: Upload de anexo obrigatório (bucket: autorizacoes-fornecimento)
   */
  async create(af: AutorizacaoFornecimentoInsert) {
    // Validar saldo
    const validation = await this.validateSaldo(af.item_contrato_id, af.quantidade)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const { data, error } = await this.supabase
      .from('autorizacoes_fornecimento')
      .insert(af)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Atualizar AF
   */
  async update(id: string, af: AutorizacaoFornecimentoUpdate) {
    const { data, error } = await this.supabase
      .from('autorizacoes_fornecimento')
      .update(af)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Buscar AFs pendentes (com saldo)
   */
  async getPendentes() {
    const { data, error } = await this.supabase
      .from('autorizacoes_fornecimento')
      .select('*, item:itens_contrato(numero_item, descricao)')
      .gt('saldo_af', 0)
      .eq('status', 'ativa')
      .order('data_emissao', { ascending: false })

    if (error) throw error
    return data
  }
}

export const afService = new AFService()
```

### 4. Criar Hook useAF

Criar `frontend/lib/hooks/use-af.ts`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { afService } from '@/lib/services/af.service'
import { type AutorizacaoFornecimentoInsert, type AutorizacaoFornecimentoUpdate } from '@/types/models'
import toast from 'react-hot-toast'

export function useAF() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const getAll = async (filters?: any) => {
    try {
      setLoading(true)
      return await afService.getAll(filters)
    } catch (error: any) {
      console.error('Erro ao buscar AFs:', error)
      toast.error(error.message || 'Erro ao buscar AFs')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getById = async (id: string) => {
    try {
      setLoading(true)
      return await afService.getById(id)
    } catch (error: any) {
      console.error('Erro ao buscar AF:', error)
      toast.error(error.message || 'Erro ao buscar AF')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const validateSaldo = async (itemId: string, quantidade: number) => {
    try {
      return await afService.validateSaldo(itemId, quantidade)
    } catch (error: any) {
      console.error('Erro ao validar saldo:', error)
      toast.error(error.message || 'Erro ao validar saldo')
      throw error
    }
  }

  const create = async (af: AutorizacaoFornecimentoInsert) => {
    try {
      setLoading(true)
      const result = await afService.create(af)
      toast.success('AF emitida com sucesso!')
      return result
    } catch (error: any) {
      console.error('Erro ao emitir AF:', error)
      toast.error(error.message || 'Erro ao emitir AF')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const update = async (id: string, af: AutorizacaoFornecimentoUpdate) => {
    try {
      setLoading(true)
      const result = await afService.update(id, af)
      toast.success('AF atualizada com sucesso!')
      return result
    } catch (error: any) {
      console.error('Erro ao atualizar AF:', error)
      toast.error(error.message || 'Erro ao atualizar AF')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    getAll,
    getById,
    validateSaldo,
    create,
    update,
  }
}
```

---

## ✅ Critérios de Aceitação (Done When...)

- [x] Schema de validação criado
- [x] AFService criado com métodos CRUD
- [x] **REGRA: Validação de saldo antes de criar AF**
- [x] getPendentes() implementado
- [x] Hook useAF criado
- [x] **Teste:** create() valida saldo disponível
- [x] **Teste:** Erro se quantidade > saldo
- [x] **Teste:** getPendentes() retorna apenas AFs com saldo > 0

---

## 🔗 Dependências

- **Story 4.4:** Upload Service implementado

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **Validar saldo antes de criar** - Frontend + Backend
2. **Upload de anexo obrigatório** - Path: empresa_id/af_${numero}.pdf
3. **saldo_af atualizado por trigger** - Backend calcula

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 4.6:** Entrega Service

---

**Status:** ✅ Concluída - 2026-02-19
**Criado por:** @sm (River) - 2026-02-13
