import { createClient } from '@/lib/supabase/client'
import { type Reajuste, type ReajusteInsert, type ReajusteUpdate } from '@/types/models'

type ReajusteUpdateSeguro = Omit<ReajusteUpdate, 'id' | 'empresa_id' | 'contrato_id'>

export interface ReajusteWithRelations extends Reajuste {
  contrato?: {
    numero_contrato: string
    orgao_publico: string
  } | null
}

class ReajustesService {
  private get supabase() {
    return createClient()
  }

  /**
   * Buscar todos os reajustes da empresa com relação ao contrato.
   * ⚠️ Decisão #1: RLS filtra empresa_id automaticamente
   */
  async getAll(): Promise<ReajusteWithRelations[]> {
    const { data, error } = await this.supabase
      .from('reajustes')
      .select(`
        *,
        contrato:contratos (
          numero_contrato,
          orgao_publico
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as ReajusteWithRelations[]
  }

  /**
   * Buscar reajustes de um contrato específico.
   */
  async getByContrato(contratoId: string): Promise<Reajuste[]> {
    const { data, error } = await this.supabase
      .from('reajustes')
      .select('*')
      .eq('contrato_id', contratoId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Criar novo reajuste.
   * ⚠️ empresa_id NÃO passar — RLS injeta (Decisão #1)
   */
  async create(reajuste: ReajusteInsert): Promise<Reajuste> {
    const { data, error } = await this.supabase
      .from('reajustes')
      .insert(reajuste)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  /**
   * Atualizar status do reajuste manualmente.
   * ⚠️ contrato_id e empresa_id bloqueados por ReajusteUpdateSeguro
   */
  async updateStatus(id: string, status: Reajuste['status']): Promise<Reajuste> {
    const update: ReajusteUpdateSeguro = { status }
    const { data, error } = await this.supabase
      .from('reajustes')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }
}

export const reajustesService = new ReajustesService()
