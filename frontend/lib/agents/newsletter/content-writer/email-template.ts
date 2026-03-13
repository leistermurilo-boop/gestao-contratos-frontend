// ============================================
// EMAIL TEMPLATE — renderEmailTemplate()
// Newsletter Radar DUO™ — Identidade Visual Fixa
// Fonte: NEWSLETTER_IDENTITY.md
// ============================================

import { TEMAS, type EmailTema } from './email-themes'

export interface EmailAlerta {
  titulo: string
  descricao: string
  acao: string
  prioridade: 'critica' | 'alta' | 'media' | 'baixa'
}

export interface EmailInsight {
  titulo: string
  contexto: string
  impacto: string
}

export interface EmailRadarB2G {
  oportunidade: string
  prazo: string
  relevancia: string
}

export interface EmailConceito {
  titulo: string
  explicacao: string
  exemplo: string
  cta: string
}

export interface EmailROI {
  valor_total: number
  breakdown: Array<{ descricao: string; valor: number }>
  custo_duo: number
}

export interface EmailNumeroDestaque {
  valor: string
  label: string
}

export interface EmailTemplateParams {
  tema: EmailTema
  edicao: number
  data_formatada: string
  empresa_nome: string
  numero_destaque: EmailNumeroDestaque
  alertas: EmailAlerta[]
  insights: EmailInsight[]
  radar_b2g: EmailRadarB2G[]
  ipca_12m: number | null
  selic_atual: number | null
  conceito: EmailConceito | null
  roi: EmailROI | null
  cta_principal: string
  nivel_maturidade?: string
  progresso_maturidade?: number
}

// === HELPERS ===

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)
}

function bordaPorPrioridade(prioridade: string): string {
  const map: Record<string, string> = {
    critica: '#EF4444',
    alta: '#F59E0B',
    media: '#3B82F6',
    baixa: '#10B981',
  }
  return map[prioridade] ?? '#64748B'
}

