import { createClient } from '@/lib/supabase/client'
import {
  type AutorizacaoFornecimento,
  type AutorizacaoFornecimentoInsert,
  type AutorizacaoFornecimentoUpdate,
} from '@/types/models'

// Campos imutáveis após criação — bloqueados do update em compile-time
type AFUpdateSeguro = Omit<
  AutorizacaoFornecimentoUpdate,
  'empresa_id' | 'id' | 'contrato_id' | 'item_id'
>

export interface FiltrosAF {
  status?: AutorizacaoFornecimento['status']
  contratoId?: string
  itemId?: string
}

export interface AFWithRelations extends AutorizacaoFornecimento {
  item?: {
    numero_item: number | null
    descricao: string
    quantidade: number
    saldo_quantidade: number
    contrato?: {
      numero_contrato: string
      orgao_publico: string
    } | null
  } | null
}

export interface ValidacaoSaldo {
  valid: boolean
  saldoAtual: number
  error?: string
}

export class AFService {
  private get supabase() {
    return createClient()
  }

  /**
   * Buscar todas as AFs com filtros opcionais.
   * ⚠️ Decisão #1: RLS filtra empresa_id automaticamente
   */
  async getAll(filtros?: FiltrosAF): Promise<AFWithRelations[]> {
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

    if (filtros?.status) {
      query = query.eq('status', filtros.status)
    }

    if (filtros?.contratoId) {
      query = query.eq('contrato_id', filtros.contratoId)
    }

    if (filtros?.itemId) {
      query = query.eq('item_id', filtros.itemId) // Coluna real: item_id
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return (data ?? []) as AFWithRelations[]
  }

  /**
   * Buscar AF por ID com relações completas.
   */
  async getById(id: string): Promise<AFWithRelations> {
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

    if (error) throw new Error(error.message)
    return data as AFWithRelations
  }

  /**
   * Validar se o item tem saldo suficiente para a AF.
   * ⚠️ saldo_quantidade é GENERATED ALWAYS — nunca recalcular (Decisão #3)
   * ⚠️ Inclui deleted_at IS NULL para ignorar itens excluídos (Decisão #5)
   */
  async validateSaldo(itemId: string, quantidade: number): Promise<ValidacaoSaldo> {
    const { data: item, error } = await this.supabase
      .from('itens_contrato')
      .select('saldo_quantidade')
      .eq('id', itemId)
      .is('deleted_at', null)
      .single()

    if (error || !item) {
      return { valid: false, saldoAtual: 0, error: 'Erro ao buscar saldo do item' }
    }

    const saldoAtual = item.saldo_quantidade

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
   * Criar nova AF.
   * ⚠️ REGRA: Validar saldo disponível antes de inserir (frontend + backend valida)
   * ⚠️ empresa_id NÃO passar — RLS injeta (Decisão #1)
   * ⚠️ saldo_af atualizado por trigger no backend (Decisão #3)
   */
  async create(af: AutorizacaoFornecimentoInsert): Promise<AutorizacaoFornecimento> {
    const saldoValidation = await this.validateSaldo(af.item_id, af.quantidade_autorizada)
    if (!saldoValidation.valid) {
      throw new Error(saldoValidation.error)
    }

    const { data, error } = await this.supabase
      .from('autorizacoes_fornecimento')
      .insert(af)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  /**
   * Atualizar AF.
   * ⚠️ Campos imutáveis bloqueados por AFUpdateSeguro em compile-time
   */
  async update(id: string, af: AFUpdateSeguro): Promise<AutorizacaoFornecimento> {
    const { data, error } = await this.supabase
      .from('autorizacoes_fornecimento')
      .update(af)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  /**
   * Buscar AFs com saldo pendente (status pendente ou parcial com saldo > 0).
   * ⚠️ Status válidos: 'pendente' | 'parcial' | 'concluida' | 'cancelada' — 'ativa' não existe
   */
  async getPendentes(): Promise<AFWithRelations[]> {
    const { data, error } = await this.supabase
      .from('autorizacoes_fornecimento')
      .select('*, item:itens_contrato(numero_item, descricao)')
      .in('status', ['pendente', 'parcial'])
      .gt('saldo_af', 0)
      .order('data_emissao', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as AFWithRelations[]
  }
}

export const afService = new AFService()
