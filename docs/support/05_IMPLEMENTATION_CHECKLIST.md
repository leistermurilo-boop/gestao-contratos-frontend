# ✅ CHECKLIST DE IMPLEMENTAÇÃO - SUPORTE COMPLETO

**Status:** Guia de Execução  
**Agente AIOS Responsável:** @architect (coordenação)

---

## FASE 1: SETUP BÁSICO (Semana 1)

### Sprint 1.1: Crisp Integration
```
[ ] 1.1.1 Criar conta Crisp (https://crisp.chat)
      Responsável: @product
      Tempo: 10 min
      Output: WEBSITE_ID

[ ] 1.1.2 Adicionar WEBSITE_ID ao .env
      Arquivo: .env.local
      Variável: NEXT_PUBLIC_CRISP_WEBSITE_ID

[ ] 1.1.3 Criar componente CrispChat
      Arquivo: frontend/components/crisp-chat.tsx
      Ref: 01_CRISP_INTEGRATION.md
      Responsável: @architect

[ ] 1.1.4 Adicionar CrispChat ao layout dashboard
      Arquivo: frontend/app/(dashboard)/layout.tsx
      Teste: Chat aparece no canto inferior direito

[ ] 1.1.5 Configurar dados do usuário (context)
      Testar: Dados aparecem no painel Crisp
      Validar: email, nome, empresa_id, plano

[ ] 1.1.6 Personalizar aparência Crisp
      Cor primária: #14b8a6 (teal DUO)
      Mensagem boas-vindas: "👋 Olá! Como posso ajudar?"
      Horário: Seg-Sex 9h-18h BRT
```

**Critério de Aceitação:**
- ✅ Chat carrega sem erros
- ✅ Usuário logado: dados aparecem no Crisp
- ✅ Mensagem enviada pelo cliente chega no Crisp
- ✅ Resposta do agente chega no cliente

---

### Sprint 1.2: Database Setup
```
[ ] 1.2.1 Adicionar campos LGPD na tabela usuarios
      Arquivo: database/migrations/016_lgpd_support.sql
      Campos:
      - lgpd_consent_support_ai (boolean)
      - lgpd_consent_date (timestamptz)
      - lgpd_consent_ip (text)
      - lgpd_consent_revoked_date (timestamptz)

[ ] 1.2.2 Criar tabela support_interactions
      Arquivo: database/migrations/016_support_audit.sql
      Ref: 03_SUPPORT_SECURITY_LGPD.md
      Responsável: @architect

[ ] 1.2.3 Aplicar migrations
      Comando: supabase db push
      Validar: Tabelas criadas sem erros

[ ] 1.2.4 Testar RLS (Row Level Security)
      Validar: Usuário só vê suas próprias interações
```

**Critério de Aceitação:**
- ✅ Migrations aplicadas com sucesso
- ✅ RLS funciona corretamente
- ✅ Audit log salva interações

---

### Sprint 1.3: Base de Conhecimento
```
[ ] 1.3.1 Criar 10 artigos FAQ essenciais
      Tópicos:
      - Como cadastrar contrato
      - O que é margem atual
      - Como usar OCR
      - Como adicionar usuários
      - Como emitir AF
      - Como registrar custo
      - O que é saldo de contrato
      - Como calcular reajuste
      - Onde ver relatórios
      - Como exportar dados
      
      Responsável: @product
      Tempo: 4h

[ ] 1.3.2 Adicionar artigos no Crisp
      Crisp → Settings → Knowledge Base
      Categorizar por tema

[ ] 1.3.3 Gravar 3 vídeos tutoriais (Loom)
      - Tour completo (5min)
      - Cadastro de contrato (3min)
      - Usando OCR (2min)
      
      Responsável: @product
      Tempo: 2h

[ ] 1.3.4 Criar arquivo FAQ local (fallback)
      Arquivo: backend/ai/support/knowledge-base.ts
      Ref: 02_SUPPORT_AI_AGENT.md
```

**Critério de Aceitação:**
- ✅ 10 artigos publicados no Crisp
- ✅ 3 vídeos gravados e linkados
- ✅ FAQ local sincronizado

