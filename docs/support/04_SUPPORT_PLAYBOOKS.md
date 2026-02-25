# 📚 PLAYBOOKS DE SUPORTE - GUIA OPERACIONAL

**Status:** Documentação Operacional  
**Prioridade:** Média  
**Agente AIOS Recomendado:** @product

---

## VISÃO GERAL

Guias passo-a-passo para os principais cenários de suporte.

**Objetivo:** Garantir consistência e qualidade no atendimento.

---

## PLAYBOOK 1: PROBLEMA TÉCNICO

### Cenário: "Sistema não carrega"

**Sintomas:**
- Página em branco
- Loading infinito
- Erro 500/404
- "Something went wrong"

**Passo 1: Coletar Informações** (30 segundos)
```
Perguntas obrigatórias:
1. Qual navegador você está usando? (Chrome, Firefox, Safari, Edge)
2. Qual página específica não carrega? (URL se possível)
3. Aparece alguma mensagem de erro? (screenshot ajuda muito)
4. Funciona no celular ou outro dispositivo?
5. Quando começou o problema? (hoje, ontem, sempre)
```

**Passo 2: Troubleshooting Básico** (2 minutos)
```
Tente nesta ordem:

1️⃣ Limpar cache do navegador
   Chrome: Ctrl+Shift+Del → Limpar últimas 24h
   
2️⃣ Modo anônimo/privado
   Ctrl+Shift+N (Chrome) ou Ctrl+Shift+P (Firefox)
   Se funcionar = problema de cache/extensão
   
3️⃣ Desativar extensões
   Desabilitar todas, testar, reativar uma por uma
   
4️⃣ Outro navegador
   Se Chrome não funciona, tentar Firefox
   
5️⃣ Verificar internet
   Abrir speedtest.net, verificar se internet está ok
```

**Passo 3: Coletar Logs Técnicos** (1 minuto)
```
Se não resolveu, pedir logs:

1. Apertar F12 (abre DevTools)
2. Clicar na aba "Console"
3. Fazer screenshot de erros vermelhos
4. Enviar para suporte

Logs ajudam dev a diagnosticar 10x mais rápido!
```

**Passo 4: Decisão de Escalação**
```
ESCALAR PARA DEV se:
✅ Erro persiste após troubleshooting
✅ Logs mostram erro de servidor (500)
✅ Problema afeta múltiplos usuários
✅ Problema afeta funcionalidade crítica (não consegue salvar contrato)

NÃO ESCALAR se:
❌ Problema de internet do usuário
❌ Problema resolvido com cache/extensão
❌ Erro de uso (usuário não entendeu como funciona)
```

**Passo 5: Criar Ticket Técnico**
```
Template:

---
PROBLEMA TÉCNICO - [DESCRIÇÃO CURTA]

USUÁRIO:
- Nome: [nome]
- Email: [email]
- Empresa: [empresa]
- Plano: [plano]

SINTOMA:
[Descrição do que não funciona]

NAVEGADOR/DEVICE:
- Navegador: Chrome 120 / Firefox 115 / etc
- OS: Windows 11 / macOS / Linux
- Mobile: Sim/Não

PASSOS PARA REPRODUZIR:
1. Acessar página X
2. Clicar em Y
3. Erro aparece

LOGS/ERROS:
```
[screenshot do console]
```

TROUBLESHOOTING FEITO:
- [x] Limpar cache
- [x] Modo anônimo
- [ ] Outro navegador (não testado)

URGÊNCIA:
🔴 Crítico (não consegue trabalhar)
🟡 Médio (workaround existe)
🟢 Baixo (cosmético)
---
```

**Passo 6: Workaround Temporário**
```
Enquanto dev investiga, oferecer:

"Entendo a frustração. Nosso time técnico já está investigando.

Enquanto isso, você pode:
- Usar navegador X (se aplicável)
- Acessar página Y como alternativa
- Fazer Z manualmente

Vou te atualizar assim que tivermos correção. Estimativa: [2-24h]"
```

**SLA por Urgência:**

