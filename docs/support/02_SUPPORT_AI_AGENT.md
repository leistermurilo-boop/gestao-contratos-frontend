# 🤖 AGENTE IA DE SUPORTE - ARQUITETURA

**Status:** Planejamento  
**Prioridade:** Média (após Crisp básico)  
**Estimativa:** 3-4 dias  
**Agente AIOS Recomendado:** @architect + @analyst

---

## VISÃO GERAL

Agente de IA (Claude) que resolve 40-50% dos tickets de suporte automaticamente.

**Objetivos:**
- ✅ Responder perguntas frequentes (FAQ)
- ✅ Consultar dados do usuário (contratos, custos)
- ✅ Escalar para humano quando necessário
- ✅ Aprender com feedback

---

## ARQUITETURA
```
Cliente envia mensagem
       ↓
[Crisp recebe]
       ↓
[Webhook → API Route]
       ↓
[Classificar pergunta]
       ↓
   ┌───┴───┐
   │       │
 FAQ    Data Query   Technical
   │       │            │
   ↓       ↓            ↓
Claude  Claude + DB   Escalar
   │       │            ↓
   └───┬───┘         Humano
       ↓
[Resposta ao Crisp]
       ↓
[Cliente recebe]
```

---

## ESTRUTURA DE ARQUIVOS
```
backend/ai/support/
├── agent.ts                 # Agente principal
├── classifier.ts            # Classificar tipo de pergunta
├── knowledge-base.ts        # Buscar FAQ
├── data-fetcher.ts          # Buscar dados do usuário
├── prompts.ts               # Prompts especializados
└── types.ts                 # TypeScript interfaces

backend/api/support/
└── crisp-webhook/route.ts   # Webhook Crisp → IA
```

---

## IMPLEMENTAÇÃO: TYPES

**Arquivo:** `backend/ai/support/types.ts`
```typescript
export interface SupportQuery {
  userMessage: string
  userEmail: string
  empresaId: string
  conversationId: string // ID da conversa no Crisp
  currentPage?: string
  context?: Record<string, any>
}

export interface SupportResponse {
  answer: string
  needsHuman: boolean
  confidence: 'high' | 'medium' | 'low'
  escalationReason?: string
  suggestedActions?: string[]
}

export type QueryType = 
  | 'faq'
  | 'data_query'
  | 'technical_issue'
  | 'feature_request'
  | 'account_management'

export interface Classification {
  type: QueryType
  confidence: number // 0-100
  entities: string[]
  suggestedAction: string
}
```

---

## IMPLEMENTAÇÃO: CLASSIFIER

**Arquivo:** `backend/ai/support/classifier.ts`
```typescript
import { claudeClient } from '@/ai/clients/claude-client'
import type { Classification } from './types'

export async function classifyQuery(message: string): Promise<Classification> {
  const prompt = `
Você é um classificador de perguntas de suporte.

PERGUNTA DO USUÁRIO:
"${message}"

TIPOS POSSÍVEIS:
1. "faq" - Pergunta comum (como usar, o que significa X, onde encontro Y)
2. "data_query" - Pergunta sobre dados do usuário (quantos contratos tenho, qual minha margem)
3. "technical_issue" - Erro, bug, sistema não funciona
4. "feature_request" - Pedido de funcionalidade nova
5. "account_management" - Mudança de plano, cobrança, fatura

RETORNE APENAS JSON (sem markdown):
{
  "type": "faq|data_query|technical_issue|feature_request|account_management",
  "confidence": 0-100,
  "entities": ["entidade1", "entidade2"],
  "suggestedAction": "descrição curta da ação recomendada"
}

EXEMPLOS:
Pergunta: "Como faço para cadastrar um contrato?"
→ {"type": "faq", "confidence": 95, "entities": ["contrato", "cadastro"], "suggestedAction": "Mostrar tutorial de cadastro"}

Pergunta: "Quantos contratos tenho ativos?"
→ {"type": "data_query", "confidence": 90, "entities": ["contratos", "quantidade"], "suggestedAction": "Consultar banco de dados"}

Pergunta: "Sistema deu erro ao salvar"
→ {"type": "technical_issue", "confidence": 85, "entities": ["erro", "salvar"], "suggestedAction": "Escalar para desenvolvedor"}
`.trim()

  const response = await claudeClient.complete({
    prompt,
    model: 'claude-sonnet-4-20250514',
    maxTokens: 500,
    temperature: 0.1 // Baixa temperatura = mais consistente
  })

  // Parse JSON
  const cleaned = response.text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}
```

---

## IMPLEMENTAÇÃO: KNOWLEDGE BASE

**Arquivo:** `backend/ai/support/knowledge-base.ts`
```typescript
interface FAQArticle {
  id: string
  question: string
  answer: string
  category: string
  keywords: string[]
}

// FAQ em memória (depois migrar para banco)
const FAQ_DATABASE: FAQArticle[] = [
  {
    id: '001',
    question: 'Como faço para cadastrar um contrato?',
    answer: `Para cadastrar um contrato:

