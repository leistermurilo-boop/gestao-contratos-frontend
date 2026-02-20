import { createClient } from '@/lib/supabase/client'
import {
  type ContratoInsert,
  type ContratoUpdate,
  type ContratoWithRelations,
  type FiltrosContrato,
} from '@/types/models'

// Tipo seguro para update — impede alteração de empresa_id e id (Decisão #1)
type ContratoUpdateSeguro = Omit<ContratoUpdate, 'empresa_id' | 'id'>

export class ContratosService {
  private get supabase() {
    return createClient()
  }

  /**
   * Buscar todos os contratos da empresa autenticada.
   * ⚠️ REGRA RLS: empresa_id filtrado automaticamente — nunca filtrar manualmente (Decisão #1)
   * ⚠️ REGRA SOFT DELETE: Filtrar deleted_at IS NULL (Decisão #5)
   */
  async getAll(): Promise<ContratoWithRelations[]> {
    const { data, error } = await this.supabase
      .from('contratos')
      .select(`
        *,
        cnpj:cnpjs (
          cnpj,
          razao_social
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as ContratoWithRelations[]
  }

  /**
   * Buscar contrato por ID com relações.
   * ⚠️ RLS garante isolamento — sem filtro empresa_id manual
   */
  async getById(id: string): Promise<ContratoWithRelations> {
    const { data, error } = await this.supabase
      .from('contratos')
      .select(`
        *,
        cnpj:cnpjs (
          cnpj,
          razao_social
        ),
        empresa:empresas (
          razao_social,
          nome_fantasia
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw new Error(error.message)
    return data as ContratoWithRelations
  }

  /**
   * Buscar contratos com filtros opcionais.
   */
  async getWithFilters(filtros: FiltrosContrato): Promise<ContratoWithRelations[]> {
    let query = this.supabase
      .from('contratos')
      .select('*, cnpj:cnpjs (cnpj_numero, razao_social)')
      .is('deleted_at', null)

    if (filtros.status) {
      query = query.eq('status', filtros.status)
    }

    if (filtros.orgao) {
      query = query.ilike('orgao_publico', `%${filtros.orgao}%`)
    }

    if (filtros.searchTerm) {
      query = query.or(
        `numero_contrato.ilike.%${filtros.searchTerm}%,orgao_publico.ilike.%${filtros.searchTerm}%`
      )
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as ContratoWithRelations[]
  }

  /**
   * Criar novo contrato.
   * ⚠️ REGRA RLS: NÃO passar empresa_id — RLS injeta automaticamente (Decisão #1)
   */
  async create(contrato: ContratoInsert): Promise<ContratoWithRelations> {
    if (contrato.data_vigencia_inicio && contrato.data_vigencia_fim) {
      if (contrato.data_vigencia_inicio > contrato.data_vigencia_fim) {
        throw new Error('Data de início não pode ser maior que a data de fim')
      }
    }

    const { data, error } = await this.supabase
      .from('contratos')
      .insert(contrato)
      .select('*, cnpj:cnpjs (cnpj_numero, razao_social)')
      .single()

    if (error) throw new Error(error.message)
    return data as ContratoWithRelations
  }

  /**
   * Atualizar contrato.
   * Parâmetro tipado com Omit para impedir alteração de empresa_id (Decisão #1).
   */
  async update(id: string, contrato: ContratoUpdateSeguro): Promise<ContratoWithRelations> {
    const { data, error } = await this.supabase
      .from('contratos')
      .update(contrato)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*, cnpj:cnpjs (cnpj_numero, razao_social)')
      .single()

    if (error) throw new Error(error.message)
    return data as ContratoWithRelations
  }

  /**
   * Soft delete — marca deleted_at.
   * ⚠️ NUNCA usar hard delete (Decisão #5)
   */
  async softDelete(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('contratos')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
      })
      .eq('id', id)

    if (error) throw new Error(error.message)
  }

  /**
   * Contratos ativos próximos do vencimento.
   * @param days — janela em dias (padrão 30)
   */
  async getExpiringSoon(days = 30): Promise<ContratoWithRelations[]> {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + days)

    const { data, error } = await this.supabase
      .from('contratos')
      .select('*, cnpj:cnpjs (cnpj_numero, razao_social)')
      .eq('status', 'ativo')
      .is('deleted_at', null)
      .gte('data_vigencia_fim', today.toISOString().split('T')[0])
      .lte('data_vigencia_fim', futureDate.toISOString().split('T')[0])
      .order('data_vigencia_fim', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as ContratoWithRelations[]
  }
}

// Singleton — instanciado quando o módulo é importado (client-side apenas)
export const contratosService = new ContratosService()
