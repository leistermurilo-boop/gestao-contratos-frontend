import { createClient } from '@/lib/supabase/client'
import { type ItemContrato, type ItemContratoInsert, type ItemContratoUpdate } from '@/types/models'

// Campos GENERATED ALWAYS e imutáveis — bloqueados do update (Decisão #3)
type ItemContratoUpdateSeguro = Omit<
  ItemContratoUpdate,
  'empresa_id' | 'id' | 'contrato_id' | 'cnpj_id'
>

export interface ItemWithContrato extends ItemContrato {
  contrato?: {
    numero_contrato: string
    orgao_publico: string
  } | null
}

export class ItensService {
  private get supabase() {
    return createClient()
  }

  /**
   * Buscar todos os itens de um contrato.
   * ⚠️ REGRA RLS: empresa_id filtrado automaticamente (Decisão #1)
   * ⚠️ REGRA SOFT DELETE: Filtrar deleted_at IS NULL (Decisão #5)
   * ⚠️ REGRA: margem_atual, saldo_quantidade, valor_total vêm do backend — NUNCA recalcular (Decisão #3)
   */
  async getByContrato(contratoId: string): Promise<ItemContrato[]> {
    const { data, error } = await this.supabase
      .from('itens_contrato')
      .select('*')
      .eq('contrato_id', contratoId)
      .is('deleted_at', null)
      .order('numero_item', { ascending: true })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Buscar item por ID.
   */
  async getById(id: string): Promise<ItemContrato> {
    const { data, error } = await this.supabase
      .from('itens_contrato')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  /**
   * Criar novo item de contrato.
   * ⚠️ empresa_id e cnpj_id validados por trigger no banco — não recalcular
   */
  async create(item: ItemContratoInsert): Promise<ItemContrato> {
    const { data, error } = await this.supabase
      .from('itens_contrato')
      .insert(item)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  /**
   * Atualizar item.
   * ⚠️ REGRA: NUNCA enviar margem_atual, saldo_quantidade, valor_total — GENERATED ALWAYS (Decisão #3)
   * Parâmetro tipado com Omit para bloquear campos imutáveis em compile-time.
   */
  async update(id: string, item: ItemContratoUpdateSeguro): Promise<ItemContrato> {
    const { data, error } = await this.supabase
      .from('itens_contrato')
      .update(item)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  /**
   * Soft delete — usa RPC com SECURITY DEFINER para contornar o comportamento do
   * PostgREST que aplica SELECT policy como verificação pós-UPDATE (causa 403 quando
   * deleted_at passa de NULL para timestamp, pois a linha some da SELECT policy).
   * ⚠️ NUNCA hard delete (Decisão #5)
   */
  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .rpc('soft_delete_item_contrato', { p_id: id })

    if (error) throw new Error(error.message)
  }

  /**
   * Itens com margem abaixo do threshold configurado pela empresa.
   * ⚠️ margem_atual calculada pelo trigger atualizar_margem_item() — só exibir (Decisão #3)
   * @param threshold - margem mínima em % (padrão 10). Vem de empresas.config_json.margem_alerta
   */
  async getWithMargemBaixa(threshold = 10): Promise<ItemWithContrato[]> {
    const { data, error } = await this.supabase
      .from('itens_contrato')
      .select(`
        *,
        contrato:contratos (
          numero_contrato,
          orgao_publico
        )
      `)
      .lt('margem_atual', threshold)
      .not('margem_atual', 'is', null)
      .is('deleted_at', null)
      .order('margem_atual', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as ItemWithContrato[]
  }
}

export const itensService = new ItensService()
