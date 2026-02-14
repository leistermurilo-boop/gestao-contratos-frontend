# Story 4.1: Contrato Service

**Tipo:** Feature
**Prioridade:** Alta
**Estimativa:** 4 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Criar service layer para operações de contratos (CRUD) com todas regras de negócio e RLS.

---

## 📋 Pré-requisitos

- [x] **Story 3.3 concluída:** Componentes comuns criados
- [ ] Types do Supabase gerados (`database.types.ts`)

---

## 📁 Arquivos a Criar

```
frontend/
├── lib/
│   ├── services/
│   │   └── contratos.service.ts   # ✅ Service de contratos
│   ├── hooks/
│   │   └── use-contratos.ts       # ✅ Hook para contratos
│   └── validations/
│       └── contrato.schema.ts     # ✅ Schema de validação
└── types/
    └── models.ts                  # ✏️ Adicionar tipos de domínio
```

---

## 🔨 Tarefas

### 1. Criar Schema de Validação

Criar `frontend/lib/validations/contrato.schema.ts`:

```typescript
import { z } from 'zod'

export const contratoSchema = z.object({
  cnpj_id: z.string().uuid('CNPJ inválido'),
  numero_contrato: z.string().min(1, 'Número do contrato é obrigatório'),
  orgao_publico: z.string().min(1, 'Órgão público é obrigatório'),
  cnpj_orgao: z
    .string()
    .regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos')
    .optional()
    .or(z.literal('')),
  esfera: z.enum(['municipal', 'estadual', 'federal']).optional().nullable(),
  objeto: z.string().optional().nullable(),
  valor_total: z.number().positive('Valor total deve ser positivo'),
  data_assinatura: z.string().min(1, 'Data de assinatura é obrigatória'),
  data_vigencia_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_vigencia_fim: z.string().min(1, 'Data de fim é obrigatória'),
  prorrogado: z.boolean().default(false),
  data_vigencia_fim_prorrogacao: z.string().optional().nullable(),
  indice_reajuste: z.string().optional().nullable(),
  status: z.enum(['ativo', 'concluido', 'rescindido', 'suspenso', 'arquivado']).default('ativo'),
})

export type ContratoFormData = z.infer<typeof contratoSchema>
```

### 2. Criar Types de Domínio

Adicionar em `frontend/types/models.ts`:

```typescript
import { Database } from './database.types'

export type Contrato = Database['public']['Tables']['contratos']['Row']
export type ContratoInsert = Database['public']['Tables']['contratos']['Insert']
export type ContratoUpdate = Database['public']['Tables']['contratos']['Update']

export interface ContratoWithRelations extends Contrato {
  cnpj?: {
    cnpj: string
    razao_social: string
  }
  empresa?: {
    nome: string
  }
}
```

### 3. Criar Contrato Service

Criar `frontend/lib/services/contratos.service.ts`:

