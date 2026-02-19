import { type Database } from './database.types'

// ─── Contratos ────────────────────────────────────────────────────────────────
export type Contrato = Database['public']['Tables']['contratos']['Row']
export type ContratoInsert = Database['public']['Tables']['contratos']['Insert']
export type ContratoUpdate = Database['public']['Tables']['contratos']['Update']

export interface ContratoWithRelations extends Contrato {
  cnpj?: {
    cnpj: string
    razao_social: string
  } | null
  empresa?: {
    nome: string
  } | null
}

// ─── CNPJs ────────────────────────────────────────────────────────────────────
export type Cnpj = Database['public']['Tables']['cnpjs']['Row']
export type CnpjInsert = Database['public']['Tables']['cnpjs']['Insert']
export type CnpjUpdate = Database['public']['Tables']['cnpjs']['Update']

// ─── Itens ────────────────────────────────────────────────────────────────────
export type ItemContrato = Database['public']['Tables']['itens_contrato']['Row']
export type ItemContratoInsert = Database['public']['Tables']['itens_contrato']['Insert']
export type ItemContratoUpdate = Database['public']['Tables']['itens_contrato']['Update']

// ─── Custos ───────────────────────────────────────────────────────────────────
export type CustoItem = Database['public']['Tables']['custos_item']['Row']
export type CustoItemInsert = Database['public']['Tables']['custos_item']['Insert']

// ─── Autorizações de Fornecimento ─────────────────────────────────────────────
export type AutorizacaoFornecimento =
  Database['public']['Tables']['autorizacoes_fornecimento']['Row']
export type AutorizacaoFornecimentoInsert =
  Database['public']['Tables']['autorizacoes_fornecimento']['Insert']
export type AutorizacaoFornecimentoUpdate =
  Database['public']['Tables']['autorizacoes_fornecimento']['Update']

// ─── Entregas ─────────────────────────────────────────────────────────────────
export type Entrega = Database['public']['Tables']['entregas']['Row']
export type EntregaInsert = Database['public']['Tables']['entregas']['Insert']

// ─── Reajustes ────────────────────────────────────────────────────────────────
export type Reajuste = Database['public']['Tables']['reajustes']['Row']
export type ReajusteInsert = Database['public']['Tables']['reajustes']['Insert']
export type ReajusteUpdate = Database['public']['Tables']['reajustes']['Update']

// ─── Auditoria ────────────────────────────────────────────────────────────────
export type Auditoria = Database['public']['Tables']['auditoria']['Row']

// ─── Filtros reutilizáveis ────────────────────────────────────────────────────
export interface FiltrosContrato {
  status?: Contrato['status']
  orgao?: string
  searchTerm?: string
}
