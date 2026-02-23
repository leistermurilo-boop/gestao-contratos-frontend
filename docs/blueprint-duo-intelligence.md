# BLUEPRINT DE ENGENHARIA: DUO Intelligence & Automação Tática
**Data:** 2026-02-23
**Versão:** 1.0 — Baseado na análise do repositório atual
**Status:** Planejamento estratégico — pronto para implementação faseada

---

## CONTEXTO TÉCNICO (base real do repositório)

O sistema já possui:
- **Formulário de itens** (`components/forms/item-form.tsx`) com 5 campos: `descricao`, `unidade`, `quantidade`, `valor_unitario`, `numero_item`
- **Tabela `itens_contrato`**: campos GENERATED ALWAYS protegidos (`margem_atual`, `saldo_quantidade`, `valor_total`) — triggers no banco cuidam disso
- **1 API Route** existente: `/api/usuarios/invite` (padrão a seguir: auth via session cookie, SERVICE_ROLE_KEY server-side only)
- **RLS 100%** implementado via `empresa_id` — garantia técnica de isolamento multi-tenant
- **Stack**: Next.js 14 App Router, Supabase, Vercel, TypeScript

---

## PILAR 1: BOTÃO "IA PLUS" — EXTRATOR TÁTICO DE ITENS DE CONTRATO

### O Problema Real
O formulário atual aceita **1 item por vez**. Um contrato típico tem 20–200 itens. O gargalo não é o sistema — é o trabalho humano de digitação.

### A Solução: Extração em Lote via Claude

O Claude suporta **PDF nativo** (incluindo digitalizados via OCR interno). Nenhuma biblioteca de parsing de PDF é necessária.

---

### FLUXO TÉCNICO COMPLETO

```
[Formulário de Itens]
       │
       ▼
[Botão "Extrair do PDF" — abre modal]
       │
       ▼
[Upload do PDF do Edital/Contrato]
       │
       ▼
[API Route: POST /api/ia/extrair-itens]
       │
       ├─ Verifica session (auth obrigatório)
       ├─ Valida tamanho (máx 20MB)
       ├─ Envia PDF + prompt ao Claude claude-sonnet-4-6
       └─ Retorna JSON array de itens
       │
       ▼
[Tabela de Revisão no Frontend]
  Cada linha = 1 item extraído
  Campos editáveis inline
  Checkboxes para incluir/excluir
       │
       ▼
[Botão "Importar X itens"]
       │
       ▼
[itensService.createBatch(itens[])]
  → INSERT em lote no Supabase
```

---

### IMPLEMENTAÇÃO: API ROUTE

**Arquivo:** `frontend/app/api/ia/extrair-itens/route.ts`

```typescript
// POST /api/ia/extrair-itens
// Body: FormData com campo "pdf" (File) e "contratoId" (string)

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  // 1. Autenticação obrigatória
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // 2. Receber PDF
  const formData = await req.formData()
  const pdfFile = formData.get('pdf') as File | null
  if (!pdfFile || pdfFile.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Arquivo PDF obrigatório' }, { status: 400 })
  }
  if (pdfFile.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'PDF muito grande. Máximo: 20MB' }, { status: 400 })
  }

  // 3. Converter para base64
  const arrayBuffer = await pdfFile.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  // 4. Chamar Claude com PDF nativo
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          },
          {
            type: 'text',
            text: `Extraia TODOS os itens de contrato/licitação deste documento.