```typescript
import { createClient } from '@/lib/supabase/client'
import { type Contrato, type ContratoInsert, type ContratoUpdate } from '@/types/models'

export class ContratosService {
  private supabase = createClient()

  /**
   * Buscar todos os contratos
   * ⚠️ REGRA RLS: empresa_id filtrado automaticamente
   * ⚠️ REGRA SOFT DELETE: Filtrar deleted_at IS NULL
   */
  async getAll() {
    const { data, error } = await this.supabase
      .from('contratos')
      .select(`
        *,
        cnpj:cnpjs (
          cnpj,
          razao_social
        )
      `)
      .is('deleted_at', null) // ⚠️ CRÍTICO: Soft delete
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Buscar contrato por ID
   */
  async getById(id: string) {
    const { data, error } = await this.supabase
      .from('contratos')
      .select(`
        *,
        cnpj:cnpjs (
          cnpj,
          razao_social
        ),
        empresa:empresas (
          nome
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Buscar contratos com filtros
   */
  async getWithFilters(filters: {
    status?: string
    orgao?: string
    searchTerm?: string
  }) {
    let query = this.supabase
      .from('contratos')
      .select('*, cnpj:cnpjs (cnpj, razao_social)')
      .is('deleted_at', null)

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.orgao) {
      query = query.ilike('orgao_publico', `%${filters.orgao}%`)
    }

    if (filters.searchTerm) {
      query = query.or(`numero_contrato.ilike.%${filters.searchTerm}%,orgao_publico.ilike.%${filters.searchTerm}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Criar novo contrato
   * ⚠️ REGRA RLS: empresa_id NÃO é passado manualmente - RLS injeta
   */
  async create(contrato: ContratoInsert) {
    // Validar datas
    if (contrato.data_vigencia_inicio > contrato.data_vigencia_fim) {
      throw new Error('Data de início não pode ser maior que data de fim')
    }

    const { data, error } = await this.supabase
      .from('contratos')
      .insert(contrato)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Atualizar contrato
   * ⚠️ REGRA: Não permitir mudança de empresa_id
   */
  async update(id: string, contrato: ContratoUpdate) {
    // Remove empresa_id se presente (não pode ser alterado)
    const { empresa_id, ...updateData } = contrato as any

    const { data, error } = await this.supabase
      .from('contratos')
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
   * ⚠️ REGRA: Não fazer hard delete - apenas marcar deleted_at
   */
  async softDelete(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('contratos')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Buscar contratos próximos do vencimento
   */
  async getExpiringSoon(days: number = 30) {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + days)

    const { data, error } = await this.supabase
      .from('contratos')
      .select('*')
      .eq('status', 'ativo')
      .is('deleted_at', null)
      .gte('data_vigencia_fim', today.toISOString().split('T')[0])
      .lte('data_vigencia_fim', futureDate.toISOString().split('T')[0])
      .order('data_vigencia_fim', { ascending: true })

    if (error) throw error
    return data
  }
}

// Export singleton
export const contratosService = new ContratosService()
```

### 4. Criar Hook useContratos

Criar `frontend/lib/hooks/use-contratos.ts`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { contratosService } from '@/lib/services/contratos.service'
import { type ContratoInsert, type ContratoUpdate } from '@/types/models'
import toast from 'react-hot-toast'

export function useContratos() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const getAll = async () => {
    try {
      setLoading(true)
      return await contratosService.getAll()
    } catch (error: any) {
      console.error('Erro ao buscar contratos:', error)
      toast.error(error.message || 'Erro ao buscar contratos')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getById = async (id: string) => {
    try {
      setLoading(true)
      return await contratosService.getById(id)
    } catch (error: any) {
      console.error('Erro ao buscar contrato:', error)
      toast.error(error.message || 'Erro ao buscar contrato')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const create = async (contrato: ContratoInsert) => {
    try {
      setLoading(true)
      const result = await contratosService.create(contrato)
      toast.success('Contrato criado com sucesso!')
      return result
    } catch (error: any) {
      console.error('Erro ao criar contrato:', error)
      toast.error(error.message || 'Erro ao criar contrato')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const update = async (id: string, contrato: ContratoUpdate) => {
    try {
      setLoading(true)
      const result = await contratosService.update(id, contrato)
      toast.success('Contrato atualizado com sucesso!')
      return result
    } catch (error: any) {
      console.error('Erro ao atualizar contrato:', error)
      toast.error(error.message || 'Erro ao atualizar contrato')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const softDelete = async (id: string, userId: string) => {
    try {
      setLoading(true)
      await contratosService.softDelete(id, userId)
      toast.success('Contrato arquivado com sucesso!')
      router.refresh()
    } catch (error: any) {
      console.error('Erro ao arquivar contrato:', error)
      toast.error(error.message || 'Erro ao arquivar contrato')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    getAll,
    getById,
    create,
    update,
    softDelete,
  }
}
```

---

## ✅ Critérios de Aceitação (Done When...)

- [ ] Schema de validação criado com Zod
- [ ] Types de domínio criados em `models.ts`
- [ ] ContratosService criado com todos métodos CRUD
- [ ] **REGRA RLS: empresa_id NÃO passado manualmente**
- [ ] **REGRA SOFT DELETE: Filtrar deleted_at IS NULL em SELECT**
- [ ] softDelete implementado (atualiza deleted_at)
- [ ] Hook useContratos criado
- [ ] Toast notifications implementadas
- [ ] Error handling em todos métodos
- [ ] **Teste:** getAll() retorna apenas contratos não deletados
- [ ] **Teste:** create() não passa empresa_id
- [ ] **Teste:** softDelete() marca deleted_at
- [ ] **Teste:** getExpiringSoon() retorna contratos próximos vencimento

---

## 🔗 Dependências

- **Story 3.3:** Componentes comuns criados

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **NUNCA passar empresa_id manualmente** - RLS injeta automaticamente
2. **SEMPRE filtrar deleted_at IS NULL** - Soft delete obrigatório
3. **NUNCA fazer hard delete** - Apenas soft delete
4. **Validar datas** - Início não pode ser maior que fim

### 🔍 Troubleshooting:

**Se RLS bloqueia queries:**
- Verificar usuário está autenticado
- Verificar RLS policy permite operação
- Verificar empresa_id não está sendo passado

**Se soft delete não funciona:**
- Verificar deleted_by é UUID válido
- Verificar filtro deleted_at IS NULL em SELECTs

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 4.2:** Item Service

---

**Status:** ⏳ Aguardando implementação
**Criado por:** @sm (River) - 2026-02-13