1. Acesse o menu **Contratos** → **Novo Contrato**
2. Preencha os campos obrigatórios:
   - Número do contrato
   - Órgão público
   - Valor total
   - Datas de vigência
3. Clique em **Salvar**

💡 **Dica:** Use o botão "✨ Extrair do PDF" para importar itens automaticamente.

📹 [Assistir tutorial] (2min)`,
    category: 'Primeiros Passos',
    keywords: ['cadastrar', 'contrato', 'novo', 'criar']
  },
  {
    id: '002',
    question: 'O que significa "margem atual"?',
    answer: `Margem atual é calculada automaticamente:

**Fórmula:**
Margem (%) = (Valor Unitário - Custo Médio) / Valor Unitário × 100

**Exemplo:**
- Valor unitário: R$ 100
- Custo médio: R$ 75
- Margem: (100 - 75) / 100 = 25%

💡 Margem abaixo de 10% acende alerta vermelho!

📄 [Leia mais: Como interpretar margens]`,
    category: 'Conceitos',
    keywords: ['margem', 'lucro', 'percentual', 'cálculo']
  },
  // Adicionar mais FAQs aqui
]

export async function searchKnowledgeBase(query: string): Promise<string | null> {
  const queryLower = query.toLowerCase()
  
  // Busca simples por keywords
  const matches = FAQ_DATABASE.filter(article => {
    return article.keywords.some(keyword => queryLower.includes(keyword))
  })

  if (matches.length === 0) return null

  // Se encontrou múltiplos, usar IA para escolher melhor
  if (matches.length > 1) {
    // TODO: usar Claude para ranquear relevância
    return matches[0].answer
  }

  return matches[0].answer
}
```

---

## IMPLEMENTAÇÃO: DATA FETCHER

**Arquivo:** `backend/ai/support/data-fetcher.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function fetchUserData(empresaId: string, entities: string[]) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role para queries server-side
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const data: Record<string, any> = {}

  // Buscar contratos se necessário
  if (entities.includes('contratos') || entities.includes('quantidade')) {
    const { data: contratos, error } = await supabase
      .from('contratos')
      .select('id, numero_contrato, status, valor_total')
      .eq('empresa_id', empresaId)
      .eq('deleted_at', null)

    if (!error) {
      data.contratos = {
        total: contratos.length,
        ativos: contratos.filter(c => c.status === 'ativo').length,
        valor_total: contratos.reduce((sum, c) => sum + (c.valor_total || 0), 0)
      }
    }
  }

  // Buscar itens se necessário
  if (entities.includes('itens') || entities.includes('margem')) {
    const { data: itens, error } = await supabase
      .from('itens_contrato')
      .select('margem_atual, custo_medio, valor_unitario')
      .eq('empresa_id', empresaId)
      .eq('deleted_at', null)

    if (!error && itens.length > 0) {
      const margens = itens.map(i => i.margem_atual).filter(m => m !== null)
      data.margem_media = margens.length > 0 
        ? (margens.reduce((sum, m) => sum + m, 0) / margens.length).toFixed(2)
        : null
    }
  }

  return data
}
```

---

## IMPLEMENTAÇÃO: AGENTE PRINCIPAL

**Arquivo:** `backend/ai/support/agent.ts`
```typescript
import { claudeClient } from '@/ai/clients/claude-client'
import { classifyQuery } from './classifier'
import { searchKnowledgeBase } from './knowledge-base'
import { fetchUserData } from './data-fetcher'
import type { SupportQuery, SupportResponse } from './types'

export class SupportAgent {
  async handleQuery(query: SupportQuery): Promise<SupportResponse> {
    try {
      // 1. Classificar tipo de pergunta
      const classification = await classifyQuery(query.userMessage)
      console.log('Classification:', classification)

      // 2. Tratamento por tipo
      switch (classification.type) {
        case 'faq':
          return await this.handleFAQ(query, classification)
        
        case 'data_query':
          return await this.handleDataQuery(query, classification)
        
        case 'technical_issue':
        case 'feature_request':
        case 'account_management':
          return this.escalateToHuman(classification.type)
        
        default:
          return await this.handleGeneral(query)
      }
    } catch (error) {
      console.error('SupportAgent error:', error)
      return {
        answer: "Desculpe, tive um problema ao processar sua pergunta. Vou transferir você para um especialista.",
        needsHuman: true,
        confidence: 'low',
        escalationReason: 'agent_error'
      }
    }
  }

  private async handleFAQ(
    query: SupportQuery, 
    classification: any
  ): Promise<SupportResponse> {
    // Buscar na base de conhecimento
    const answer = await searchKnowledgeBase(query.userMessage)
    
    if (answer) {
      return {
        answer: answer + "\n\n✅ Isso respondeu sua dúvida? 👍 👎",
        needsHuman: false,
        confidence: 'high'
      }
    }

    // Se não encontrou, usar Claude para gerar resposta
    const prompt = `
Você é assistente de suporte do DUO Governance.

PERGUNTA DO USUÁRIO:
"${query.userMessage}"

