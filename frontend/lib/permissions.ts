/**
 * lib/permissions.ts — Feature Gates e Índice de Maturidade DUO™
 *
 * REGRA CRÍTICA:
 * - Níveis de Maturidade = badge visual de engajamento (NÃO bloqueia features)
 * - Plano (Core/Strategic) = feature gate real (controla acesso)
 *
 * Exemplos corretos:
 *   Empresa Strategic nível 1 → TEM Radar B2G™ (plano libera, independente do nível)
 *   Empresa Core nível 5 → NÃO TEM Radar B2G™ (plano limita)
 */

// =========================================================
// Tipos
// =========================================================

export type PlanoId = 'core' | 'strategic'

export type Feature =
  | 'radar_b2g'
  | 'newsletter'
  | 'api_pncp'
  | 'api_ibge'
  | 'cruzamento_macro'

interface PlanoFeatures {
  nivel_maximo_visual: number
  limite_ocr_mes: number // -1 = ilimitado
  radar_b2g: boolean
  newsletter: boolean
  api_pncp: boolean
  api_ibge: boolean
  cruzamento_macro: boolean
}

export interface EmpresaParaPermissoes {
  plano_id: string | null
  nivel_maturidade: number
  pontuacao_maturidade: number
}

// =========================================================
// Dados dos Planos (espelhados da Migration 015)
// Fonte: duogovernance.com.br/planos
// =========================================================

const PLANOS: Record<string, PlanoFeatures> = {
  core: {
    nivel_maximo_visual: 3,
    limite_ocr_mes: 3,
    radar_b2g: false,
    newsletter: false,
    api_pncp: false,
    api_ibge: false,
    cruzamento_macro: false,
  },
  strategic: {
    nivel_maximo_visual: 5,
    limite_ocr_mes: -1, // ilimitado
    radar_b2g: true,
    newsletter: true,
    api_pncp: true,
    api_ibge: true,
    cruzamento_macro: true,
  },
}

// =========================================================
// Dados dos Níveis de Maturidade DUO™ (badge visual)
// =========================================================

export interface NivelMaturidade {
  id: number
  nome: string
  descricao: string
  pontos_min: number
  pontos_max: number | null
  cor: 'slate' | 'blue' | 'emerald' | 'purple' | 'yellow'
}

export const NIVEIS_MATURIDADE: NivelMaturidade[] = [
  { id: 1, nome: 'Contrato Registrado',      descricao: 'Dados básicos centralizados',              pontos_min: 0,   pontos_max: 20,   cor: 'slate' },
  { id: 2, nome: 'Contrato Monitorado',      descricao: 'Acompanhamento de prazos e vigências',     pontos_min: 21,  pontos_max: 50,   cor: 'blue' },
  { id: 3, nome: 'Contrato Protegido',       descricao: 'Alertas de margem e erosão ativos',        pontos_min: 51,  pontos_max: 100,  cor: 'emerald' },
  { id: 4, nome: 'Contrato Contextualizado', descricao: 'Cruzamento com dados macroeconômicos',     pontos_min: 101, pontos_max: 200,  cor: 'purple' },
  { id: 5, nome: 'Contrato Estratégico',     descricao: 'Antecipação total e Radar B2G™ ativo',    pontos_min: 201, pontos_max: null, cor: 'yellow' },
]

// =========================================================
// Sistema de Pontuação (Gamificação)
// =========================================================

export const PONTOS_ACOES = {
  cadastrou_primeiro_contrato: 10,
  cadastrou_contrato: 2,
  configurou_margem: 5,
  usou_ocr_primeira_vez: 10,
  completou_perfil: 5,
  ativou_notificacoes: 3,
  milestone_10_contratos: 15,
  milestone_30_contratos: 30,
  milestone_50_contratos: 50,
} as const

// =========================================================
// Helpers internos
// =========================================================

function getPlanoFeatures(plano_id: string | null): PlanoFeatures {
  if (!plano_id || !PLANOS[plano_id]) {
    return PLANOS.core // fallback seguro
  }
  return PLANOS[plano_id]
}

// =========================================================
// Feature Gates — controlados APENAS pelo plano
// =========================================================

/**
 * Verifica acesso a feature premium.
 * Depende APENAS do plano — o nível de maturidade NÃO influencia.
 */
export function canAccessFeature(empresa: EmpresaParaPermissoes, feature: Feature): boolean {
  const plano = getPlanoFeatures(empresa.plano_id)
  return plano[feature]
}

/**
 * Verifica uso de OCR com base no plano.
 * Strategic = ilimitado. Core = 3x/mês.
 */
export function canUseOCR(empresa: EmpresaParaPermissoes, usadoNoMes = 0): {
  allowed: boolean
  limit: number | 'unlimited'
  remaining?: number
} {
  const plano = getPlanoFeatures(empresa.plano_id)

  if (plano.limite_ocr_mes === -1) {
    return { allowed: true, limit: 'unlimited' }
  }

  const remaining = Math.max(0, plano.limite_ocr_mes - usadoNoMes)
  return {
    allowed: remaining > 0,
    limit: plano.limite_ocr_mes,
    remaining,
  }
}

// =========================================================
// Índice de Maturidade DUO™ — badge visual de engajamento
// =========================================================

/**
 * Retorna o nível máximo de badge que o plano permite VER.
 * Core → até nível 3. Strategic → até nível 5.
 * IMPORTANTE: isso não bloqueia features, apenas o badge visual.
 */
export function getNivelMaximoVisual(empresa: EmpresaParaPermissoes): number {
  return getPlanoFeatures(empresa.plano_id).nivel_maximo_visual
}

/**
 * Calcula o nível de maturidade com base na pontuação atual.
 */
export function calcularNivelPorPontuacao(pontuacao: number): NivelMaturidade {
  let nivel = NIVEIS_MATURIDADE[0]
  for (const n of NIVEIS_MATURIDADE) {
    if (pontuacao >= n.pontos_min) {
      nivel = n
    }
  }
  return nivel
}

/**
 * Retorna informações sobre o próximo badge de maturidade.
 * fora_do_plano = badge existe mas o plano atual não o exibe.
 * Mensagens usam linguagem de "badge" e "pontos", nunca "bloqueio".
 */
export function getProximoNivel(empresa: EmpresaParaPermissoes): {
  nivel: number
  nome: string
  pontos_necessarios: number
  fora_do_plano: boolean
  mensagem?: string
} | null {
  const nivelAtual = empresa.nivel_maturidade || 1
  const proximoId = nivelAtual + 1

  if (proximoId > 5) {
    return null // Já está no nível máximo absoluto
  }

  const proximo = NIVEIS_MATURIDADE.find((n) => n.id === proximoId)
  if (!proximo) return null

  const nivelMaximoPlano = getNivelMaximoVisual(empresa)

  if (proximoId > nivelMaximoPlano) {
    return {
      nivel: proximo.id,
      nome: proximo.nome,
      pontos_necessarios: proximo.pontos_min,
      fora_do_plano: true,
      mensagem: `Badge Nível ${proximo.id} visível no plano Strategic`,
    }
  }

  return {
    nivel: proximo.id,
    nome: proximo.nome,
    pontos_necessarios: proximo.pontos_min,
    fora_do_plano: false,
  }
}
