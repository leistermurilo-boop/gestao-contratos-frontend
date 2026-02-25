# 🔒 SEGURANÇA E LGPD - SUPORTE COM IA

**Status:** Crítico - Compliance Obrigatório  
**Prioridade:** Máxima  
**Agente AIOS Recomendado:** @analyst + @qa

---

## VISÃO GERAL

Garantir que o uso de IA no suporte está em conformidade total com a LGPD (Lei 13.709/2018) e boas práticas de segurança.

**Princípios:**
- ✅ Transparência total com o usuário
- ✅ Minimização de dados (enviar só o necessário)
- ✅ Dados efêmeros (não persistir na IA)
- ✅ Consentimento explícito
- ✅ Direito ao esquecimento

---

## LGPD: ARTIGOS APLICÁVEIS

### Art. 6º - Princípios

| Princípio | Aplicação no Suporte |
|-----------|---------------------|
| **Finalidade** | Dados usados APENAS para atendimento |
| **Adequação** | IA processa só dados necessários para responder |
| **Necessidade** | Não enviar CNPJ, dados bancários se desnecessário |
| **Transparência** | Usuário sabe que IA está processando dados |
| **Segurança** | HTTPS, sem logs sensíveis |

### Art. 7º - Base Legal

**Base legal escolhida:** Consentimento (mais seguro para IA)
```typescript
// Usuário deve consentir antes de IA acessar dados
interface UserConsent {
  lgpd_consent_support_ai: boolean
  lgpd_consent_date: Date
  lgpd_consent_ip: string
}
```

### Art. 18 - Direitos do Titular
```
Usuário pode:
✅ Solicitar quais dados foram processados
✅ Revogar consentimento (volta para suporte humano only)
✅ Exportar histórico de conversas
✅ Deletar histórico de conversas
```

---

## IMPLEMENTAÇÃO: CONSENTIMENTO

### Passo 1: Modal de Primeiro Uso

**Arquivo:** `frontend/components/support/consent-modal.tsx`
```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, Lock, Eye, Trash } from 'lucide-react'

interface ConsentModalProps {
  open: boolean
  onAccept: () => void
  onDecline: () => void
}

export function SupportConsentModal({ open, onAccept, onDecline }: ConsentModalProps) {
  const [agreed, setAgreed] = useState(false)

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Suporte com Inteligência Artificial
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p>
            Nosso sistema utiliza Inteligência Artificial (Claude, da Anthropic) para 
            oferecer suporte rápido e eficiente.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">O que a IA pode acessar</h4>
                <p className="text-blue-700 text-sm mt-1">
                  • Seu nome e email<br/>
                  • Nome da sua empresa<br/>
                  • Número de contratos (agregado)<br/>
                  • Margem média (sem detalhes)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">O que NÃO é compartilhado</h4>
                <p className="text-green-700 text-sm mt-1">
                  • Senhas ou tokens de acesso<br/>
                  • Dados bancários ou financeiros sensíveis<br/>
                  • Detalhes contratuais completos<br/>
                  • Informações de terceiros
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Trash className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">Processamento efêmero</h4>
                <p className="text-purple-700 text-sm mt-1">
                  Seus dados são processados em tempo real e <strong>não são armazenados</strong> 
                  pela IA após o atendimento. A Anthropic não usa seus dados para treinar modelos.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="font-medium mb-2">Seus direitos (LGPD)</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>✅ Solicitar cópia das suas conversas</li>
              <li>✅ Revogar consentimento a qualquer momento</li>
              <li>✅ Usar apenas suporte humano (sem IA)</li>
              <li>✅ Deletar histórico de atendimentos</li>
            </ul>
          </div>

          <div className="flex items-start gap-2 mt-4">
            <Checkbox 
              id="consent" 
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <label htmlFor="consent" className="text-sm cursor-pointer">
              Li e concordo com o uso de IA para suporte. Entendo que posso revogar 
              este consentimento em <strong>Configurações → Privacidade</strong>.
            </label>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <Button variant="ghost" onClick={onDecline}>
            Não usar IA (apenas humano)
          </Button>
          <Button 
            onClick={onAccept} 
            disabled={!agreed}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Aceitar e Continuar
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          <a href="/politica-privacidade" target="_blank" className="underline">
            Política de Privacidade
          </a>
          {' • '}
          <a href="https://www.anthropic.com/privacy" target="_blank" className="underline">
            Política Anthropic
          </a>
          {' • '}
          <a href="mailto:lgpd@duogovernance.com.br" className="underline">
            Falar com DPO
          </a>
        </p>
      </DialogContent>
    </Dialog>
  )
}
```

### Passo 2: Lógica de Controle de Consentimento

**Arquivo:** `frontend/lib/hooks/use-support-consent.ts`
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/hooks/use-supabase'
import { useAuth } from '@/lib/hooks/use-auth'