Retorne APENAS um array JSON válido, sem texto adicional, sem markdown.
Cada objeto deve ter exatamente estes campos:
{
  "numero_item": número inteiro ou null,
  "descricao": "descrição completa do item",
  "unidade": "UN/KG/M²/L/etc",
  "quantidade": número decimal,
  "valor_unitario": número decimal em reais (sem símbolo, sem pontos de milhar)
}
Se não encontrar algum campo, use null para numero_item e strings/números razoáveis para os demais.
Retorne [] se não houver itens identificáveis.`,
          },
        ],
      },
    ],
  })

  // 5. Parse e validação do JSON retornado
  const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
  let itens: unknown[]
  try {
    itens = JSON.parse(rawText)
    if (!Array.isArray(itens)) throw new Error('Resposta não é array')
  } catch {
    return NextResponse.json(
      { error: 'Falha ao interpretar resposta da IA. Tente novamente.' },
      { status: 422 }
    )
  }

  // 6. Sanitizar e validar cada item
  const itensSanitizados = itens
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item, idx) => ({
      numero_item: typeof item.numero_item === 'number' ? item.numero_item : null,
      descricao: String(item.descricao ?? '').trim(),
      unidade: String(item.unidade ?? 'UN').trim().toUpperCase(),
      quantidade: Number(item.quantidade) || 0,
      valor_unitario: Number(item.valor_unitario) || 0,
      _id: idx, // chave temporária para o frontend
    }))
    .filter(item => item.descricao.length > 0)

  return NextResponse.json({ itens: itensSanitizados, total: itensSanitizados.length })
}
```

---

### IMPLEMENTAÇÃO: COMPONENTE FRONTEND

**Arquivo:** `frontend/components/ia/extrair-itens-modal.tsx`

**UX Flow:**
```
Estado 1: Idle
  └─ Botão "✨ Extrair do PDF" (outline, brand-navy)

Estado 2: Upload
  └─ Área drag-and-drop ou clique para selecionar PDF
  └─ Progress bar de envio

Estado 3: Processando
  └─ Spinner + "Claude está lendo o documento..."
  └─ Estimativa: 5–30 segundos dependendo do tamanho

Estado 4: Revisão (⚡ etapa mais importante)
  └─ Tabela com todos os itens extraídos
  └─ Cada linha: checkbox | numero_item | descricao (editável) | unidade | quantidade | valor_unitario
  └─ Linhas com quantidade=0 ou descricao vazia destacadas em amarelo
  └─ Botão "Editar" inline por linha
  └─ Botão "Remover linha"
  └─ Rodapé: "X itens selecionados | Valor total estimado: R$ Y"
  └─ Botão principal: "Importar X itens"

Estado 5: Importando
  └─ Progress: "Importando 3/20..."

Estado 6: Sucesso
  └─ Toast "20 itens importados com sucesso!"
  └─ Modal fecha, página de itens recarrega
```

**Integração no formulário existente:**
```tsx
// Em: frontend/app/(dashboard)/dashboard/contratos/[id]/itens/novo/page.tsx
// Adicionar logo abaixo do título:

<div className="flex items-center justify-between">
  <h1>Novo Item</h1>
  <Button variant="outline" onClick={() => setShowExtractor(true)}>
    <Sparkles className="mr-2 h-4 w-4 text-brand-emerald" />
    Extrair do PDF
  </Button>
</div>

{showExtractor && (
  <ExtrairItensModal
    contratoId={contratoId}
    onSuccess={() => { setShowExtractor(false); router.refresh() }}
    onClose={() => setShowExtractor(false)}
  />
)}
```

---

### BATCH INSERT NO SUPABASE

**Arquivo:** `frontend/lib/services/itens.service.ts` — adicionar método:

```typescript
async createBatch(
  contratoId: string,
  cnpjId: string,
  itens: Array<{
    numero_item?: number | null
    descricao: string
    unidade: string
    quantidade: number
    valor_unitario: number
  }>
) {
  const payload = itens.map(item => ({
    contrato_id: contratoId,
    cnpj_id: cnpjId,
    ...item,
  }))

  const { data, error } = await this.supabase
    .from('itens_contrato')
    .insert(payload)
    .select()

  if (error) throw new Error(error.message)
  return data
}
```

---

### VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```bash
# .env.local (dev) / Vercel Settings (produção)
ANTHROPIC_API_KEY=sk-ant-...   # Já em uso no Claude Code
```

**Custo estimado por extração:**
- PDF de 10 páginas ≈ 5.000–15.000 tokens de entrada
- claude-sonnet-4-6: ~$0.003–0.009 por extração
- Modelo alternativo para corte de custo: `claude-haiku-4-5-20251001` (~$0.0003 por extração, menor precisão em PDFs digitalizados)

---

## PILAR 2: O "MAESTRO" — NEWSLETTER EXECUTIVA DE INTELIGÊNCIA

### Conceito
Um job semanal/sob demanda que processa dados internos do cliente + dados externos e gera uma newsletter consultiva personalizada — não genérica, mas baseada nos **contratos reais** do cliente.

---

### ARQUITETURA EM 4 CAMADAS

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA 1: OS OLHOS                       │
│  APIs Externas: PNCP + IBGE + Banco Central + NewsAPI       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    CAMADA 2: O CÉREBRO                      │
│  Cruzamento: Dados Externos × Contratos/Itens do Cliente    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    CAMADA 3: A VOZ                          │
│  Claude gera Newsletter: Manchetes + Checklist + Links      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    CAMADA 4: A MEMÓRIA                      │
│  ai_insights_history: aprendizado + não repetição          │
└─────────────────────────────────────────────────────────────┘
```