---

## FASE 2: IA BÁSICA (Semana 2)

### Sprint 2.1: LGPD Compliance
```
[ ] 2.1.1 Criar modal de consentimento
      Arquivo: frontend/components/support/consent-modal.tsx
      Ref: 03_SUPPORT_SECURITY_LGPD.md
      Responsável: @architect

[ ] 2.1.2 Criar hook use-support-consent
      Arquivo: frontend/lib/hooks/use-support-consent.ts
      Funcionalidades:
      - checkConsent()
      - grantConsent()
      - revokeConsent()

[ ] 2.1.3 Integrar modal no primeiro uso do chat
      Lógica: Se lgpd_consent_support_ai = false, mostrar modal
      
[ ] 2.1.4 Criar página de privacidade do suporte
      Arquivo: frontend/app/(dashboard)/configuracoes/privacidade-suporte/page.tsx
      Features:
      - Ver status consentimento
      - Revogar consentimento
      - Exportar histórico
      - Deletar histórico

[ ] 2.1.5 Implementar data sanitizer
      Arquivo: backend/ai/support/data-sanitizer.ts
      Ref: 03_SUPPORT_SECURITY_LGPD.md
      Validar: Não vaza CNPJ, CPF, UUIDs

[ ] 2.1.6 Implementar audit logger
      Arquivo: backend/ai/support/audit-logger.ts
      Testar: Logs salvam em support_interactions
```

**Critério de Aceitação:**
- ✅ Modal de consentimento funciona
- ✅ Consentimento persiste no banco
- ✅ Página de privacidade renderiza corretamente
- ✅ Data sanitizer remove dados sensíveis
- ✅ Audit log registra todas interações

---

### Sprint 2.2: Agente IA Core
```
[ ] 2.2.1 Criar types.ts
      Arquivo: backend/ai/support/types.ts
      Ref: 02_SUPPORT_AI_AGENT.md
      Interfaces: SupportQuery, SupportResponse, Classification

[ ] 2.2.2 Criar classifier.ts
      Arquivo: backend/ai/support/classifier.ts
      Função: classifyQuery(message)
      Responsável: @architect

[ ] 2.2.3 Criar knowledge-base.ts
      Arquivo: backend/ai/support/knowledge-base.ts
      Função: searchKnowledgeBase(query)
      
[ ] 2.2.4 Criar data-fetcher.ts
      Arquivo: backend/ai/support/data-fetcher.ts
      Função: fetchUserData(empresaId, entities)
      Validar: RLS funciona (só dados da empresa)

[ ] 2.2.5 Criar agent.ts (agente principal)
      Arquivo: backend/ai/support/agent.ts
      Classe: SupportAgent
      Método: handleQuery(query)

[ ] 2.2.6 Testar agente com casos de teste
      Casos:
      - FAQ: "Como cadastrar contrato?"
      - Data: "Quantos contratos tenho?"
      - Technical: "Sistema deu erro"
```

**Critério de Aceitação:**
- ✅ Classifier retorna type correto (>80% precisão)
- ✅ Knowledge base encontra artigos relevantes
- ✅ Data fetcher busca dados corretos
- ✅ Agent retorna respostas coerentes
- ✅ Escalation funciona (needsHuman=true)

---

### Sprint 2.3: Webhook Crisp → IA
```
[ ] 2.3.1 Obter token API do Crisp
      Crisp → Settings → API
      Copiar: Identifier + Key

[ ] 2.3.2 Adicionar tokens ao .env
      CRISP_API_IDENTIFIER=xxx
      CRISP_API_KEY=xxx

[ ] 2.3.3 Criar API route webhook
      Arquivo: backend/app/api/support/crisp-webhook/route.ts
      Ref: 02_SUPPORT_AI_AGENT.md
      Método: POST

[ ] 2.3.4 Configurar webhook no Crisp
      Crisp → Settings → Webhooks
      URL: https://yourdomain.com/api/support/crisp-webhook
      Events: message:send

[ ] 2.3.5 Implementar sendCrispMessage()
      Função para enviar resposta de volta ao Crisp
      
[ ] 2.3.6 Implementar tagCrispConversation()
      Adicionar tag "needs-human" quando escalar

[ ] 2.3.7 Testar fluxo completo
      Cliente envia mensagem → IA responde → Cliente recebe
```

