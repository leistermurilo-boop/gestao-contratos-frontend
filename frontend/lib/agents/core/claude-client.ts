import type { AgentRequest, AgentResponse } from './types'

/**
 * Cliente para Anthropic Claude API.
 *
 * STUB: Implementação completa será feita no Sprint 3.
 *
 * @example
 * ```typescript
 * const client = new ClaudeClient()
 * const response = await client.chat({
 *   prompt: 'Analisar este contrato',
 *   systemPrompt: 'Você é um especialista em contratos B2G'
 * })
 * ```
 */
export class ClaudeClient {
  /**
   * Envia mensagem para Claude e retorna resposta.
   *
   * @throws Error - Não implementado ainda (Sprint 3)
   */
  async chat(_request: AgentRequest): Promise<AgentResponse> {
    throw new Error(
      'ClaudeClient não implementado ainda. Implementação prevista para Sprint 3.'
    )
  }
}
