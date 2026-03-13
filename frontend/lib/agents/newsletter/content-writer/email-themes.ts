// ============================================
// EMAIL THEMES — Sistema de Temas Visuais
// Newsletter DUO Governance
// Fonte: NEWSLETTER_IDENTITY.md
// ============================================

export type EmailTema = 'ALERTA' | 'OPORTUNIDADE' | 'MACRO' | 'PADRAO'

export interface ThemeTokens {
  headerGradient: string
  accentColor: string
  accentLight: string
  accentText: string
  badgeEmoji: string
  badgeLabel: string
  badgeBg: string
  badgeTextColor: string
}

export const TEMAS: Record<EmailTema, ThemeTokens> = {
  ALERTA: {
    headerGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    accentColor: '#EF4444',
    accentLight: '#FEF2F2',
    accentText: '#991B1B',
    badgeEmoji: '⚠️',
    badgeLabel: 'ALERTA',
    badgeBg: '#FEE2E2',
    badgeTextColor: '#991B1B',
  },
  OPORTUNIDADE: {
    headerGradient: 'linear-gradient(135deg, #0F172A 0%, #064E3B 100%)',
    accentColor: '#10B981',
    accentLight: '#ECFDF5',
    accentText: '#065F46',
    badgeEmoji: '🎯',
    badgeLabel: 'OPORTUNIDADE',
    badgeBg: '#D1FAE5',
    badgeTextColor: '#065F46',
  },
  MACRO: {
    headerGradient: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
    accentColor: '#3B82F6',
    accentLight: '#EFF6FF',
    accentText: '#1E40AF',
    badgeEmoji: '📊',
    badgeLabel: 'MACRO',
    badgeBg: '#DBEAFE',
    badgeTextColor: '#1E40AF',
  },
  PADRAO: {
    headerGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    accentColor: '#10B981',
    accentLight: '#ECFDF5',
    accentText: '#065F46',
    badgeEmoji: '📊',
    badgeLabel: 'INSIGHTS',
    badgeBg: '#D1FAE5',
    badgeTextColor: '#065F46',
  },
}

export interface TemaDecisionInput {
  insights_criticos: number
  radar_b2g_count: number
  has_macro_dominante: boolean
}

export function decideTema(input: TemaDecisionInput): EmailTema {
  if (input.insights_criticos >= 3) return 'ALERTA'
  if (input.radar_b2g_count >= 2) return 'OPORTUNIDADE'
  if (input.has_macro_dominante) return 'MACRO'
  return 'PADRAO'
}
