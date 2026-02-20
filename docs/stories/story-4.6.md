# Story 4.6: Entrega Service

**Tipo:** Feature
**Prioridade:** Alta
**Estimativa:** 3 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Criar service layer para entregas com validação de saldo da AF e atualização automática de saldos.

---

## 📋 Pré-requisitos

- [x] **Story 4.5 concluída:** AF Service implementado

---

## 📁 Arquivos a Criar

```
frontend/
├── lib/
│   ├── services/
│   │   └── entregas.service.ts    # ✅ Service de entregas
│   ├── hooks/
│   │   └── use-entregas.ts        # ✅ Hook para entregas
│   └── validations/
│       └── entrega.schema.ts      # ✅ Schema de validação
└── types/
    └── models.ts                  # ✏️ Adicionar tipos de entrega
```

---

## 🔨 Tarefas

### 1. Criar Schema de Validação

Criar `frontend/lib/validations/entrega.schema.ts`:

```typescript
import { z } from 'zod'

export const entregaSchema = z.object({
  af_id: z.string().uuid('AF inválida'),
  data_entrega: z.string().min(1, 'Data de entrega é obrigatória'),
  quantidade_entregue: z.number().positive('Quantidade deve ser positiva'),
  numero_nf_saida: z.string().min(1, 'Número da NF é obrigatório'),
  valor_nf: z.number().positive('Valor da NF deve ser positivo'),
  observacoes: z.string().optional(),
})

export type EntregaFormData = z.infer<typeof entregaSchema>
```

### 2. Adicionar Types

Adicionar em `frontend/types/models.ts`:

```typescript
export type Entrega = Database['public']['Tables']['entregas']['Row']
export type EntregaInsert = Database['public']['Tables']['entregas']['Insert']
export type EntregaUpdate = Database['public']['Tables']['entregas']['Update']
```

### 3. Criar Entregas Service

Criar `frontend/lib/services/entregas.service.ts`:

