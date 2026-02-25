# 🎯 INTEGRAÇÃO CRISP - CHAT IN-APP

**Status:** Planejamento  
**Prioridade:** Alta  
**Estimativa:** 1-2 dias  
**Agente AIOS Recomendado:** @architect

---

## VISÃO GERAL

Integração do Crisp como solução de chat in-app para suporte ao cliente.

**Por que Crisp?**
- ✅ Preço acessível: $25/mês (R$ 131/mês)
- ✅ Ilimitado agentes
- ✅ Chat + Email + WhatsApp unificado
- ✅ IA integrada (chatbot + IA generativa)
- ✅ Base de conhecimento inclusa
- ✅ LGPD compliant (GDPR compliant)
- ✅ Interface em português
- ✅ API robusta
- ✅ SDK JavaScript simples

---

## PRÉ-REQUISITOS

### Conta Crisp
1. Criar conta em: https://crisp.chat
2. Escolher plano: Basic ($25/mês)
3. Obter WEBSITE_ID do painel

### Variáveis de Ambiente
```bash
# .env.local
NEXT_PUBLIC_CRISP_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## IMPLEMENTAÇÃO FRONTEND

### Passo 1: Adicionar Script Crisp

**Arquivo:** `frontend/components/crisp-chat.tsx`
```tsx
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useEmpresa } from '@/lib/hooks/use-empresa'

declare global {
  interface Window {
    $crisp: any[]
    CRISP_WEBSITE_ID: string
  }
}

export function CrispChat() {
  const { user } = useAuth()
  const { empresa } = useEmpresa()

  useEffect(() => {
    // Só carregar Crisp se tiver WEBSITE_ID
    if (!process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID) {
      console.warn('Crisp WEBSITE_ID não configurado')
      return
    }

    // Inicializar Crisp
    window.$crisp = []
    window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID

    // Adicionar script do Crisp
    const script = document.createElement('script')
    script.src = 'https://client.crisp.chat/l.js'
    script.async = true
    document.head.appendChild(script)

    // Aguardar Crisp carregar
    script.onload = () => {
      if (!user || !empresa) return

      // Configurar dados do usuário
      window.$crisp.push(['set', 'user:email', [user.email]])
      window.$crisp.push(['set', 'user:nickname', [user.nome]])
      window.$crisp.push(['set', 'user:phone', [user.telefone || '']])

      // Configurar dados da empresa (contexto)
      window.$crisp.push(['set', 'session:data', [[
        ['empresa_id', empresa.id],
        ['empresa_nome', empresa.nome_fantasia],
        ['empresa_cnpj', empresa.cnpj],
        ['plano', empresa.plano || 'essencial'],
        ['data_cadastro', empresa.created_at]
      ]]])

      // Configurar idioma
      window.$crisp.push(['set', 'session:locale', 'pt-br'])

      console.log('✅ Crisp carregado com contexto do usuário')
    }

    // Cleanup
    return () => {
      const scripts = document.querySelectorAll('script[src*="crisp.chat"]')
      scripts.forEach(s => s.remove())
    }
  }, [user, empresa])

  return null // Componente só adiciona script, não renderiza nada
}
```

### Passo 2: Adicionar ao Layout Principal

**Arquivo:** `frontend/app/(dashboard)/layout.tsx`
```tsx
import { CrispChat } from '@/components/crisp-chat'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <CrispChat />
    </div>
  )
}
```

---

## DADOS ENVIADOS AO CRISP (Contexto)

**Visíveis para o agente de suporte:**

| Campo | Exemplo | Por quê |
|-------|---------|---------|
| `user:email` | joao@empresa.com.br | Identificação |
| `user:nickname` | João Silva | Personalização |
| `empresa_nome` | TechCorp Ltda | Contexto |
| `plano` | inteligencia | Priorização SLA |
| `empresa_id` | uuid-xxx | Buscar dados adicionais se necessário |

**NÃO enviar:**
- ❌ Senhas
- ❌ Tokens de autenticação
- ❌ Dados bancários
- ❌ Informações sensíveis (dados contratuais detalhados)

---

## CUSTOMIZAÇÃO DO CHAT

### Cores e Aparência

**No painel Crisp:**

1. Ir em: Settings → Chatbox → Appearance
2. Configurar:
   - **Cor primária:** `#14b8a6` (teal do DUO)
   - **Posição:** Canto inferior direito
   - **Texto de boas-vindas:** "👋 Olá! Como posso ajudar você hoje?"

### Horário de Atendimento

**No painel Crisp:**

1. Ir em: Settings → Chatbox → Availability
2. Configurar:
   - Segunda a Sexta: 9h - 18h (BRT)
   - Sábado/Domingo: Offline
   - Mensagem offline: "Estamos fora do horário. Deixe sua mensagem e responderemos em breve!"

---

## SEGURANÇA

### Verificação de Identidade
```tsx
// Garantir que dados do usuário são autênticos
// Crisp SDK só é carregado se usuário está autenticado
if (!user || !empresa) {
  console.warn('Crisp não carregado - usuário não autenticado')
  return
}
```

### Sanitização de Dados
```tsx
// Remover caracteres especiais de campos de texto livre
const sanitizeName = (name: string) => {
  return name.replace(/[<>]/g, '') // Remove < e >
}

window.$crisp.push(['set', 'user:nickname', [sanitizeName(user.nome)]])
```

---

## TESTES

### Checklist de Validação
```
[ ] Script Crisp carrega sem erros no console
[ ] Chat aparece no canto inferior direito
[ ] Usuário logado: nome e email aparecem no chat
[ ] Dados da empresa aparecem no painel Crisp (lado agente)
[ ] Mensagem enviada pelo cliente chega no Crisp
[ ] Resposta do agente chega no cliente
[ ] Histórico de conversas persiste entre sessões
[ ] Chat não aparece para usuários não autenticados
[ ] Logout remove contexto do usuário
```

---

## TROUBLESHOOTING

### Problema: Chat não aparece

**Solução:**
```bash
# Verificar se WEBSITE_ID está configurado
echo $NEXT_PUBLIC_CRISP_WEBSITE_ID

# Verificar console do navegador
# Deve aparecer: "✅ Crisp carregado com contexto do usuário"
```

### Problema: Dados do usuário não aparecem

**Solução:**
```tsx
// Verificar se hooks retornam dados
console.log('User:', user)
console.log('Empresa:', empresa)

// Garantir que Crisp só é configurado após carregar
script.onload = () => {
  // Configurar dados aqui, não antes
}
```

### Problema: Script carrega múltiplas vezes

**Solução:**
```tsx
// Adicionar cleanup no useEffect
return () => {
  const scripts = document.querySelectorAll('script[src*="crisp.chat"]')
  scripts.forEach(s => s.remove())
  delete window.$crisp
  delete window.CRISP_WEBSITE_ID
}
```

---

## PRÓXIMOS PASSOS

Após integração básica:

1. ✅ Configurar chatbot rule-based (FAQ)
2. ✅ Integrar IA com Claude (próximo doc)
3. ✅ Adicionar base de conhecimento
4. ✅ Configurar WhatsApp Business

---

## REFERÊNCIAS

- Documentação Crisp: https://docs.crisp.chat/guides/chatbox-sdks/web-sdk/
- SDK JavaScript: https://docs.crisp.chat/guides/chatbox-sdks/web-sdk/dollar-crisp/
- React Integration: https://docs.crisp.chat/guides/chatbox-sdks/web-sdk/react/

---

**Última atualização:** 2026-02-23  
**Responsável:** @architect  
**Status:** Pronto para implementação