**Critério de Aceitação:**
- ✅ Webhook recebe mensagens do Crisp
- ✅ IA processa e responde em <5 segundos
- ✅ Resposta aparece no chat do cliente
- ✅ Tag "needs-human" aparece quando necessário
- ✅ Audit log registra interação

---

## FASE 3: POLISH E OTIMIZAÇÃO (Semana 3)

### Sprint 3.1: Melhorias de UX
```
[ ] 3.1.1 Adicionar typing indicator
      Mostrar "IA está digitando..." enquanto processa

[ ] 3.1.2 Adicionar botões de ação rápida
      Exemplos:
      - "👍 Resolveu"
      - "👎 Não resolveu"
      - "🙋 Falar com humano"

[ ] 3.1.3 Adicionar rich content nas respostas
      - Imagens (screenshots)
      - Vídeos (tutoriais)
      - Links (artigos)
      - Botões (ações)

[ ] 3.1.4 Customizar mensagens de erro
      Erro de IA → Mensagem amigável + escalar automático

[ ] 3.1.5 Adicionar feedback loop
      Após cada resposta: "Isso ajudou? 👍 👎"
      Salvar feedback para melhorar prompts
```

**Critério de Aceitação:**
- ✅ UX polida e profissional
- ✅ Feedbacks coletados
- ✅ Erros tratados gracefully

---

### Sprint 3.2: Prompts Optimization
```
[ ] 3.2.1 Coletar primeiras 50 conversas reais
      Analisar: Quais perguntas são mais comuns?

[ ] 3.2.2 Refinar prompts baseado em dados
      - Melhorar classificação (reduzir falsos positivos)
      - Ajustar tom de voz (mais/menos formal)
      - Adicionar exemplos ao prompt

[ ] 3.2.3 A/B test de prompts
      Versão A vs Versão B
      Métrica: CSAT score

[ ] 3.2.4 Documentar best practices
      Criar guia: "Como escrever bons prompts"

[ ] 3.2.5 Versionar prompts
      Git: prompt-v1.txt, prompt-v2.txt
      Rollback fácil se versão nova piorar
```

**Critério de Aceitação:**
- ✅ Precisão de classificação >90%
- ✅ CSAT score >70%
- ✅ Tempo de resposta <5s (P95)

---

### Sprint 3.3: Monitoring e Alertas
```
[ ] 3.3.1 Dashboard de métricas (interno)
      Métricas:
      - Total de conversas/dia
      - Taxa de resolução IA (%)
      - Taxa de escalação (%)
      - CSAT score médio
      - Tempo médio de resposta
      - Queries por tipo (FAQ, data, tech)

[ ] 3.3.2 Alertas automáticos
      Slack/Email quando:
      - Taxa de escalação >20% (IA não está resolvendo)
      - CSAT <60% (clientes insatisfeitos)
      - Tempo resposta >10s (problema de infra)
      - Erro de IA >5 vezes/hora

[ ] 3.3.3 Criar runbook de incidentes
      Se X acontecer → Fazer Y

[ ] 3.3.4 Setup Sentry para errors
      Capturar erros de IA automaticamente
```

**Critério de Aceitação:**
- ✅ Dashboard mostra métricas em tempo real
- ✅ Alertas funcionam
- ✅ Erros são capturados

---

## FASE 4: EXPANSÃO (Semana 4+)

### Sprint 4.1: WhatsApp Integration
```
[ ] 4.1.1 Criar conta Z-API ou Meta Business API
      Escolher: Z-API (mais fácil) ou Meta (mais robusto)

[ ] 4.1.2 Conectar WhatsApp ao Crisp
      Crisp suporta WhatsApp nativo

[ ] 4.1.3 Configurar mensagens automáticas WhatsApp
      Horário comercial: IA responde
      Fora do horário: "Respondemos amanhã"

[ ] 4.1.4 Testar fluxo WhatsApp → Crisp → IA
      Validar: Cliente no WhatsApp recebe resposta IA
```