---

### CAMADA 1: OS OLHOS — FONTES DE DADOS EXTERNAS

#### PNCP — Portal Nacional de Contratações Públicas
```
API Base: https://pncp.gov.br/api/pncp/v1/
Autenticação: Pública (sem chave)

Endpoints relevantes:
GET /contratacoes/publicacao?dataInicial=...&dataFinal=...&tamanhoPagina=20
  → Editais publicados recentemente (filtrável por segmento/modalidade)

GET /orgaos/{cnpj}/contratos?anoContrato=2025
  → Contratos de um órgão específico (útil para monitorar concorrentes/clientes)
```

#### IBGE — Índices de Inflação
```
API Base: https://servicodados.ibge.gov.br/api/v3/agregados/
Autenticação: Pública

Séries úteis:
- IPCA: agregado=7060, variavel=2266 (variação mensal)
- INPC: agregado=1736, variavel=44 (variação mensal)
- SINAPI (Construção Civil): agregado=2296
```

#### Banco Central — Câmbio e SELIC
```
API Base: https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados
Autenticação: Pública

Séries úteis:
- SELIC diária: código 11
- USD/BRL: código 1 (PTAX venda)
- IPCA acumulado 12m: código 13522
```

#### NewsAPI — Notícias do Setor
```
API Base: https://newsapi.org/v2/
Autenticação: API Key (plano gratuito: 100 req/dia)
ANTHROPIC_API_KEY já cobre isso via webSearch tool alternativa

Query exemplo:
  "licitação TI Brasil" OR "contratos públicos" OR "PNCP" OR [segmento do cliente]
  Últimos 7 dias, idioma pt, fontes brasileiras
```

---

### CAMADA 2: O CÉREBRO — CRUZAMENTO INTERNO

**O dado mais valioso é o que já temos.** O Maestro não precisa de IA para detectar os alertas — a lógica pode ser SQL puro:

```sql
-- Query 1: Itens com margem em queda
-- Cruzar variação IPCA do período com custo_medio atual
SELECT
  ic.id, ic.descricao, ic.valor_unitario, ic.custo_medio,
  ic.margem_atual,
  c.numero_contrato, c.orgao_publico,
  c.data_vigencia_fim
FROM itens_contrato ic
JOIN contratos c ON c.id = ic.contrato_id
WHERE ic.empresa_id = $empresa_id
  AND ic.deleted_at IS NULL
  AND ic.margem_atual < 15  -- margem crítica
  AND ic.custo_medio IS NOT NULL;

-- Query 2: Itens com saldo crítico (< 20% restante)
SELECT
  ic.descricao, ic.quantidade, ic.quantidade_entregue,
  ic.saldo_quantidade,
  (ic.quantidade_entregue::float / ic.quantidade * 100) AS pct_consumido,
  c.data_vigencia_fim
FROM itens_contrato ic
JOIN contratos c ON c.id = ic.contrato_id
WHERE ic.empresa_id = $empresa_id
  AND ic.deleted_at IS NULL
  AND (ic.quantidade_entregue::float / NULLIF(ic.quantidade, 0)) > 0.7;

-- Query 3: Contratos vencendo em 60 dias
SELECT
  numero_contrato, orgao_publico, data_vigencia_fim, status,
  DATE_PART('day', data_vigencia_fim::timestamp - NOW()) AS dias_restantes
FROM contratos
WHERE empresa_id = $empresa_id
  AND deleted_at IS NULL
  AND status = 'ativo'
  AND data_vigencia_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + 60;

-- Query 4: AFs pendentes com vencimento próximo
SELECT
  af.numero_af, af.quantidade_autorizada, af.saldo_af,
  af.data_vencimento,
  ic.descricao as item_descricao
FROM autorizacoes_fornecimento af
JOIN itens_contrato ic ON ic.id = af.item_id
WHERE af.empresa_id = $empresa_id
  AND af.status IN ('pendente', 'parcial')
  AND af.data_vencimento <= CURRENT_DATE + 30;
```

