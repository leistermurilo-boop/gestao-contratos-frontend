import { createClient } from '@/lib/supabase/client'
import { type Cnpj, type CnpjInsert, type CnpjUpdate } from '@/types/models'

type CnpjUpdateSeguro = Omit<CnpjUpdate, 'id' | 'empresa_id'>

class CnpjsService {
  private get supabase() {
    return createClient()
  }

  /**
   * Buscar todos os CNPJs da empresa autenticada.
   * ⚠️ Decisão #1: RLS filtra empresa_id automaticamente no SELECT
   */
  async getAll(): Promise<Cnpj[]> {
    const { data, error } = await this.supabase
      .from('cnpjs')
      .select('*')
      .order('tipo', { ascending: true })
      .order('razao_social', { ascending: true })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Criar novo CNPJ.
   * ⚠️ cnpjs.Insert exige empresa_id explícito (RLS não injeta no INSERT para esta tabela)
   */
  async create(cnpj: CnpjInsert): Promise<Cnpj> {
    const { data, error } = await this.supabase
      .from('cnpjs')
      .insert(cnpj)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  /**
   * Atualizar CNPJ.
   * ⚠️ id e empresa_id bloqueados por tipo em compile-time
   */
  async update(id: string, cnpj: CnpjUpdateSeguro): Promise<Cnpj> {
    const { data, error } = await this.supabase
      .from('cnpjs')
      .update(cnpj)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  /**
   * Ativar ou desativar CNPJ.
   * ⚠️ NUNCA deletar CNPJ — é usado como FK em contratos e itens
   */
  async toggleAtivo(id: string, ativo: boolean): Promise<Cnpj> {
    const { data, error } = await this.supabase
      .from('cnpjs')
      .update({ ativo })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }
}

export const cnpjsService = new CnpjsService()
