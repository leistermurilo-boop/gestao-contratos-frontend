export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          razao_social: string
          nome_fantasia: string | null
          logo_url: string | null
          plano_id: string | null           // FK → planos.id (Migration 015)
          nivel_maturidade: number          // badge visual 1–5 (Migration 015)
          pontuacao_maturidade: number      // pontos de engajamento (Migration 015)
          created_at: string
          updated_at: string
          config_json: Json | null
        }
        Insert: {
          id?: string
          razao_social: string
          nome_fantasia?: string | null
          logo_url?: string | null
          plano_id?: string | null
          nivel_maturidade?: number
          pontuacao_maturidade?: number
          created_at?: string
          updated_at?: string
          config_json?: Json | null
        }
        Update: {
          id?: string
          razao_social?: string
          nome_fantasia?: string | null
          logo_url?: string | null
          plano_id?: string | null
          nivel_maturidade?: number
          pontuacao_maturidade?: number
          created_at?: string
          updated_at?: string
          config_json?: Json | null
        }
      }
      planos: {
        Row: {
          id: string
          nome: string
          tagline: string | null
          preco_mensal: number
          preco_anual: number
          total_anual: number
          desconto_anual_pct: number
          nivel_maximo_visual: number
          limite_ocr_mes: number
          radar_b2g: boolean
          newsletter: boolean
          api_pncp: boolean
          api_ibge: boolean
          cruzamento_macro: boolean
          created_at: string
        }
        Insert: {
          id: string
          nome: string
          tagline?: string | null
          preco_mensal: number
          preco_anual: number
          total_anual: number
          desconto_anual_pct?: number
          nivel_maximo_visual?: number
          limite_ocr_mes?: number
          radar_b2g?: boolean
          newsletter?: boolean
          api_pncp?: boolean
          api_ibge?: boolean
          cruzamento_macro?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          tagline?: string | null
          preco_mensal?: number
          preco_anual?: number
          total_anual?: number
          desconto_anual_pct?: number
          nivel_maximo_visual?: number
          limite_ocr_mes?: number
          radar_b2g?: boolean
          newsletter?: boolean
          api_pncp?: boolean
          api_ibge?: boolean
          cruzamento_macro?: boolean
          created_at?: string
        }
      }
      niveis_maturidade: {
        Row: {
          id: number
          nome: string
          descricao: string | null
          pontos_min: number
          pontos_max: number | null
          cor: string
          created_at: string
        }
        Insert: {
          id: number
          nome: string
          descricao?: string | null
          pontos_min: number
          pontos_max?: number | null
          cor: string
          created_at?: string
        }
        Update: {
          id?: number
          nome?: string
          descricao?: string | null
          pontos_min?: number
          pontos_max?: number | null
          cor?: string
          created_at?: string
        }
      }
      usuarios: {
        Row: {
          id: string
          empresa_id: string
          email: string
          nome: string
          perfil: 'admin' | 'juridico' | 'financeiro' | 'compras' | 'logistica'
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          empresa_id: string
          email: string
          nome: string
          perfil: 'admin' | 'juridico' | 'financeiro' | 'compras' | 'logistica'
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          email?: string
          nome?: string
          perfil?: 'admin' | 'juridico' | 'financeiro' | 'compras' | 'logistica'
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      cnpjs: {
        Row: {
          id: string
          empresa_id: string
          cnpj_numero: string
          tipo: 'matriz' | 'filial'
          razao_social: string
          nome_fantasia: string | null
          cidade: string | null
          estado: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          cnpj_numero: string
          tipo?: 'matriz' | 'filial'
          razao_social: string
          nome_fantasia?: string | null
          cidade?: string | null
          estado?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          cnpj_numero?: string
          tipo?: 'matriz' | 'filial'
          razao_social?: string
          nome_fantasia?: string | null
          cidade?: string | null
          estado?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      contratos: {
        Row: {
          id: string
          empresa_id: string
          cnpj_id: string
          numero_contrato: string
          orgao_publico: string
          cnpj_orgao: string | null
          esfera: 'municipal' | 'estadual' | 'federal' | null
          objeto: string | null
          valor_total: number
          data_assinatura: string
          data_vigencia_inicio: string
          data_vigencia_fim: string
          prorrogado: boolean
          data_vigencia_fim_prorrogacao: string | null
          indice_reajuste: string | null
          status: 'ativo' | 'concluido' | 'rescindido' | 'suspenso' | 'arquivado'
          deleted_at: string | null
          deleted_by: string | null
          anexo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id?: string // ⚠️ NÃO passar — RLS injeta automaticamente (Decisão #1)
          cnpj_id: string
          numero_contrato: string
          orgao_publico: string
          cnpj_orgao?: string | null
          esfera?: 'municipal' | 'estadual' | 'federal' | null
          objeto?: string | null
          valor_total: number
          data_assinatura: string
          data_vigencia_inicio: string
          data_vigencia_fim: string
          prorrogado?: boolean
          data_vigencia_fim_prorrogacao?: string | null
          indice_reajuste?: string | null
          status?: 'ativo' | 'concluido' | 'rescindido' | 'suspenso' | 'arquivado'
          deleted_at?: string | null
          deleted_by?: string | null
          anexo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          cnpj_id?: string
          numero_contrato?: string
          orgao_publico?: string
          cnpj_orgao?: string | null
          esfera?: 'municipal' | 'estadual' | 'federal' | null
          objeto?: string | null
          valor_total?: number
          data_assinatura?: string
          data_vigencia_inicio?: string
          data_vigencia_fim?: string
          prorrogado?: boolean
          data_vigencia_fim_prorrogacao?: string | null
          indice_reajuste?: string | null
          status?: 'ativo' | 'concluido' | 'rescindido' | 'suspenso' | 'arquivado'
          deleted_at?: string | null
          deleted_by?: string | null
          anexo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      itens_contrato: {
        Row: {
          id: string
          empresa_id: string
          contrato_id: string
          cnpj_id: string
          numero_item: number | null
          descricao: string
          unidade: string
          quantidade: number
          quantidade_entregue: number
          saldo_quantidade: number // GENERATED ALWAYS
          valor_unitario: number
          valor_total: number // GENERATED ALWAYS
          custo_medio: number | null
          ultimo_custo_unitario: number | null
          margem_atual: number | null
          margem_alerta_disparado: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id?: string
          contrato_id: string
          cnpj_id: string
          numero_item?: number | null
          descricao: string
          unidade: string
          quantidade: number
          quantidade_entregue?: number
          valor_unitario: number
          custo_medio?: number | null
          ultimo_custo_unitario?: number | null
          margem_alerta_disparado?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          contrato_id?: string
          cnpj_id?: string
          numero_item?: number | null
          descricao?: string
          unidade?: string
          quantidade?: number
          quantidade_entregue?: number
          valor_unitario?: number
          custo_medio?: number | null
          ultimo_custo_unitario?: number | null
          margem_alerta_disparado?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      custos_item: {
        Row: {
          id: string
          empresa_id: string
          item_contrato_id: string
          data_lancamento: string
          custo_unitario: number
          quantidade: number
          fornecedor: string | null
          numero_nf: string | null
          nf_entrada_url: string | null
          observacao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id?: string // ⚠️ NÃO passar — RLS injeta (Decisão #1)
          item_contrato_id: string
          data_lancamento: string
          custo_unitario: number
          quantidade: number
          fornecedor?: string | null
          numero_nf?: string | null
          nf_entrada_url?: string | null
          observacao?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          item_contrato_id?: string
          data_lancamento?: string
          custo_unitario?: number
          quantidade?: number
          fornecedor?: string | null
          numero_nf?: string | null
          nf_entrada_url?: string | null
          observacao?: string | null
          created_at?: string
        }
      }
      autorizacoes_fornecimento: {
        Row: {
          id: string
          empresa_id: string
          contrato_id: string
          item_id: string
          numero_af: string
          quantidade_autorizada: number
          quantidade_entregue: number
          saldo_af: number // GENERATED ALWAYS
          status: 'pendente' | 'parcial' | 'concluida' | 'cancelada'
          data_emissao: string
          data_vencimento: string | null
          observacao: string | null
          anexo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id?: string
          contrato_id: string
          item_id: string
          numero_af: string
          quantidade_autorizada: number
          quantidade_entregue?: number
          status?: 'pendente' | 'parcial' | 'concluida' | 'cancelada'
          data_emissao: string
          data_vencimento?: string | null
          observacao?: string | null
          anexo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          contrato_id?: string
          item_id?: string
          numero_af?: string
          quantidade_autorizada?: number
          quantidade_entregue?: number
          status?: 'pendente' | 'parcial' | 'concluida' | 'cancelada'
          data_emissao?: string
          data_vencimento?: string | null
          observacao?: string | null
          anexo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      entregas: {
        Row: {
          id: string
          empresa_id: string
          af_id: string
          quantidade_entregue: number
          data_entrega: string
          nf_saida_numero: string | null
          anexo_nf_url: string | null
          observacao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id?: string
          af_id: string
          quantidade_entregue: number
          data_entrega: string
          nf_saida_numero?: string | null
          anexo_nf_url?: string | null
          observacao?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          af_id?: string
          quantidade_entregue?: number
          data_entrega?: string
          nf_saida_numero?: string | null
          anexo_nf_url?: string | null
          observacao?: string | null
          created_at?: string
        }
      }
      reajustes: {
        Row: {
          id: string
          empresa_id: string
          contrato_id: string
          tipo: string
          percentual: number
          indice_referencia: string | null
          data_referencia: string
          data_aplicacao: string | null
          status: 'solicitado' | 'analise' | 'aprovado' | 'rejeitado' | 'implementado'
          justificativa: string | null
          documentacao_url: string | null
          aprovado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id?: string
          contrato_id: string
          tipo: string
          percentual: number
          indice_referencia?: string | null
          data_referencia: string
          data_aplicacao?: string | null
          status?: 'solicitado' | 'analise' | 'aprovado' | 'rejeitado' | 'implementado'
          justificativa?: string | null
          documentacao_url?: string | null
          aprovado_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          contrato_id?: string
          tipo?: string
          percentual?: number
          indice_referencia?: string | null
          data_referencia?: string
          data_aplicacao?: string | null
          status?: 'solicitado' | 'analise' | 'aprovado' | 'rejeitado' | 'implementado'
          justificativa?: string | null
          documentacao_url?: string | null
          aprovado_por?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      auditoria: {
        Row: {
          id: string
          empresa_id: string
          usuario_id: string | null
          tabela: string
          registro_id: string
          acao: 'INSERT' | 'UPDATE' | 'DELETE'
          dados_anteriores: Json | null
          dados_novos: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          usuario_id?: string | null
          tabela: string
          registro_id: string
          acao: 'INSERT' | 'UPDATE' | 'DELETE'
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          usuario_id?: string | null
          tabela?: string
          registro_id?: string
          acao?: 'INSERT' | 'UPDATE' | 'DELETE'
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          created_at?: string
        }
      }
    }
  }
}