| Urgência | First Response | Resolução Target | Atualização |
|----------|---------------|------------------|-------------|
| 🔴 Crítico | 1h | 4h | A cada 2h |
| 🟡 Médio | 4h | 24h | A cada 6h |
| 🟢 Baixo | 24h | 72h | Quando resolvido |

---

## PLAYBOOK 2: DÚVIDA SOBRE FUNCIONALIDADE

### Cenário: "Como faço para...?"

**Passo 1: Identificar a Dúvida** (10 segundos)
```
Categorias comuns:
- Cadastro (contrato, item, custo, entrega, AF)
- Cálculos (margem, saldo, reajuste)
- Relatórios (onde encontrar, como filtrar)
- Configurações (usuários, permissões, empresa)
- OCR/IA (como usar, por que falhou)
```

**Passo 2: Resposta Direta + Tutorial** (1 minuto)
```
Template de resposta:

"Para [fazer X], siga estes passos:

1. Acesse o menu [Menu Y]
2. Clique em [Botão Z]
3. Preencha os campos [A, B, C]
4. Clique em Salvar

💡 Dica: [dica útil relacionada]

📹 Tutorial em vídeo: [link 2min]
📄 Artigo completo: [link base conhecimento]

Conseguiu fazer? Me avise se ficou alguma dúvida! 😊"
```

**Passo 3: Validar Entendimento**
```
Aguardar resposta do usuário.

Se responder "Sim, obrigado":
✅ Marcar como resolvido
✅ Perguntar CSAT (satisfação)

Se responder "Não entendi":
🔄 Explicar de outra forma
🔄 Oferecer call screen-share (Tier Inteligência+)
```

---

## PLAYBOOK 3: PROBLEMA COM OCR

### Cenário: "OCR não extraiu os itens"

**Causas Comuns:**
```
1. PDF escaneado (imagem, não texto)
2. PDF com layout não-padrão
3. Tabela mal formatada
4. PDF protegido/criptografado
5. PDF muito grande (>20MB)
```

**Passo 1: Diagnóstico** (30 segundos)
```
Perguntas:

1. "Qual o tamanho do arquivo?" (ver se >20MB)
2. "O PDF é escaneado ou digital?" 
   Dica: PDF digital permite selecionar texto
3. "Tem tabela clara com colunas: Item, Descrição, Quantidade, Valor?"
```

**Passo 2: Soluções por Causa**
```
CAUSA: PDF escaneado (OCR ruim)
SOLUÇÃO:
"PDFs escaneados têm precisão menor. Tente:
1. Obter versão digital do órgão
2. Ou adicionar itens manualmente (mais rápido que redigitar)"

---

CAUSA: PDF não-padrão (tabela fora do formato)
SOLUÇÃO:
"Nosso OCR funciona melhor com tabelas padrão.
Para este caso específico:
1. Adicione itens manualmente
2. Ou envie o PDF para suporte@duo... - vamos melhorar o OCR"

---

CAUSA: PDF >20MB
SOLUÇÃO:
"Limite atual: 20MB. Reduza o arquivo:
1. Use https://www.ilovepdf.com/compress_pdf
2. Ou divida em partes menores"

---

CAUSA: PDF protegido
SOLUÇÃO:
"PDF com senha não pode ser lido. Remova a proteção:
1. Peça versão sem senha ao órgão
2. Ou use https://www.ilovepdf.com/unlock_pdf"
```

**Passo 3: Fallback Manual**
```
"Entendo que é chato adicionar manualmente, mas:

✅ Adicionar 30 itens = 10-15 minutos
❌ Esperar OCR funcionar em PDF ruim = pode não funcionar

Prefere que eu te ensine o jeito mais rápido de cadastrar manual?"
```

**Passo 4: Feedback para Produto**
```
Se OCR falhou em PDF válido:

1. Baixar PDF do chat
2. Criar issue no GitHub:
   "OCR failed - [tipo de contrato]"
3. Anexar PDF (sem dados sensíveis se possível)
4. Dev vai melhorar prompt/lógica
```

---

## PLAYBOOK 4: RECLAMAÇÃO DE COBRANÇA

