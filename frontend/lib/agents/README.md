# Sistema de Agentes IA - DUO Governance

Infraestrutura para agentes IA que automatizam tarefas no sistema.

## Agentes Planejados

### OCR Agent (Sprint 3 - Abril 2026)
Extrai dados de contratos PDF automaticamente.
- **Documentação:** [ocr/OCR_MASTER_STRATEGY.md](./ocr/OCR_MASTER_STRATEGY.md)
- **Status:** ⏳ Implementação Sprint 3

### Newsletter Agents (Sprint 4 - Maio 2026)
Sistema multi-agente (3 agents sequenciais) para newsletter semanal.
- **Documentação:** [NEWSLETTER_MASTER_STRATEGY.md](./NEWSLETTER_MASTER_STRATEGY.md)
- **Status:** ⏳ Implementação Sprint 4

## Estrutura

```
lib/agents/
├── core/                       # Infraestrutura compartilhada
│   ├── claude-client.ts        # Cliente Anthropic API
│   ├── types.ts                # Interfaces TypeScript
│   └── config.ts               # Configurações
├── ocr/                        # Agent extração contratos
│   └── OCR_MASTER_STRATEGY.md
└── newsletter/                 # Sistema multi-agente newsletter
    ├── NEWSLETTER_MASTER_STRATEGY.md
    ├── data-collector/         # Agent 1: Coleta + Learning
    ├── insight-analyzer/       # Agent 2: APIs + Educação
    └── content-writer/         # Agent 3: Redação HTML
```

## Status Atual

- ✅ Estrutura criada (08 Março 2026)
- ✅ Documentação master completa
- ⏳ OCR Agent: Sprint 3 (Abril 2026)
- ⏳ Newsletter Agents: Sprint 4 (Maio 2026)

## Tecnologias

- **LLM:** Claude Sonnet 4.6 / Opus 4.6 (Anthropic API)
- **OCR:** Claude com PDF input nativo
- **Newsletter:** Pipeline sequencial 3 agents
- **Learning:** Supabase (memória persistente)
- **Envio:** Resend API
- **Agendamento:** Vercel Cron (Domingo 20h)
