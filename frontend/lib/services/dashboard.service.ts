import { createClient } from '@/lib/supabase/client'

export interface MargemHistorico {
  mes: string
  margemMedia: number
}

export interface VencimentoData {
  semana: string
  contratos: number
}

export interface DashboardMetrics {
  contratos: {
    total: number
    valorTotal: number
  }
  itens: {
    margemMedia: number | null
  }
  alertas: {
    contratosVencendo: number
    afsPendentes: number
  }
}

export class DashboardService {
  private get supabase() {
    return createClient()
  }

  /**
   * Buscar todas as métricas do dashboard em paralelo.
   * ⚠️ Decisão #1: RLS filtra empresa_id automaticamente
   */
  async getMetrics(): Promise<DashboardMetrics> {
    const [contratos, itens, alertas] = await Promise.all([
      this.getContratosMetrics(),
      this.getItensMetrics(),
      this.getAlertasMetrics(),
    ])
    return { contratos, itens, alertas }
  }

  /**
   * Contar contratos ativos e somar valor total.
   * Uma única query com count + select para eficiência.
   */
  private async getContratosMetrics(): Promise<{ total: number; valorTotal: number }> {
    const { data, error, count } = await this.supabase
      .from('contratos')
      .select('valor_total', { count: 'exact' })
      .eq('status', 'ativo')
      .is('deleted_at', null)

    if (error) throw new Error(error.message)

    const valorTotal = (data ?? []).reduce((acc: number, c: { valor_total: number | null }) => acc + (c.valor_total ?? 0), 0)
    return { total: count ?? 0, valorTotal }
  }

  /**
   * Calcular margem média dos itens ativos.
   * ⚠️ Perfil logistica: RLS bloqueia custo_medio via política — margem_atual pode retornar null
   * ⚠️ Decisão #3: Não recalcular margens — usar margem_atual (GENERATED via trigger)
   */
  private async getItensMetrics(): Promise<{ margemMedia: number | null }> {
    const { data, error } = await this.supabase
      .from('itens_contrato')
      .select('margem_atual')
      .is('deleted_at', null)
      .not('margem_atual', 'is', null)

    if (error) throw new Error(error.message)

    if (!data || data.length === 0) return { margemMedia: null }

    const margens = data.map((i: { margem_atual: number | null }) => i.margem_atual as number)
    const margemMedia = margens.reduce((acc: number, m: number) => acc + m, 0) / margens.length
    return { margemMedia }
  }

  /**
   * Contar alertas: contratos vencendo em 30 dias + AFs pendentes/parciais.
   */
  private async getAlertasMetrics(): Promise<{
    contratosVencendo: number
    afsPendentes: number
  }> {
    const hoje = new Date()
    const em30Dias = new Date(hoje)
    em30Dias.setDate(em30Dias.getDate() + 30)

    const hojeStr = hoje.toISOString().split('T')[0]
    const em30DiasStr = em30Dias.toISOString().split('T')[0]

    const [contratosRes, afsRes] = await Promise.all([
      this.supabase
        .from('contratos')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ativo')
        .is('deleted_at', null)
        .gte('data_vigencia_fim', hojeStr)
        .lte('data_vigencia_fim', em30DiasStr),
      this.supabase
        .from('autorizacoes_fornecimento')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pendente', 'parcial']),
    ])

    if (contratosRes.error) throw new Error(contratosRes.error.message)
    if (afsRes.error) throw new Error(afsRes.error.message)

    return {
      contratosVencendo: contratosRes.count ?? 0,
      afsPendentes: afsRes.count ?? 0,
    }
  }

  /**
   * Evolução mensal da margem média dos itens ativos.
   * Agrupa itens por mês de criação e calcula margem média.
   * ⚠️ Perfil logistica: RLS bloqueia margem_atual — retorna []
   * ⚠️ Decisão #3: Usa margem_atual (GENERATED via trigger), nunca recalcula
   */
  async getMargemHistorico(meses: number = 3): Promise<MargemHistorico[]> {
    const limite = new Date()
    limite.setMonth(limite.getMonth() - meses)

    const { data, error } = await this.supabase
      .from('itens_contrato')
      .select('created_at, margem_atual')
      .is('deleted_at', null)
      .not('margem_atual', 'is', null)
      .gte('created_at', limite.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) return []

    const porMes = new Map<string, number[]>()
    for (const item of data) {
      const date = new Date(item.created_at)
      const key = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      const existing = porMes.get(key) ?? []
      existing.push(item.margem_atual as number)
      porMes.set(key, existing)
    }

    return Array.from(porMes.entries()).map(([mes, margens]) => ({
      mes,
      margemMedia: Number((margens.reduce((a, b) => a + b, 0) / margens.length).toFixed(1)),
    }))
  }

  /**
   * Contratos com vigência encerrando nos próximos N dias, agrupados por semana.
   * ⚠️ Decisão #1: RLS filtra empresa_id automaticamente
   */
  async getVencimentosProximos(dias: number = 90): Promise<VencimentoData[]> {
    const hoje = new Date()
    const limite = new Date(hoje)
    limite.setDate(limite.getDate() + dias)

    const hojeStr = hoje.toISOString().split('T')[0]
    const limiteStr = limite.toISOString().split('T')[0]

    const { data, error } = await this.supabase
      .from('contratos')
      .select('data_vigencia_fim')
      .eq('status', 'ativo')
      .is('deleted_at', null)
      .gte('data_vigencia_fim', hojeStr)
      .lte('data_vigencia_fim', limiteStr)
      .order('data_vigencia_fim', { ascending: true })

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) return []

    const porSemana = new Map<string, number>()
    for (const contrato of data) {
      const date = new Date(contrato.data_vigencia_fim + 'T12:00:00')
      const diffDias = Math.floor((date.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      const semanaNum = Math.floor(diffDias / 7) + 1
      const key =
        semanaNum <= 4
          ? `Sem. ${semanaNum}`
          : date.toLocaleDateString('pt-BR', { month: 'short' })
      porSemana.set(key, (porSemana.get(key) ?? 0) + 1)
    }

    return Array.from(porSemana.entries()).map(([semana, contratos]) => ({
      semana,
      contratos,
    }))
  }
}

export const dashboardService = new DashboardService()
