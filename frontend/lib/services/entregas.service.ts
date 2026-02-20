import { createClient } from '@/lib/supabase/client'
import { type Entrega, type EntregaInsert } from '@/types/models'

export interface FiltrosEntrega {
  afId?: string
  dataInicio?: string
  dataFim?: string
}

export interface EntregaWithRelations extends Entrega {
  af?: {
    numero_af: string
    status: string
    saldo_af: number
    quantidade_autorizada: number
    quantidade_entregue: number
    item?: {
      numero_item: number | null
      descricao: string
      unidade: string
      contrato?: {
        numero_contrato: string
        orgao_publico: string
      } | null
    } | null
  } | null
}

export interface ValidacaoSaldoAF {
  valid: boolean
  saldoAtual: number
  error?: string
}

export class EntregasService {
  private get supabase() {
    return createClient()
  }

  /**
   * Buscar todas as entregas com filtros opcionais.
   * ⚠️ Decisão #1: RLS filtra empresa_id automaticamente — nunca filtrar manualmente
   */
  async getAll(filtros?: FiltrosEntrega): Promise<EntregaWithRelations[]> {
    let query = this.supabase
      .from('entregas')
      .select(`
        *,
        af:autorizacoes_fornecimento (
          numero_af,
          status,
          saldo_af,
          quantidade_autorizada,
          quantidade_entregue,
          item:itens_contrato (
            numero_item,
            descricao,
            unidade,
            contrato:contratos (
              numero_contrato,
              orgao_publico
            )
          )
        )
      `)
      .order('data_entrega', { ascending: false })

    if (filtros?.afId) {
      query = query.eq('af_id', filtros.afId)
    }

    if (filtros?.dataInicio) {
      query = query.gte('data_entrega', filtros.dataInicio)
    }

    if (filtros?.dataFim) {
      query = query.lte('data_entrega', filtros.dataFim)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return (data ?? []) as EntregaWithRelations[]
  }

  /**
   * Buscar entrega por ID com relações completas.
   */
  async getById(id: string): Promise<EntregaWithRelations> {
    const { data, error } = await this.supabase
      .from('entregas')
      .select(`
        *,
        af:autorizacoes_fornecimento (
          numero_af,
          status,
          saldo_af,
          quantidade_autorizada,
          quantidade_entregue,
          item:itens_contrato (
            numero_item,
            descricao,
            unidade,
            contrato:contratos (
              numero_contrato,
              orgao_publico
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data as EntregaWithRelations
  }

  /**
   * Buscar todas as entregas de uma AF específica.
   */
  async getByAF(afId: string): Promise<Entrega[]> {
    const { data, error } = await this.supabase
      .from('entregas')
      .select('*')
      .eq('af_id', afId)
      .order('data_entrega', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Validar se a AF tem saldo suficiente para a entrega.
   * ⚠️ saldo_af é GENERATED ALWAYS — nunca recalcular (Decisão #3)
   * ⚠️ Coluna correta: quantidade_autorizada (não quantidade)
   */
  async validateSaldoAF(afId: string, quantidade: number): Promise<ValidacaoSaldoAF> {
    const { data: af, error } = await this.supabase
      .from('autorizacoes_fornecimento')
      .select('saldo_af, quantidade_autorizada')
      .eq('id', afId)
      .single()

    if (error || !af) {
      return { valid: false, saldoAtual: 0, error: 'Erro ao buscar saldo da AF' }
    }

    const saldoAtual = af.saldo_af ?? 0 // ?? e não || para tratar saldo zero corretamente

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
   * Registrar nova entrega.
   * ⚠️ empresa_id NÃO passar — RLS injeta (Decisão #1)
   * ⚠️ Validar saldo da AF antes de inserir
   * ⚠️ Backend atualiza automaticamente via trigger:
   *    - autorizacoes_fornecimento.quantidade_entregue
   *    - autorizacoes_fornecimento.saldo_af (GENERATED ALWAYS)
   *    - itens_contrato.quantidade_entregue
   *    - itens_contrato.saldo_quantidade (GENERATED ALWAYS)
   */
  async create(entrega: EntregaInsert): Promise<Entrega> {
    const validation = await this.validateSaldoAF(entrega.af_id, entrega.quantidade_entregue)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const { data, error } = await this.supabase
      .from('entregas')
      .insert(entrega)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }
}

export const entregasService = new EntregasService()
