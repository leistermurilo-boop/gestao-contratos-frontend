# Core - Infraestrutura Compartilhada

Módulos utilizados por todos os agentes do sistema DUO Governance.

## Componentes

### claude-client.ts
Cliente para comunicação com Anthropic API. Stub — implementação Sprint 3.

### types.ts
Interfaces e tipos TypeScript compartilhados entre todos os agents:
- `AgentConfig`, `AgentRequest`, `AgentResponse` (base)
- `OCRResult` (extração de contratos PDF)
- `NewsletterDataset`, `LearningProfile`, `InsightEducacional`, `NewsletterHTML`

### config.ts
Configurações específicas por agent (model, temperature, tokens):
- `OCR_CONFIG` — temperature 0.1 (determinístico)
- `NEWSLETTER_CONFIG` — 3 agents com temperaturas diferentes
- `CONCEITOS_EDUCACIONAIS` — biblioteca de 20 conceitos B2G

## Uso Futuro (Sprint 3/4)

```typescript
import { ClaudeClient } from '@/lib/agents/core/claude-client'
import type { AgentRequest } from '@/lib/agents/core/types'

const client = new ClaudeClient()
const response = await client.chat(request)
```

## Status
⏳ Implementação Sprint 3