Responda de forma clara, direta e profissional.
Se não souber, diga que vai transferir para um especialista.
Máximo 3 parágrafos curtos.
`.trim()

    const response = await claudeClient.complete({ prompt, maxTokens: 500 })
    
    return {
      answer: response.text + "\n\n✅ Isso ajudou? 👍 👎",
      needsHuman: false,
      confidence: 'medium'
    }
  }

  private async handleDataQuery(
    query: SupportQuery,
    classification: any
  ): Promise<SupportResponse> {
    // Buscar dados do usuário
    const userData = await fetchUserData(query.empresaId, classification.entities)
    
    // Gerar resposta com os dados
    const prompt = `
Você é assistente de suporte do DUO Governance.

PERGUNTA DO USUÁRIO:
"${query.userMessage}"

DADOS DO USUÁRIO:
${JSON.stringify(userData, null, 2)}

Responda usando os dados fornecidos.
Seja específico e objetivo.
Máximo 2 parágrafos.
`.trim()

    const response = await claudeClient.complete({ prompt, maxTokens: 400 })
    
    return {
      answer: response.text + "\n\n✅ Isso respondeu? 👍 👎",
      needsHuman: false,
      confidence: 'high'
    }
  }

  private escalateToHuman(reason: string): SupportResponse {
    const messages = {
      technical_issue: "Entendo que você está com um problema técnico. Vou transferir para um especialista que pode ajudar melhor. 🛠️",
      feature_request: "Obrigado pela sugestão! Vou encaminhar para nossa equipe de produto. 💡",
      account_management: "Para questões de conta e cobrança, vou transferir para nosso time comercial. 💳"
    }

    return {
      answer: messages[reason as keyof typeof messages] || "Vou transferir você para um especialista.",
      needsHuman: true,
      confidence: 'low',
      escalationReason: reason
    }
  }

  private async handleGeneral(query: SupportQuery): Promise<SupportResponse> {
    // Fallback genérico
    return {
      answer: "Desculpe, não entendi bem sua pergunta. Pode reformular ou falar com um especialista?",
      needsHuman: false,
      confidence: 'low'
    }
  }
}
```

---

## IMPLEMENTAÇÃO: WEBHOOK CRISP

**Arquivo:** `backend/app/api/support/crisp-webhook/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { SupportAgent } from '@/ai/support/agent'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    
    // Verificar se é mensagem do usuário (não do agente)
    if (payload.event !== 'message:send' || payload.data.from !== 'user') {
      return NextResponse.json({ ok: true })
    }

    const { 
      content, 
      session_id, 
      user 
    } = payload.data

    // Extrair empresa_id do contexto (configurado no Crisp)
    const empresaId = user.data?.empresa_id

    if (!empresaId) {
      console.warn('empresa_id não encontrado no contexto')
      return NextResponse.json({ ok: true })
    }

    // Processar com IA
    const agent = new SupportAgent()
    const response = await agent.handleQuery({
      userMessage: content,
      userEmail: user.email,
      empresaId,
      conversationId: session_id
    })

    // Enviar resposta de volta ao Crisp
    await sendCrispMessage(session_id, response.answer)

    // Se precisa de humano, adicionar tag no Crisp
    if (response.needsHuman) {
      await tagCrispConversation(session_id, 'needs-human')
    }

    return NextResponse.json({ ok: true, confidence: response.confidence })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function sendCrispMessage(sessionId: string, message: string) {
  // Implementar usando Crisp REST API
  // https://docs.crisp.chat/references/rest-api/v1/#send-a-message-in-conversation
  
  const CRISP_API_TOKEN = process.env.CRISP_API_TOKEN!
  const CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID!

  await fetch(`https://api.crisp.chat/v1/website/${CRISP_WEBSITE_ID}/conversation/${sessionId}/message`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${CRISP_API_TOKEN}:`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'text',
      from: 'operator',
      origin: 'chat',
      content: message
    })
  })
}

async function tagCrispConversation(sessionId: string, tag: string) {
  // Adicionar tag para priorização
  // https://docs.crisp.chat/references/rest-api/v1/#update-conversation-meta
}
```

---

## TESTES

### Checklist de Validação
```
[ ] FAQ: "Como cadastrar contrato?" retorna resposta correta
[ ] Data Query: "Quantos contratos tenho?" retorna número real
[ ] Technical: "Sistema deu erro" escala para humano
[ ] Escalação adiciona tag "needs-human" no Crisp
[ ] Resposta aparece no chat do cliente em <5 segundos
[ ] Múltiplas perguntas em sequência funcionam
[ ] Contexto da empresa está disponível
[ ] Erros não quebram o chat
```

---

## MELHORIAS FUTURAS

1. **Fine-tuning de Prompts** - Iterar baseado em feedback
2. **Cache de Respostas** - Perguntas idênticas = resposta instantânea
3. **Sentiment Analysis** - Detectar frustração, priorizar
4. **Multi-lingual** - Suporte inglês/espanhol para expansão LATAM

---

**Última atualização:** 2026-02-23  
**Responsável:** @architect + @analyst  
**Status:** Pronto para implementação pós-Crisp