import { createClient } from '@/lib/supabase/client'
import { type CustoItem, type CustoItemInsert } from '@/types/models'

export interface FiltrosCusto {
  itemId?: string
  fornecedor?: string
}

export interface CustoItemWithRelations extends CustoItem {
  item?: {
    numero_item: number | null
    descricao: string
    contrato?: {
      numero_contrato: string
      orgao_publico: string
    } | null
  } | null
}

export class CustosService {
  private get supabase() {
    return createClient()
  }

  /**
   * ⚠️ ACESSO RESTRITO: Logística NÃO pode acessar custos (RLS + verificação no hook)
   * Decisão #1: empresa_id filtrado automaticamente por RLS
   * Decisão #3: CMP e margem calculados por trigger — NUNCA recalcular
   */

  /**
   * Buscar custos de um item específico.
   */
  async getByItem(itemId: string): Promise<CustoItem[]> {
    const { data, error } = await this.supabase
      .from('custos_item')
      .select('*')
      .eq('item_contrato_id', itemId)
      .order('data_lancamento', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Buscar todos os custos com filtros opcionais e join com itens/contratos.
   */
  async getAll(filtros?: FiltrosCusto): Promise<CustoItemWithRelations[]> {
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

    if (filtros?.itemId) {
      query = query.eq('item_contrato_id', filtros.itemId)
    }

    if (filtros?.fornecedor) {
      query = query.ilike('fornecedor', `%${filtros.fornecedor}%`)
    }

    const { data, error } = await query.order('data_lancamento', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as CustoItemWithRelations[]
  }

  /**
   * Criar novo lançamento de custo.
   * ⚠️ REGRA: empresa_id NÃO passar — RLS injeta (Decisão #1)
   * ⚠️ REGRA: Backend recalcula CMP e margem via trigger — NUNCA recalcular (Decisão #3)
   * ⚠️ REGRA: nf_entrada_url será preenchido pelo Upload Service (Story 4.4)
   */
  async create(custo: CustoItemInsert): Promise<CustoItem> {
    const { data, error } = await this.supabase
      .from('custos_item')
      .insert(custo)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  /**
   * Buscar o custo mais recente de um item (para exibir último custo unitário).
   * Retorna null se nenhum custo encontrado (PGRST116 = not found é tratado).
   */
  async getUltimoCusto(itemId: string): Promise<CustoItem | null> {
    const { data, error } = await this.supabase
      .from('custos_item')
      .select('*')
      .eq('item_contrato_id', itemId)
      .order('data_lancamento', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data
  }
}

export const custosService = new CustosService()
