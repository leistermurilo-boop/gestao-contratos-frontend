# Newsletter Agents - Sistema Multi-Agente

Newsletter semanal personalizada usando **3 agents sequenciais**.

## Status
⏳ **Planejado para Sprint 4** (Maio 2026)

## Documentação Completa
Ver [NEWSLETTER_MASTER_STRATEGY.md](../NEWSLETTER_MASTER_STRATEGY.md)

## Arquitetura

```
[Agent 1: Data Collector + Learning Layer]
    ↓ Dataset Massivo + Contexto Histórico (200-500 KB JSON)

[Agent 2: Insight Analyzer + External APIs + Educator]
    ↓ Insights Cruzados + Contexto Educacional (50-150 KB JSON)

[Agent 3: AIOS Content Writer + Educator]
    ↓ Newsletter HTML + Disclaimers + ROI (~50 KB HTML)

[Resend API] → Envio Segunda 8h
```

Tempo por empresa: 25-40 minutos (pipeline completo)
Agendamento: Vercel Cron — Domingo 20h

## Resumo dos 3 Agents

### Agent 1: Data Collector
Coleta dados internos (Supabase) + constrói perfil evolutivo da empresa.
→ [data-collector/README.md](./data-collector/README.md)

### Agent 2: Insight Analyzer
Cruza dados com 5 APIs externas (IBGE, PNCP, Bacen, IPCA, News) + gera insights educacionais.
→ [insight-analyzer/README.md](./insight-analyzer/README.md)

### Agent 3: Content Writer
Redige newsletter HTML com 9 seções, caixas educacionais e disclaimers legais.
→ [content-writer/README.md](./content-writer/README.md)

## Diferencial: Valor Insubstituível

### 1. Aprendizado Contínuo
Sistema aprende sobre a empresa a cada semana — 52 semanas = conhecimento profundo.

### 2. Cruzamento Massivo
5+ APIs externas cruzadas com dados internos de forma personalizada.

### 3. Educação Progressiva
Cliente aprende 20+ conceitos de gestão B2G ao longo de 1 ano de uso.

### 4. ROI Demonstrável
R$ 2.234M gerado (demonstrável) vs R$ 6.470/ano assinatura = **ROI 34x**

## Uso Futuro (Sprint 4)

```typescript
import { NewsletterPipeline } from '@/lib/agents/newsletter'

// Executado via Cron Domingo 20h
await NewsletterPipeline.generateAndSend(empresaId)

// Preview manual
const newsletter = await NewsletterPipeline.generate(empresaId)
```

## Tecnologia
- **Agent 1 + 2:** Claude Sonnet 4.6
- **Agent 3:** Claude Opus 4.6 (melhor qualidade de redação)
- **Memória:** Supabase (tabela `empresa_intelligence`)
- **Envio:** Resend API
- **Agendamento:** Vercel Cron