Esses resultados são **passados ao Claude como contexto estruturado** para geração da newsletter — a IA não acessa o banco diretamente, recebe apenas o JSON sanitizado.

---

### CAMADA 3: A VOZ — ESTRUTURA DA NEWSLETTER

**Formato de saída do Claude:**

```json
{
  "semana": "17–23 fev 2026",
  "empresa": "Nome da Empresa",
  "manchetes": [
    {
      "emoji": "🔴",
      "titulo": "ALERTA: Margem do Item 'Licença Microsoft' caiu para 8%",
      "resumo": "O IPCA de jan/26 (0,82%) elevou o custo estimado. Com base no índice IPCA acumulado (6,1% a.a.), solicite reajuste formal até 15/03 para evitar margem negativa.",
      "acao": "Protocolar pedido de reajuste — art. 65, II, 'd' da Lei 8.666",
      "urgencia": "alta"
    },
    {
      "emoji": "🟡",
      "titulo": "ATENÇÃO: Contrato 045/2024 vence em 38 dias",
      "resumo": "Contrato com Prefeitura de Campinas, R$ 2,1M, vence em 02/04/2026. 3 itens ainda têm saldo relevante.",
      "acao": "Verificar cláusula de prorrogação e preparar documentação",
      "urgencia": "media"
    }
  ],
  "checklist_semana": [
    "☐ Solicitar reajuste no Contrato 038/2024 (IPCA jan/26)",
    "☐ Emitir AF para Item 'Papel A4' — saldo esgota em ~15 dias",
    "☐ Monitorar edital SEAD/GO — perfil compatível com seu histórico"
  ],
  "oportunidades_pncp": [
    {
      "orgao": "SEAD/GO",
      "objeto": "Fornecimento de material de escritório",
      "valor_estimado": "R$ 450.000",
      "prazo_proposta": "10/03/2026",
      "link": "https://pncp.gov.br/..."
    }
  ],
  "indices_semana": {
    "ipca_mes": "+0,82%",
    "usd_brl": "R$ 5,87",
    "selic": "13,25% a.a.",
    "variacao_semana": "USD +1,2% / IPCA neutro"
  },
  "link_educacional": {
    "titulo": "Como calcular reajuste de contrato pelo IPCA",
    "url": "https://..."
  }
}
```

---

### IMPLEMENTAÇÃO TÉCNICA DO JOB

**Opção A: Vercel Cron (recomendado — zero infra)**
```json
// vercel.json — adicionar:
{
  "crons": [
    {
      "path": "/api/maestro/gerar",
      "schedule": "0 7 * * 1"
    }
  ]
}
```
Executa toda segunda-feira às 7h (horário UTC → 4h BRT).

**Opção B: Supabase pg_cron (alternativa)**
```sql
SELECT cron.schedule('maestro-semanal', '0 10 * * 1',
  'SELECT net.http_post(url:=''https://gestao-contratos.vercel.app/api/maestro/gerar'', ...)'
);
```

**API Route do job:**
```
POST /api/maestro/gerar
  → Para cada empresa ativa:
    1. Busca dados internos (queries SQL acima)
    2. Busca dados externos (PNCP + IBGE + BC)
    3. Consulta ai_insights_history (evitar repetir alertas)
    4. Chama Claude com prompt + contexto JSON
    5. Salva resultado em ai_insights
    6. (futuro) Envia email via Resend/SendGrid
```

---

### CAMADA 4: A MEMÓRIA — TABELA DE HISTÓRICO

**Migration necessária:**