```typescript
import { createClient } from '@/lib/supabase/client'
import { type Entrega, type EntregaInsert } from '@/types/models'

export class EntregasService {
  private supabase = createClient()

  /**
   * Buscar todas entregas
   */
  async getAll(filters?: {
    afId?: string
    contratoId?: string
    dataInicio?: string
    dataFim?: string
  }) {
    let query = this.supabase
      .from('entregas')
      .select(`
        *,
        af:autorizacoes_fornecimento (
          numero_af,
          fornecedor,
          item:itens_contrato (
            numero_item,
            descricao,
            contrato:contratos (
              numero_contrato,
              orgao_publico
            )
          )
        )
      `)
      .order('data_entrega', { ascending: false })

    if (filters?.afId) {
      query = query.eq('af_id', filters.afId)
    }

    if (filters?.dataInicio) {
      query = query.gte('data_entrega', filters.dataInicio)
    }

    if (filters?.dataFim) {
      query = query.lte('data_entrega', filters.dataFim)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  /**
   * Buscar entrega por ID
   */
  async getById(id: string) {
    const { data, error } = await this.supabase
      .from('entregas')
      .select(`
        *,
        af:autorizacoes_fornecimento (
          *,
          item:itens_contrato (
            *,
            contrato:contratos (
              numero_contrato,
              orgao_publico
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Buscar entregas de uma AF
   */
  async getByAF(afId: string) {
    const { data, error } = await this.supabase
      .from('entregas')
      .select('*')
      .eq('af_id', afId)
      .order('data_entrega', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Validar saldo disponível da AF
   */
  async validateSaldoAF(afId: string, quantidade: number): Promise<{ valid: boolean; saldoAtual: number; error?: string }> {
    const { data: af, error } = await this.supabase
      .from('autorizacoes_fornecimento')
      .select('saldo_af, quantidade')
      .eq('id', afId)
      .single()

    if (error) {
      return { valid: false, saldoAtual: 0, error: 'Erro ao buscar AF' }
    }

    const saldoAtual = af.saldo_af || 0

    if (quantidade > saldoAtual) {
      return {
        valid: false,
        saldoAtual,
        error: `Saldo insuficiente na AF. Disponível: ${saldoAtual}, Solicitado: ${quantidade}`,
      }
    }

    return { valid: true, saldoAtual }
  }

  /**
   * Criar nova entrega
   * ⚠️ REGRA: Validar saldo da AF
   * ⚠️ REGRA: Backend atualiza saldo_af e quantidade_entregue via trigger
   * ⚠️ REGRA: Upload de NF saída obrigatório (bucket: notas-fiscais-saida)
   */
  async create(entrega: EntregaInsert) {
    // Validar saldo da AF
    const validation = await this.validateSaldoAF(entrega.af_id, entrega.quantidade_entregue)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const { data, error } = await this.supabase
      .from('entregas')
      .insert(entrega)
      .select()
      .single()

    if (error) throw error

    // ⚠️ Backend trigger atualiza automaticamente:
    // - saldo_af (AF)
    // - quantidade_entregue (item_contrato)
    // - saldo_quantidade (item_contrato)

    return data
  }
}

export const entregasService = new EntregasService()
```

### 4. Criar Hook useEntregas

Criar `frontend/lib/hooks/use-entregas.ts`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { entregasService } from '@/lib/services/entregas.service'
import { type EntregaInsert } from '@/types/models'
import toast from 'react-hot-toast'

export function useEntregas() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const getAll = async (filters?: any) => {
    try {
      setLoading(true)
      return await entregasService.getAll(filters)
    } catch (error: any) {
      console.error('Erro ao buscar entregas:', error)
      toast.error(error.message || 'Erro ao buscar entregas')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getById = async (id: string) => {
    try {
      setLoading(true)
      return await entregasService.getById(id)
    } catch (error: any) {
      console.error('Erro ao buscar entrega:', error)
      toast.error(error.message || 'Erro ao buscar entrega')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getByAF = async (afId: string) => {
    try {
      setLoading(true)
      return await entregasService.getByAF(afId)
    } catch (error: any) {
      console.error('Erro ao buscar entregas:', error)
      toast.error(error.message || 'Erro ao buscar entregas')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const validateSaldoAF = async (afId: string, quantidade: number) => {
    try {
      return await entregasService.validateSaldoAF(afId, quantidade)
    } catch (error: any) {
      console.error('Erro ao validar saldo:', error)
      toast.error(error.message || 'Erro ao validar saldo')
      throw error
    }
  }

  const create = async (entrega: EntregaInsert) => {
    try {
      setLoading(true)
      const result = await entregasService.create(entrega)
      toast.success('Entrega registrada com sucesso!')
      router.refresh() // Atualizar saldos na UI
      return result
    } catch (error: any) {
      console.error('Erro ao registrar entrega:', error)
      toast.error(error.message || 'Erro ao registrar entrega')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    getAll,
    getById,
    getByAF,
    validateSaldoAF,
    create,
  }
}
```

---

## ✅ Critérios de Aceitação (Done When...)

- [x] Schema de validação criado
- [x] EntregasService criado
- [x] **REGRA: Validação de saldo da AF antes de criar**
- [x] **REGRA: Backend atualiza saldos via trigger (não fazer no frontend)**
- [x] Hook useEntregas criado
- [x] **Teste:** create() valida saldo da AF
- [x] **Teste:** Erro se quantidade > saldo_af
- [x] **Teste:** Backend atualiza saldo_af e quantidade_entregue
- [ ] **Teste:** Upload NF saída — previsto para story de UI (anexo_nf_url já no schema)

---

## 🔗 Dependências

- **Story 4.5:** AF Service implementado

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **Validar saldo AF antes de criar** - Frontend + Backend
2. **Backend atualiza saldos via trigger** - Não fazer no frontend
3. **Upload NF saída obrigatório** - Path: empresa_id/nf_saida_${af_id}_${date}.pdf
4. **Refresh UI após criar** - Saldos mudaram

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 5.1:** Métricas do Dashboard

---

**Status:** ✅ Concluída — 2026-02-20
**Criado por:** @sm (River) - 2026-02-13