### Cenário: "Fui cobrado errado"

**CRÍTICO:** Escalar IMEDIATAMENTE para comercial/financeiro.

**Passo 1: Empatia + Informação** (1 minuto)
```
"Entendo sua preocupação. Vamos verificar isso agora.

Para agilizar, preciso de:
1. Email da fatura (ou screenshot)
2. Valor cobrado vs valor esperado
3. Plano contratado"
```

**Passo 2: Verificação Rápida** (30 segundos)
```
Verificar no painel admin:
- Plano do cliente
- Última fatura
- Mudanças recentes (upgrade/downgrade)

Se cobrou certo:
"Verificando aqui, o valor está correto porque:
- Plano X custa R$ Y/mês
- [Se upgrade] Ajuste proporcional de R$ Z
- Total: R$ W

Veja detalhamento: [link fatura]"

Se cobrou errado:
"Você está certo, houve um erro. Vou escalar para financeiro
corrigir HOJE. Tempo de estorno: 3-5 dias úteis."
```

**Passo 3: Escalar**
```
Se qualquer dúvida ou erro confirmado:

📧 Email: financeiro@duogovernance.com.br
CC: suporte@duogovernance.com.br

Assunto: URGENTE - Cobrança Cliente [NOME]

Corpo:
Cliente: [nome]
Email: [email]
Empresa: [empresa]

Problema: [descrição]
Valor cobrado: R$ X
Valor correto: R$ Y

Ticket suporte: #12345
```

**SLA:** Resposta financeiro em 4h úteis (mesmo dia)

---

## PLAYBOOK 5: PEDIDO DE FEATURE/MELHORIA

### Cenário: "Seria legal se tivesse..."

**Passo 1: Agradecer + Validar** (30 segundos)
```
"Obrigado pela sugestão! 💡

Para entender melhor:
1. Qual problema isso resolveria para você?
2. Com que frequência você usaria?
3. Tem algum workaround que você usa hoje?"
```

**Passo 2: Checar Roadmap** (1 minuto)
```
Verificar se já está planejado:

✅ JÁ PLANEJADO:
"Boa notícia! Isso já está no nosso roadmap para [Q2/Q3].
Vou adicionar seu voto. Quer que te avisemos quando sair?"

⏳ EM ANÁLISE:
"Outros clientes já pediram isso. Estamos avaliando viabilidade.
Seu feedback ajuda a priorizar!"

❌ NÃO PLANEJADO:
"Ainda não temos isso. Vou registrar sua sugestão para time de produto avaliar."
```

**Passo 3: Registrar Formalmente**
```
Criar issue no sistema de feedback:

Título: [FEATURE] [Descrição curta]

Detalhes:
- Cliente: [nome/empresa]
- Plano: [plano]
- Use case: [problema que resolve]
- Frequência de uso: [diário/semanal/mensal]
- Workaround atual: [como faz hoje]

Votos: 1
Prioridade: [P2/P3]
```

**Passo 4: Oferecer Alternativa**
```
"Enquanto isso não sai, você pode:
- [Alternativa 1]
- [Alternativa 2]

Não é ideal, mas quebra o galho. Se precisar de ajuda, estou aqui!"
```

---

## PLAYBOOK 6: ONBOARDING DE NOVO CLIENTE

### Cenário: Cliente acabou de assinar

**Objetivo:** Primeiro sucesso em 24h (time-to-value)

**Passo 1: Welcome Email** (automático)
```
Assunto: 🎉 Bem-vindo ao DUO Governance!

Olá [Nome],

Seja bem-vindo! Estamos animados em ter você conosco.

PRIMEIROS PASSOS (10 minutos):
1. ✅ Complete seu perfil
2. ✅ Cadastre sua primeira empresa
3. ✅ Adicione um contrato (use OCR para ir rápido!)

📹 Tour guiado (5min): [link]
📚 Central de ajuda: [link]
💬 Falar com suporte: [botão chat]

Estamos aqui para ajudar em qualquer momento!

Equipe DUO Governance
```