```sql
-- MIGRATION 015: Tabelas para o Maestro

CREATE TABLE ai_insights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id),
  tipo        TEXT NOT NULL DEFAULT 'newsletter', -- 'newsletter' | 'alerta_margem' | 'oportunidade'
  periodo     TEXT NOT NULL,          -- '2026-W08' (ano-semana ISO)
  conteudo    JSONB NOT NULL,         -- JSON da newsletter gerado pelo Claude
  lido        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_insights_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id),
  tipo_alerta     TEXT NOT NULL,  -- 'margem_baixa' | 'contrato_vencendo' | 'oportunidade'
  referencia_id   UUID,           -- id do item/contrato/edital referenciado
  referencia_hash TEXT NOT NULL,  -- hash do conteúdo para deduplicação
  ignorado        BOOLEAN DEFAULT FALSE, -- usuário clicou "não me mostre mais"
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: isolamento multi-tenant
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_insights_empresa" ON ai_insights
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "ai_insights_history_empresa" ON ai_insights_history
  USING (empresa_id = get_user_empresa_id());
```

**Lógica de deduplicação:**
```typescript
// Antes de incluir um alerta no prompt, verificar:
const hash = crypto
  .createHash('md5')
  .update(`${tipo_alerta}:${referencia_id}:${periodo}`)
  .digest('hex')

const { data: jaExiste } = await supabase
  .from('ai_insights_history')
  .select('id')
  .eq('referencia_hash', hash)
  .eq('ignorado', false)
  .gte('created_at', subDays(new Date(), 14)) // evitar repetição em 14 dias
  .single()

if (jaExiste) continue // pula este alerta
```

---

### UI DA NEWSLETTER

**Rota:** `/dashboard/maestro`

```
┌────────────────────────────────────────────────────┐
│  🎯 DUO Maestro — Semana 17–23 fev 2026           │
│  Sua empresa | Gerado em 17/02 às 07:00             │
│  [Marcar como lido] [Gerar agora] [Configurar]      │
├────────────────────────────────────────────────────┤
│  🔴 CRÍTICO (1)                                     │
│  ████████████████████████████████████████████████  │
│  Margem do Item 'Licença Microsoft' caiu para 8%   │
│  [Ver item] [Protocolar reajuste]                  │
├────────────────────────────────────────────────────┤
│  🟡 ATENÇÃO (2)                                     │
│  ...                                               │
├────────────────────────────────────────────────────┤
│  📋 Checklist da Semana                            │
│  ☐ Solicitar reajuste no Contrato 038/2024         │
│  ☐ Emitir AF para Item 'Papel A4'                  │
├────────────────────────────────────────────────────┤
│  📡 Oportunidades no PNCP (3 editais compatíveis) │
│  ...                                               │
├────────────────────────────────────────────────────┤
│  📊 Índices da Semana                              │
│  IPCA +0,82% | USD R$5,87 | SELIC 13,25%          │
├────────────────────────────────────────────────────┤
│  📚 Artigo da Semana                               │
│  Como calcular reajuste pelo IPCA →               │
└────────────────────────────────────────────────────┘
```

---

## PILAR 3: SEGURANÇA E LGPD

### Isolamento Multi-tenant — Garantias Técnicas

**O que já existe (não precisa implementar):**
- RLS 100% implementado — queries sem `empresa_id` retornam apenas dados da empresa logada
- `get_user_empresa_id()` é a função central — chamada em todas as políticas

**O que o Maestro deve garantir adicionalmente:**

```typescript
// API Route do Maestro — NUNCA processar batch de empresas sem isolamento explícito:
const { data: usuario } = await supabase.from('usuarios').select('empresa_id').single()
const empresaId = usuario.empresa_id

// Todos os dados buscados usam o cliente autenticado (RLS ativo):
const { data: itens } = await supabase  // ← cliente com session do usuário
  .from('itens_contrato')
  .select('descricao, margem_atual, custo_medio')  // ← nunca buscar dados de outras empresas

// O que é enviado ao Claude: apenas campos necessários (mínimo suficiente)
const contextoParaClaude = itens.map(i => ({
  descricao: i.descricao,  // ✅ necessário para o alerta
  margem: i.margem_atual,  // ✅ necessário
  // ❌ NÃO enviar: id, empresa_id, cnpj_id, numero_contrato
}))
```

### Política de Dados Efêmeros