export function useSupportConsent() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useSupabase()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    checkConsent()
  }, [user])

  async function checkConsent() {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('lgpd_consent_support_ai, lgpd_consent_date')
        .eq('id', user!.id)
        .single()

      if (error) throw error

      setHasConsent(data.lgpd_consent_support_ai || false)
    } catch (error) {
      console.error('Error checking consent:', error)
      setHasConsent(false)
    } finally {
      setLoading(false)
    }
  }

  async function grantConsent() {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          lgpd_consent_support_ai: true,
          lgpd_consent_date: new Date().toISOString(),
          lgpd_consent_ip: await getClientIP()
        })
        .eq('id', user!.id)

      if (error) throw error

      setHasConsent(true)
      return true
    } catch (error) {
      console.error('Error granting consent:', error)
      return false
    }
  }

  async function revokeConsent() {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          lgpd_consent_support_ai: false,
          lgpd_consent_revoked_date: new Date().toISOString()
        })
        .eq('id', user!.id)

      if (error) throw error

      setHasConsent(false)
      return true
    } catch (error) {
      console.error('Error revoking consent:', error)
      return false
    }
  }

  return {
    hasConsent,
    loading,
    grantConsent,
    revokeConsent
  }
}

async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch {
    return 'unknown'
  }
}
```

---

## SANITIZAÇÃO DE DADOS

### O Que Enviar vs O Que NÃO Enviar

**Arquivo:** `backend/ai/support/data-sanitizer.ts`
```typescript
interface RawUserData {
  id: string
  nome: string
  email: string
  telefone?: string
  empresa: {
    id: string
    cnpj: string
    nome_fantasia: string
    razao_social: string
    plano: string
  }
  contratos: Array<{
    id: string
    numero_contrato: string
    orgao_publico: string
    valor_total: number
    status: string
  }>
}

interface SanitizedUserData {
  nome_primeiro: string // Apenas primeiro nome
  empresa_nome: string // Nome fantasia
  plano: string
  total_contratos: number
  contratos_ativos: number
  valor_total_contratos: number // Agregado
  margem_media?: number // Agregado
}

export function sanitizeUserData(raw: RawUserData): SanitizedUserData {
  // Remover TODOS dados sensíveis
  return {
    nome_primeiro: raw.nome.split(' ')[0], // "João Silva" → "João"
    empresa_nome: raw.empresa.nome_fantasia, // OK expor
    plano: raw.empresa.plano, // OK expor
    total_contratos: raw.contratos.length, // Agregado OK
    contratos_ativos: raw.contratos.filter(c => c.status === 'ativo').length,
    valor_total_contratos: raw.contratos.reduce((sum, c) => sum + c.valor_total, 0),
    // NÃO expor:
    // ❌ CNPJ completo
    // ❌ Email
    // ❌ Telefone
    // ❌ IDs (UUID) de registros
    // ❌ Número específico de contratos
    // ❌ Nome de órgãos públicos
  }
}
```

### Validação de Output da IA
```typescript
export function validateAIResponse(response: string): boolean {
  // Verificar se IA não vazou dados sensíveis
  const sensitivePatterns = [
    /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/, // CNPJ
    /\d{3}\.\d{3}\.\d{3}-\d{2}/, // CPF
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i, // UUID
    /\d{5}-\d{3}/, // CEP
  ]

  for (const pattern of sensitivePatterns) {
    if (pattern.test(response)) {
      console.error('⚠️ IA vazou dado sensível:', pattern)
      return false
    }
  }

  return true
}
```

---

## AUDIT LOG

### Registrar Toda Interação com IA

**Migration:** `database/migrations/016_support_audit_log.sql`
```sql
-- Tabela de auditoria de suporte
CREATE TABLE support_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  
  -- Dados da interação
  user_message TEXT NOT NULL,
  ai_response TEXT,
  query_type TEXT, -- faq, data_query, technical_issue
  confidence TEXT, -- high, medium, low
  escalated_to_human BOOLEAN DEFAULT FALSE,
  
  -- Dados acessados (para transparência LGPD)
  data_accessed TEXT[], -- ['contratos_count', 'margem_media']
  
  -- Metadata
  response_time_ms INTEGER,
  tokens_used INTEGER,
  model_used TEXT DEFAULT 'claude-sonnet-4',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX support_interactions_usuario_idx ON support_interactions(usuario_id);
CREATE INDEX support_interactions_empresa_idx ON support_interactions(empresa_id);
CREATE INDEX support_interactions_created_at_idx ON support_interactions(created_at DESC);

-- RLS
ALTER TABLE support_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas suas interações" ON support_interactions
  FOR SELECT USING (
    usuario_id = auth.uid()
  );

COMMENT ON TABLE support_interactions IS 'Audit log de todas interações com IA de suporte (LGPD Art. 18)';
```

### Implementação do Logging

**Arquivo:** `backend/ai/support/audit-logger.ts`
```typescript
import { createServerClient } from '@supabase/ssr'

interface AuditLogEntry {
  usuarioId: string
  empresaId: string
  userMessage: string
  aiResponse: string
  queryType: string
  confidence: string
  escalatedToHuman: boolean
  dataAccessed: string[]
  responseTimeMs: number
  tokensUsed: number
}