function progressBar(pct: number): string {
  const filled = Math.round(pct / 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

// === LOGO SVG BASE64 (inline, sem dependência de URL) ===
const LOGO_SVG = `<svg viewBox="0 0 100 100" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 35 L48 25 L48 85 L22 75 Z" fill="#0F172A"/>
  <path d="M52 15 L78 5 L78 75 L52 85 Z" fill="#10B981"/>
</svg>`

// === RENDER ===

export function renderEmailTemplate(p: EmailTemplateParams): string {
  const theme = TEMAS[p.tema]
  const nivel = p.nivel_maturidade ?? 'Estratégico'
  const progresso = p.progresso_maturidade ?? 70

  const alertasHtml = p.alertas.map(a => `
    <div style="background:#FFFFFF;border-left:4px solid ${bordaPorPrioridade(a.prioridade)};padding:16px 20px;margin:12px 0;border-radius:0 8px 8px 0;">
      <div style="font-size:15px;font-weight:700;color:#0F172A;margin-bottom:6px;">${a.titulo}</div>
      <div style="font-size:14px;color:#475569;margin-bottom:10px;">${a.descricao}</div>
      <div style="font-size:13px;background:${theme.accentLight};color:${theme.accentText};padding:8px 12px;border-radius:6px;">
        <strong>✅ Ação:</strong> ${a.acao}
      </div>
    </div>`).join('')

  const insightsHtml = p.insights.map(i => `
    <div style="background:#F8FAFC;padding:16px 20px;margin:12px 0;border-radius:8px;">
      <div style="font-size:15px;font-weight:700;color:#0F172A;margin-bottom:6px;">${i.titulo}</div>
      <div style="font-size:14px;color:#475569;margin-bottom:10px;">${i.contexto}</div>
      <div style="background:${theme.accentLight};border-left:3px solid ${theme.accentColor};padding:10px 14px;border-radius:0 6px 6px 0;font-size:13px;color:${theme.accentText};">
        <strong>Impacto:</strong> ${i.impacto}
      </div>
    </div>`).join('')

  const radarHtml = p.radar_b2g.length > 0 ? p.radar_b2g.map(r => `
    <div style="background:#FFFFFF;border:1px solid #D1FAE5;padding:16px 20px;margin:12px 0;border-radius:8px;">
      <div style="font-size:15px;font-weight:700;color:#065F46;margin-bottom:6px;">🎯 ${r.oportunidade}</div>
      <div style="font-size:13px;color:#64748B;margin-bottom:8px;">⏱️ Prazo: <strong>${r.prazo}</strong></div>
      <div style="font-size:13px;color:#475569;">${r.relevancia}</div>
    </div>`).join('') : `<div style="color:#64748B;font-size:14px;padding:16px 0;">Nenhuma oportunidade PNCP detectada esta semana para seu portfolio.</div>`

  const macroHtml = (p.ipca_12m !== null || p.selic_atual !== null) ? `
    <div style="background:#F8FAFC;padding:20px;border-radius:8px;margin:12px 0;">
      ${p.ipca_12m !== null ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;color:#64748B;margin-bottom:4px;">IPCA Acumulado 12m</div>
        <div style="font-size:22px;font-weight:700;color:#0F172A;">${p.ipca_12m}%</div>
        <div style="font-size:13px;color:#EF4444;margin-top:4px;">→ Contratos sem cláusula de reajuste perdem ${p.ipca_12m}% de margem real</div>
      </div>` : ''}
      ${p.selic_atual !== null ? `
      <div>
        <div style="font-size:13px;color:#64748B;margin-bottom:4px;">Selic</div>
        <div style="font-size:22px;font-weight:700;color:#0F172A;">${p.selic_atual}% a.a.</div>
        <div style="font-size:13px;color:#64748B;margin-top:4px;">→ Custo de capital para novos projetos</div>
      </div>` : ''}
    </div>` : ''

  const conceitoHtml = p.conceito ? `
    <div style="background:#EFF6FF;border-left:4px solid #3B82F6;padding:20px 24px;border-radius:0 8px 8px 0;margin:12px 0;">
      <div style="font-size:13px;font-weight:700;color:#1E40AF;margin-bottom:8px;">🧠 ${p.conceito.titulo}</div>
      <div style="font-size:14px;color:#1E3A8A;line-height:1.6;margin-bottom:12px;">${p.conceito.explicacao}</div>
      <div style="background:#DBEAFE;padding:12px 16px;border-radius:6px;font-size:13px;color:#1E40AF;margin-bottom:12px;">
        <strong>Exemplo real:</strong> ${p.conceito.exemplo}
      </div>
      <div style="font-size:13px;color:#1E40AF;font-weight:600;">💡 ${p.conceito.cta}</div>
    </div>` : ''

  const roiHtml = p.roi ? `
    <div style="background:#F0FDF4;padding:20px 24px;border-radius:8px;margin:12px 0;">
      <div style="font-size:13px;font-weight:700;color:#065F46;margin-bottom:12px;">📊 Valor Gerado Esta Semana</div>
      ${p.roi.breakdown.map(b => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #D1FAE5;">
          <span style="font-size:13px;color:#064E3B;">${b.descricao}</span>
          <span style="font-size:13px;font-weight:700;color:#065F46;">${formatCurrency(b.valor)}</span>
        </div>`).join('')}
      <div style="display:flex;justify-content:space-between;padding:12px 0;margin-top:8px;">
        <span style="font-size:16px;font-weight:700;color:#065F46;">Total gerado</span>
        <span style="font-size:20px;font-weight:700;color:#065F46;">${formatCurrency(p.roi.valor_total)}</span>
      </div>
      <div style="background:#FFFFFF;padding:12px;border-radius:6px;text-align:center;">
        <div style="font-size:13px;color:#64748B;">Custo DUO: ${formatCurrency(p.roi.custo_duo)}/mês</div>
        <div style="font-size:28px;font-weight:700;color:#10B981;">ROI: ${Math.round(p.roi.valor_total / p.roi.custo_duo)}x</div>
        <div style="font-size:12px;color:#65A30D;">cada R$ 1 investido gerou R$ ${Math.round(p.roi.valor_total / p.roi.custo_duo)} de valor</div>
      </div>
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Radar DUO™ — Edição ${p.edicao}</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <div style="max-width:640px;margin:0 auto;background:#FFFFFF;">

    <!-- ===== HEADER ===== -->
    <div style="background:${theme.headerGradient};padding:28px 32px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        ${LOGO_SVG}
        <div>
          <div style="color:#FFFFFF;font-size:18px;font-weight:900;letter-spacing:-0.5px;">
            Radar DUO<span style="font-weight:300;color:rgba(255,255,255,0.6);">™</span>
          </div>
          <div style="color:#94A3B8;font-size:12px;">Newsletter Semanal · Edição ${p.edicao} · ${p.data_formatada}</div>
        </div>
        <div style="margin-left:auto;background:${theme.badgeBg};color:${theme.badgeTextColor};padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;">
          ${theme.badgeEmoji} ${theme.badgeLabel}
        </div>
      </div>
      <div style="font-size:13px;color:#94A3B8;margin-bottom:12px;">Para: ${p.empresa_nome}</div>
      <div style="height:2px;background:#10B981;border-radius:1px;"></div>
    </div>

    <!-- ===== NÚMERO DESTAQUE ===== -->
    <div style="padding:32px 32px 0;text-align:center;border-bottom:1px solid #F1F5F9;">
      <div style="font-size:48px;font-weight:900;color:${theme.accentColor};line-height:1;">${p.numero_destaque.valor}</div>
      <div style="font-size:14px;color:#64748B;margin-top:8px;margin-bottom:24px;">${p.numero_destaque.label}</div>
    </div>

    <!-- ===== SEUS CONTRATOS ===== -->
    <div style="padding:28px 32px;">
      <h2 style="font-size:18px;font-weight:700;color:#0F172A;margin:0 0 4px;border-left:4px solid ${theme.accentColor};padding-left:12px;">
        Seus Contratos Esta Semana
      </h2>
      <div style="font-size:13px;color:#64748B;margin-bottom:16px;padding-left:16px;">Alertas que exigem ação</div>
      ${alertasHtml || '<div style="color:#64748B;font-size:14px;padding:16px 0;">Nenhum alerta crítico esta semana. ✅</div>'}
    </div>

    <!-- ===== INSIGHTS DA SEMANA ===== -->
    <div style="padding:0 32px 28px;">
      <h2 style="font-size:18px;font-weight:700;color:#0F172A;margin:0 0 4px;border-left:4px solid ${theme.accentColor};padding-left:12px;">
        Insights da Semana
      </h2>
      <div style="font-size:13px;color:#64748B;margin-bottom:16px;padding-left:16px;">Análise cruzada: seus dados × APIs externas</div>
      ${insightsHtml}
    </div>

    <!-- ===== RADAR B2G ===== -->
    <div style="padding:0 32px 28px;background:#FAFAFA;">
      <h2 style="font-size:18px;font-weight:700;color:#065F46;margin:0 0 4px;padding-top:28px;border-left:4px solid #10B981;padding-left:12px;">
        🎯 Radar B2G™
      </h2>
      <div style="font-size:13px;color:#64748B;margin-bottom:16px;padding-left:16px;">Oportunidades detectadas no PNCP para seu portfolio</div>
      ${radarHtml}
    </div>

    <!-- ===== MACRO QUE IMPORTA ===== -->
    ${macroHtml ? `
    <div style="padding:28px 32px;">
      <h2 style="font-size:18px;font-weight:700;color:#0F172A;margin:0 0 4px;border-left:4px solid #3B82F6;padding-left:12px;">
        📈 Macro que Importa para Você
      </h2>
      <div style="font-size:13px;color:#64748B;margin-bottom:16px;padding-left:16px;">Economia × Seu Negócio</div>
      ${macroHtml}
    </div>` : ''}

    <!-- ===== VOCÊ SABIA? ===== -->
    ${conceitoHtml ? `
    <div style="padding:0 32px 28px;">
      <h2 style="font-size:18px;font-weight:700;color:#1E40AF;margin:0 0 16px;border-left:4px solid #3B82F6;padding-left:12px;">
        🧠 Você Sabia?
      </h2>
      ${conceitoHtml}
    </div>` : ''}

    <!-- ===== ROI ===== -->
    ${roiHtml ? `
    <div style="padding:0 32px 28px;">
      <h2 style="font-size:18px;font-weight:700;color:#065F46;margin:0 0 16px;border-left:4px solid #10B981;padding-left:12px;">
        💰 ROI desta Semana
      </h2>
      ${roiHtml}
    </div>` : ''}

    <!-- ===== CTA PRINCIPAL ===== -->
    <div style="padding:0 32px 28px;text-align:center;">
      <div style="background:${theme.accentLight};padding:20px;border-radius:8px;">
        <div style="font-size:14px;color:${theme.accentText};margin-bottom:16px;font-weight:600;">${p.cta_principal}</div>
        <a href="https://app.duogovernance.com.br" style="display:inline-block;background:${theme.accentColor};color:#FFFFFF;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          → Acessar Painel DUO
        </a>
      </div>
    </div>

    <!-- ===== ÍNDICE DUO™ ===== -->
    <div style="background:#EFF6FF;padding:20px 32px;">
      <div style="font-size:13px;font-weight:700;color:#1E40AF;margin-bottom:8px;">📊 Índice DUO™ da Sua Empresa</div>
      <div style="font-size:16px;font-family:monospace;color:#1E40AF;margin-bottom:4px;">[${progressBar(progresso)}] Nível — ${nivel}</div>
      <div style="font-size:12px;color:#3B82F6;">Quanto mais você usa o DUO™, mais precisos ficamos para o seu negócio.</div>
    </div>

    <!-- ===== DISCLAIMER ===== -->
    <div style="background:#FEF3C7;border-top:1px solid #F59E0B;padding:16px 32px;">
      <div style="font-size:12px;color:#78350F;line-height:1.6;">
        <strong>⚠️ Importante:</strong> Este relatório contém dicas baseadas em dados públicos (IBGE, Bacen, PNCP) e análise automatizada por IA.
        Não constitui consultoria jurídica, contábil ou fiscal. Decisões de negócio são de responsabilidade exclusiva da empresa.
      </div>
    </div>

    <!-- ===== FOOTER ===== -->
    <div style="background:#0F172A;padding:20px 32px;text-align:center;">
      <div style="color:#FFFFFF;font-size:14px;font-weight:700;margin-bottom:4px;">DUO Governance</div>
      <div style="color:#94A3B8;font-size:12px;margin-bottom:12px;">A inteligência B2G que os outros não têm</div>
      <div style="color:#475569;font-size:11px;">
        Você recebe esta newsletter pois é cliente DUO Governance.
        <a href="https://app.duogovernance.com.br/unsubscribe" style="color:#64748B;">Desinscrever</a>
      </div>
    </div>

  </div>
</body>
</html>`
}