**O que garantir no código:**
1. PDFs enviados para extração de itens → **nunca persistidos** (processados em memória, descartados após resposta)
2. Contexto enviado ao Claude → dados agregados/anônimos quando possível (margens, percentuais — não nomes completos de fornecedores se desnecessário)
3. Chave `ANTHROPIC_API_KEY` → server-side only, nunca exposta ao cliente

**UI de Transparência (DPA Notice):**
```tsx
// Componente a ser exibido ao primeiro uso de cada feature de IA:
<Alert className="border-blue-200 bg-blue-50">
  <Shield className="h-4 w-4 text-blue-600" />
  <AlertTitle>Como seus dados são utilizados</AlertTitle>
  <AlertDescription>
    Este recurso envia os dados indicados ao Claude (Anthropic) para processamento.
    Os dados são utilizados de forma efêmera — não são armazenados ou usados para
    treinamento de modelos. Processamento realizado em conformidade com a LGPD.
    <a href="https://www.anthropic.com/privacy" target="_blank" className="underline ml-1">
      Política de privacidade Anthropic →
    </a>
  </AlertDescription>
</Alert>
```

---

## ROADMAP DE IMPLEMENTAÇÃO SUGERIDO

### Fase A — Botão IA Plus (2–3 dias de desenvolvimento)
```
Dia 1: API Route /api/ia/extrair-itens + integração Anthropic SDK
Dia 2: Modal de revisão + tabela editável + UX states
Dia 3: createBatch no service + testes com PDFs reais + DPA notice
```
**Dependência:** `ANTHROPIC_API_KEY` configurada no Vercel (já existe via Claude Code)

### Fase B — Infraestrutura Maestro (2 dias)
```
Dia 1: Migration 015 (ai_insights + ai_insights_history) + RLS
Dia 2: Queries SQL de alertas + integração IBGE/BC APIs
```

### Fase C — Geração da Newsletter (2 dias)
```
Dia 1: API Route /api/maestro/gerar + prompt engineering
Dia 2: Página /dashboard/maestro com renderização da newsletter
```

### Fase D — PNCP + Vercel Cron (1 dia)
```
Configurar Vercel Cron + integração PNCP + deduplicação ai_insights_history
```

### Fase E — Polish e Email (futuro)
```
Integração Resend para envio semanal por e-mail
Configurações do usuário (frequência, segmentos monitorados)
Feedback inline ("Este alerta foi útil?")
```

---

## REFERÊNCIAS TÉCNICAS

| Recurso | URL | Observação |
|---------|-----|------------|
| Anthropic API — Arquivos PDF | docs.anthropic.com/en/docs/build-with-claude/pdf-support | PDF nativo, sem library extra |
| Anthropic API — Modelos | docs.anthropic.com/en/docs/about-claude/models | claude-sonnet-4-6 = melhor precisão |
| PNCP API Swagger | pncp.gov.br/api/pncp/swagger-ui | Documentação oficial |
| IBGE Sidra API | servicodados.ibge.gov.br/api/docs | Séries IPCA/INPC |
| Banco Central SGS | olinda.bcb.gov.br/servico/SGS | SELIC/Câmbio |
| NewsAPI | newsapi.org/docs | Plano Free: 100 req/dia |
| Vercel Cron Jobs | vercel.com/docs/cron-jobs | Cron no vercel.json |
| Resend (email) | resend.com/docs | 3.000 emails/mês free |

---

## ESTIMATIVA DE CUSTOS MENSAIS (por empresa ativa)

| Item | Custo Estimado |
|------|---------------|
| Botão IA Plus — 20 extrações/mês | ~$0,15 (claude-sonnet-4-6) ou ~$0,01 (haiku) |
| Maestro — 4 newsletters/mês | ~$0,10–0,30 (4 × prompt médio) |
| PNCP, IBGE, BC | R$ 0,00 (APIs públicas) |
| NewsAPI | R$ 0,00 (plano free suficiente) |
| Vercel Cron | R$ 0,00 (incluído no plano atual) |
| **Total por empresa/mês** | **~$0,25–0,50** |

---

**Autor:** Blueprint gerado com análise do repositório real em 2026-02-23
**Próximo passo:** Implementar Fase A (Botão IA Plus) quando aprovado
