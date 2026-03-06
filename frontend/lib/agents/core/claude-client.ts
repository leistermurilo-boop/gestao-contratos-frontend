import Anthropic from '@anthropic-ai/sdk'
import type { AgentConfig, AgentRequest, AgentResponse } from './types'

const DEFAULT_CONFIG: AgentConfig = {
  model: 'claude-sonnet-4-6',
  maxTokens: 4096,
  temperature: 0.1,
}

export class ClaudeClient {
  private client: Anthropic
  private config: AgentConfig

  constructor(config: Partial<AgentConfig> = {}) {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async chat(request: AgentRequest): Promise<AgentResponse> {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: request.prompt },
    ]

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      ...(request.systemPrompt ? { system: request.systemPrompt } : {}),
      messages,
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Claude retornou resposta sem bloco de texto')
    }

    return {
      content: textBlock.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    }
  }
}