export async function logSupportInteraction(entry: AuditLogEntry) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [] } } // Server-side, sem cookies
  )

  try {
    const { error } = await supabase
      .from('support_interactions')
      .insert({
        usuario_id: entry.usuarioId,
        empresa_id: entry.empresaId,
        user_message: entry.userMessage,
        ai_response: entry.aiResponse,
        query_type: entry.queryType,
        confidence: entry.confidence,
        escalated_to_human: entry.escalatedToHuman,
        data_accessed: entry.dataAccessed,
        response_time_ms: entry.responseTimeMs,
        tokens_used: entry.tokensUsed
      })

    if (error) {
      console.error('Failed to log support interaction:', error)
      // Não falhar o request principal por erro de logging
    }
  } catch (error) {
    console.error('Audit log exception:', error)
  }
}
```

---

## DIREITOS DO USUÁRIO (LGPD Art. 18)

### Página de Privacidade do Suporte

**Arquivo:** `frontend/app/(dashboard)/configuracoes/privacidade-suporte/page.tsx`
```tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Shield, Download, Trash2, XCircle } from 'lucide-react'

export default function PrivacidadeSuportePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Privacidade do Suporte</h1>
        <p className="text-gray-600 mt-2">
          Gerencie como seus dados são usados no atendimento com IA
        </p>
      </div>

      {/* Status do Consentimento */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Shield className="h-8 w-8 text-green-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Consentimento Ativo</h3>
            <p className="text-sm text-gray-600 mt-1">
              Você autorizou o uso de IA para suporte em 15/02/2026 às 14:30
            </p>
            <Button variant="destructive" size="sm" className="mt-3">
              <XCircle className="h-4 w-4 mr-2" />
              Revogar Consentimento
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Ao revogar, você receberá apenas suporte humano (tempo de resposta pode aumentar)
            </p>
          </div>
        </div>
      </Card>

      {/* Exportar Dados */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Download className="h-8 w-8 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Exportar Histórico</h3>
            <p className="text-sm text-gray-600 mt-1">
              Baixe todas as suas conversas de suporte (últimos 12 meses)
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              <Download className="h-4 w-4 mr-2" />
              Baixar JSON
            </Button>
          </div>
        </div>
      </Card>

      {/* Deletar Histórico */}
      <Card className="p-6 border-red-200">
        <div className="flex items-start gap-4">
          <Trash2 className="h-8 w-8 text-red-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Deletar Histórico</h3>
            <p className="text-sm text-gray-600 mt-1">
              Remove permanentemente todas as suas conversas de suporte. Esta ação não pode ser desfeita.
            </p>
            <Button variant="destructive" size="sm" className="mt-3">
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar Tudo
            </Button>
          </div>
        </div>
      </Card>

      {/* Informações de Uso */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-3">Dados Processados pela IA</h3>
        <ul className="space-y-2 text-sm">
          <li>✅ Seu primeiro nome (ex: "João")</li>
          <li>✅ Nome da empresa</li>
          <li>✅ Plano contratado</li>
          <li>✅ Número total de contratos (agregado)</li>
          <li>✅ Margem média (agregado)</li>
          <li className="text-red-600 font-medium">❌ NUNCA processamos: CNPJ, CPF, senhas, dados bancários</li>
        </ul>
        <p className="text-xs text-gray-600 mt-4">
          Para mais informações: <a href="mailto:lgpd@duogovernance.com.br" className="underline">lgpd@duogovernance.com.br</a>
        </p>
      </Card>
    </div>
  )
}
```

---

## CHECKLIST DE COMPLIANCE LGPD
```
[ ] Modal de consentimento implementado (primeira vez)
[ ] Consentimento registrado com timestamp + IP
[ ] Usuário pode revogar consentimento (UI funcional)
[ ] Dados sanitizados antes de enviar para IA
[ ] Validação de output (não vazar dados sensíveis)
[ ] Audit log completo (support_interactions table)
[ ] Usuário pode exportar histórico de conversas
[ ] Usuário pode deletar histórico de conversas
[ ] Página de privacidade implementada
[ ] DPO nomeado (Data Protection Officer)
[ ] Política de privacidade atualizada (menciona uso de IA)
[ ] Contrato DPA com Anthropic revisado
[ ] ROPA documentado (Registro de Atividades de Tratamento)
[ ] Incident response plan para vazamento
[ ] Treinamento da equipe em LGPD
```

---

## CONTRATO COM ANTHROPIC (DPA)

### Pontos a Verificar
```
✅ Anthropic não treina modelos com dados de clientes
✅ Dados não são armazenados após resposta (efêmero)
✅ Anthropic é GDPR compliant (equivalente LGPD)
✅ Transferência internacional de dados (EU-US adequada)
✅ Subprocessadores listados e aprovados
✅ Notificação de incidentes em 72h
✅ Direito de auditoria
```

**Documentação:** https://www.anthropic.com/legal/commercial-terms

---

## TRANSPARENCY FOOTER NO CHAT

**Adicionar ao final de cada resposta da IA:**
```
---
🤖 Resposta gerada por IA • 🔒 Seus dados são protegidos pela LGPD
📞 Quer falar com humano? Clique aqui
```

---

**Última atualização:** 2026-02-23  
**Responsável:** @analyst + @qa  
**Status:** Crítico - Implementar ANTES de produção