**Passo 2: In-app Onboarding** (tooltips)
```
1º login:
→ Tour interativo (Intro.js)
→ "Clique aqui para cadastrar primeiro contrato"
→ "Use OCR para economizar tempo"
→ "Veja seu dashboard atualizado em tempo real"
```

**Passo 3: Proactive Outreach** (D+2)
```
Se cliente não cadastrou nada em 48h:

Email/WhatsApp:
"Oi [Nome]! 👋

Notei que você ainda não cadastrou contratos. Está com alguma dúvida?

Posso te ajudar com:
- Importar contratos existentes
- Entender o sistema
- Call de 15min para te mostrar tudo

É só responder este email!

[Seu nome]
Customer Success DUO"
```

**Passo 4: Primeira Semana - Checklist**
```
Meta: Cliente ter pelo menos 3 contratos + 10 itens cadastrados

D+1: Welcome email
D+2: Check-in (cadastrou algo?)
D+3: Tip email ("Use OCR para ir mais rápido")
D+5: Oferecer call de onboarding (15min)
D+7: Survey: "Como foi sua primeira semana?"

Se completou checklist:
✅ Cliente ativado
✅ Churn risk: Baixo

Se não completou:
⚠️ Intervir: Call obrigatória
⚠️ Churn risk: Alto
```

---

## PLAYBOOK 7: CLIENTE EM RISCO DE CHURN

### Sinais de Alerta
```
🚨 CRÍTICO (intervir imediatamente):
- Não logou há 14+ dias
- Abriu ticket de cancelamento
- CSAT <4 (insatisfeito)
- Múltiplos problemas técnicos não resolvidos

⚠️ ATENÇÃO (monitorar):
- Login caiu 50%+ vs mês anterior
- Não cadastrou novos contratos há 30+ dias
- Reclamação em redes sociais
```

**Passo 1: Entender o Motivo** (call obrigatória)
```
"Oi [Nome], notei que você não tem usado muito o sistema.
Está tudo ok? Teve algum problema?

Quero entender como podemos ajudar melhor."

ESCUTAR ativamente. Não vender. Não justificar.
```

**Passo 2: Plano de Ação**
```
MOTIVO: "Muito complicado"
AÇÃO: Onboarding 1:1, simplificar workflow

MOTIVO: "Não vejo valor"
AÇÃO: Mostrar features que ele não usa (ROI)

MOTIVO: "Muito caro"
AÇÃO: Escalar para comercial (desconto/downgrade)

MOTIVO: "Problema técnico não resolvido"
AÇÃO: Escalar CEO - resolver HOJE

MOTIVO: "Mudamos de estratégia"
AÇÃO: Aceitar churn, pedir feedback
```

**Passo 3: Win-back Offer** (último recurso)
```
"Antes de cancelar, que tal:
- 2 meses 50% off para você testar mais
- Upgrade gratuito para tier Intelligence
- Onboarding dedicado comigo

O que acha?"
```

**Passo 4: Se Churn Confirmado**
```
"Entendo. Obrigado por ter usado o DUO.

Antes de ir:
1. Quer exportar seus dados? (LGPD)
2. O que poderíamos ter feito diferente?

Porta aberta: se voltar, basta falar comigo."

Registrar motivo de churn (análise de produto)
```

---

## MÉTRICAS DE SUCESSO DOS PLAYBOOKS
```
PLAYBOOK 1 (Técnico):
✅ 80% resolvido sem escalar para dev
✅ Tempo médio resolução: <6h

PLAYBOOK 2 (Funcionalidade):
✅ CSAT >80% (satisfação)
✅ FCR >90% (resolução primeiro contato)

PLAYBOOK 3 (OCR):
✅ Cliente entende limitações
✅ Feedback coletado para melhorar

PLAYBOOK 6 (Onboarding):
✅ 70% clientes completam checklist D+7
✅ Churn <10% primeiros 90 dias

PLAYBOOK 7 (Churn):
✅ 40% win-back success rate
✅ Feedback 100% documentado
```

---

**Última atualização:** 2026-02-23  
**Responsável:** @product  
**Status:** Documentação operacional completa