**Critério de Aceitação:**
- ✅ WhatsApp conectado ao Crisp
- ✅ IA responde no WhatsApp
- ✅ Histórico unificado (chat + WhatsApp)

---

### Sprint 4.2: Advanced Features
```
[ ] 4.2.1 Sentiment analysis
      Detectar frustração/raiva → Priorizar ticket

[ ] 4.2.2 Smart routing
      Pergunta técnica → Tag "dev"
      Pergunta comercial → Tag "vendas"

[ ] 4.2.3 Proactive support
      Cliente parado 5min em página → "Precisa de ajuda?"

[ ] 4.2.4 Context awareness
      IA sabe qual página cliente está
      Resposta mais específica

[ ] 4.2.5 Multi-language (futuro)
      Suporte inglês/espanhol para expansão LATAM
```

---

## MÉTRICAS DE SUCESSO GLOBAL

### Targets por Fase
```
FASE 1 (Semana 1):
✅ Chat funcional
✅ Base conhecimento com 10 artigos
Target: Suporte humano apenas (baseline)

FASE 2 (Semana 2):
✅ IA responde perguntas simples
Target: 30% resolução IA

FASE 3 (Semana 3):
✅ IA otimizada
Target: 40-50% resolução IA

FASE 4 (Semana 4+):
✅ WhatsApp + Advanced features
Target: 50%+ resolução IA
CSAT: 75%+
FRT: <1min (First Response Time)
```

### Benchmarks Finais (Mês 3)

| Métrica | Target | Classe Mundial |
|---------|--------|----------------|
| **Resolução IA** | 50% | 60% |
| **CSAT** | 75% | 80% |
| **FRT** | <1min | <30s |
| **Escalação** | <15% | <10% |
| **Churn** | <8% | <5% |

---

## EQUIPE NECESSÁRIA
```
FASE 1-2:
├─ 1 Dev Full-stack (@architect)
├─ 1 Product Manager (@product)
└─ Tempo: 2 semanas (part-time)

FASE 3-4:
├─ 1 Dev Full-stack
├─ 1 Customer Success (CSR)
├─ 1 Product Manager
└─ Tempo: 2 semanas adicionais

MANUTENÇÃO (ongoing):
├─ 1 CSR (full-time)
├─ 0.5 Dev (melhorias contínuas)
└─ Custo: R$ 5k/mês (salário + ferramentas)
```

---

## CUSTOS ESTIMADOS
```
SETUP (one-time):
├─ Desenvolvimento: R$ 0 (in-house)
├─ Crisp account: $25/mês (R$ 131/mês)
├─ Z-API WhatsApp: R$ 49/mês
└─ Total inicial: R$ 180/mês

OPERAÇÃO (mensal):
├─ Crisp: R$ 131/mês
├─ WhatsApp: R$ 49/mês
├─ Claude API: R$ 50-200/mês (variável)
├─ Salário CSR: R$ 3.500/mês
└─ Total: R$ 3.730-3.880/mês

ROI:
├─ Economia de tempo: 40h/mês (R$ 4.000)
├─ Redução churn: 2% → Economia R$ 2.000/mês
└─ ROI: 160% (payback 3 meses)
```

---

## PRÓXIMOS PASSOS APÓS IMPLEMENTAÇÃO
```
Mês 1:
[ ] Monitorar métricas diariamente
[ ] Ajustar prompts baseado em feedback
[ ] Treinar CSR em novos playbooks

Mês 2:
[ ] Adicionar 20 artigos FAQ (total 30)
[ ] Gravar 5 vídeos tutoriais (total 8)
[ ] Implementar sentiment analysis

Mês 3:
[ ] Atingir 50% resolução IA
[ ] CSAT >75%
[ ] Preparar para escala (100+ clientes)
```

---

**Última atualização:** 2026-02-23  
**Responsável:** @architect (coordenação geral)  
**Status:** Pronto para execução faseada