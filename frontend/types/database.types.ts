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
          nome: string
          created_at: string
          updated_at: string
          config_json: Json | null
        }
        Insert: {
          id?: string
          nome: string
          created_at?: string
          updated_at?: string
          config_json?: Json | null
        }
        Update: {
          id?: string
          nome?: string
          created_at?: string
          updated_at?: string
          config_json?: Json | null
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
      contratos: {
        Row: {
          id: string
          empresa_id: string
          cnpj_id: string
          numero_contrato: string
          orgao_publico: string
          valor_total: number
          data_assinatura: string
          data_vigencia_inicio: string
          data_vigencia_fim: string
          status: 'ativo' | 'concluido' | 'rescindido' | 'suspenso' | 'arquivado'
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
