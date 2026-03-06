# ESTRATÉGIA MASTER - OCR AGENT SYSTEM
**Versão:** 1.0
**Data:** 08 Março 2026
**Status:** Planejamento (Implementação Sprint 3)
**Documento Vivo:** Será atualizado conforme novas ideias surgirem

---

## 🎯 VISÃO GERAL

OCR Agent DUO™ é um sistema de **extração inteligente de dados** de contratos PDF que:

1. **Extrai campos estruturados** de PDFs de contratos públicos
2. **Preenche formulário automaticamente** com dados extraídos
3. **Calcula confidence score** (0-100%) para cada campo
4. **Permite validação humana** antes de salvar
5. **Aprende com correções** para melhorar precisão

**Diferencial:** Não é OCR comum - é **extração contextual** que entende estrutura de contratos B2G.

---

## 🏗️ ARQUITETURA

```
[Upload PDF]
    ↓
[Pré-processamento] (conversão imagem, limpeza)
    ↓
[OCR Agent Claude] (extração contextual)
    ↓
[Estruturação Dados] (JSON com campos + confidence)
    ↓
[UI Preview] (formulário preenchido para validação)
    ↓
[Usuário Valida/Ajusta]
    ↓
[Salvar Contrato] (Supabase)
    ↓
[Learning Layer] (aprende com correções)
```

Tempo estimado: 10-30 segundos por PDF

---

## 📄 CAMPOS A EXTRAIR

### Campos Obrigatórios

```javascript
{
  "numero_contrato": "001/2025",           // String
  "orgao_nome": "Secretaria de Saúde SP",  // String
  "vigencia_inicio": "2025-01-15",         // Date (YYYY-MM-DD)
  "vigencia_fim": "2026-01-14",            // Date (YYYY-MM-DD)
  "valor_total": 450000.00,                // Float
  "modalidade": "Pregão Eletrônico"        // String
}
```

### Campos Opcionais (se disponíveis no PDF)

```javascript
{
  "cnpj_orgao": "12.345.678/0001-90",
  "municipio_contrato": "São Paulo",
  "estado_contrato": "SP",
  "objeto_contrato": "Aquisição de equipamentos médicos...",
  "processo_administrativo": "PA 123/2024",
  "garantia_contratual": 0.05,  // 5%
  "multa_rescisao": 0.10,       // 10%

  // Itens do contrato (se houver tabela no PDF)
  "itens": [
    {
      "descricao": "Equipamento X",
      "unidade": "UN",
      "quantidade": 10,
      "valor_unitario": 45000.00,
      "valor_total": 450000.00
    }
  ]
}
```

---

## 🤖 OCR AGENT (Claude)

### System Prompt

```
Você é um especialista em extração de dados de contratos públicos brasileiros.

Sua tarefa: analisar o PDF fornecido e extrair dados estruturados do contrato.

CAMPOS OBRIGATÓRIOS (sempre extrair):
- numero_contrato: número/identificação do contrato
- orgao_nome: órgão público contratante
- vigencia_inicio: data início vigência (formato YYYY-MM-DD)
- vigencia_fim: data fim vigência (formato YYYY-MM-DD)
- valor_total: valor total do contrato (apenas número, sem R$)
- modalidade: tipo de licitação (Pregão, Dispensa, Inexigibilidade, etc)

CAMPOS OPCIONAIS (extrair se disponível):
- cnpj_orgao, municipio_contrato, estado_contrato, objeto_contrato,
  processo_administrativo, garantia_contratual, multa_rescisao

ITENS DO CONTRATO (se houver tabela):
- Extrair cada item com: descricao, unidade, quantidade, valor_unitario, valor_total

REGRAS IMPORTANTES:
1. Retornar APENAS JSON válido (sem texto adicional)
2. Datas no formato YYYY-MM-DD
3. Valores numéricos sem formatação (450000.00 não "R$ 450.000,00")
4. Se campo não encontrado: usar null (não inventar dados)
5. Confidence score (0.0-1.0) para cada campo baseado em:
   - 1.0: certeza absoluta (texto explícito no PDF)
   - 0.8: alta confiança (inferido de contexto claro)
   - 0.5: média confiança (ambíguo, pode estar errado)
   - 0.3: baixa confiança (chute educado)
   - 0.0: não encontrado

FORMATO OUTPUT:
{
  "campos_extraidos": {
    "numero_contrato": { "valor": "...", "confidence": 0.95 },
    "orgao_nome": { "valor": "...", "confidence": 1.0 },
    ...
  },
  "itens": [...],
  "confidence_geral": 0.87
}
```

### Exemplo de Chamada

```javascript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 4096,
  temperature: 0.1,  // Baixa = mais determinístico
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: pdfBase64
          }
        },
        {
          type: 'text',
          text: 'Extraia os dados deste contrato público conforme as instruções.'
        }
      ]
    }
  ],
  system: OCR_SYSTEM_PROMPT
})

const resultado = JSON.parse(response.content[0].text)
```

### Tratamento de Erros

```javascript
async function extractContractData(pdfBuffer) {
  try {
    const pdfBase64 = pdfBuffer.toString('base64')

    const response = await anthropic.messages.create({...})
    const raw = response.content[0].text

    // Validar que é JSON válido
    const dados = JSON.parse(raw)

    // Validar estrutura mínima
    if (!dados.campos_extraidos || !dados.confidence_geral) {
      throw new Error('Resposta inválida do OCR Agent')
    }

    return { sucesso: true, dados }

  } catch (err) {
    if (err instanceof SyntaxError) {
      // Claude não retornou JSON válido
      return {
        sucesso: false,
        erro: 'OCR retornou formato inválido',
        fallback: 'cadastro_manual'
      }
    }

    if (err.status === 429) {
      // Rate limit
      return {
        sucesso: false,
        erro: 'Sistema sobrecarregado, tente em 30 segundos',
        retry: true
      }
    }

    return {
      sucesso: false,
      erro: err.message,
      fallback: 'cadastro_manual'
    }
  }
}
```

---

## 🖥️ UI PREVIEW (Formulário com Confidence)

### Wireframe

```
┌─────────────────────────────────────────────────────────┐
│  📄 Contrato Extraído — Revise e Confirme               │
│                                                         │
│  Confidence Geral: ████████░░ 82%                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Número do Contrato     ✓ 95%                    │    │
│  │ [001/2025             ]                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Órgão Contratante      ✓ 100%                   │    │
│  │ [Secretaria de Saúde SP]                        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Valor Total            ⚠️ 55%  — Verificar!     │    │
│  │ [R$ 450.000,00        ]                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Vigência Fim           ❌ 0%   — Não encontrado │    │
│  │ [                     ]  ← preencher            │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│     Campos marcados com ⚠️ precisam revisão            │
│                                                         │
│  ☐ Confirmo que revisei todos os campos                │
│                                                         │
│  [ ← Voltar ]  [ Editar Tudo ]  [ Salvar Contrato → ] │
└─────────────────────────────────────────────────────────┘
```

### Indicadores Visuais por Confidence

```javascript
const getConfidenceIndicator = (confidence) => {
  if (confidence >= 0.9) {
    return {
      icon: '✓',
      color: 'green',
      label: `${(confidence * 100).toFixed(0)}%`,
      message: 'Alta confiança'
    }
  } else if (confidence >= 0.7) {
    return {
      icon: '⚠️',
      color: 'yellow',
      label: `${(confidence * 100).toFixed(0)}%`,
      message: 'Verificar campo'
    }
  } else {
    return {
      icon: '❌',
      color: 'red',
      label: `${(confidence * 100).toFixed(0)}%`,
      message: 'REVISAR - Baixa confiança'
    }
  }
}
```

### Componente React (Estrutura)

```tsx
interface OCRPreviewProps {
  dadosExtraidos: CamposExtraidos
  onConfirm: (dadosValidados: DadosContrato) => void
  onCancel: () => void
}

export function OCRPreview({ dadosExtraidos, onConfirm, onCancel }: OCRPreviewProps) {
  const [campos, setCampos] = useState(dadosExtraidos)
  const [revisado, setRevisado] = useState(false)

  const camposAlerta = Object.entries(campos.campos_extraidos)
    .filter(([_, v]) => v.confidence < 0.7)

  const handleSalvar = () => {
    if (!revisado) {
      toast.warning('Confirme que revisou todos os campos')
      return
    }
    onConfirm(extrairValores(campos))
  }

  return (
    <div className="space-y-4">
      <ConfidenceBar valor={campos.confidence_geral} />

      {camposAlerta.length > 0 && (
        <Alert variant="warning">
          {camposAlerta.length} campo(s) precisam de revisão
        </Alert>
      )}

      {Object.entries(campos.campos_extraidos).map(([campo, dados]) => (
        <CampoComConfidence
          key={campo}
          nome={campo}
          valor={dados.valor}
          confidence={dados.confidence}
          onChange={(novoValor) => atualizarCampo(campo, novoValor)}
        />
      ))}

      <Checkbox
        checked={revisado}
        onCheckedChange={setRevisado}
        label="Confirmo que revisei todos os campos"
      />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel}>← Voltar</Button>
        <Button onClick={handleSalvar} disabled={!revisado}>
          Salvar Contrato →
        </Button>
      </div>
    </div>
  )
}
```

---

## 🧠 LEARNING LAYER (Melhoria Contínua)

### Conceito

A cada contrato processado, sistema aprende com as correções do usuário.

### Schema: Tabela ocr_learning (Supabase)

```sql
CREATE TABLE ocr_learning (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id),
  pdf_hash VARCHAR(64),  -- SHA-256 do PDF (evitar reprocessar)

  -- Dados extraídos pelo OCR
  dados_extraidos JSONB NOT NULL,

  -- Correções feitas pelo usuário
  correcoes_usuario JSONB,

  -- Métricas
  confidence_inicial FLOAT,
  campos_corretos INTEGER,
  campos_incorretos INTEGER,
  precisao FLOAT,  -- campos_corretos / total_campos

  -- Feedback implícito
  usuario_editou_tudo BOOLEAN,  -- true = OCR falhou muito
  tempo_validacao_segundos INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ocr_empresa ON ocr_learning(empresa_id);
CREATE INDEX idx_ocr_precisao ON ocr_learning(precisao);
```

### Exemplo de Registro

```javascript
{
  "pdf_hash": "a1b2c3d4...",
  "dados_extraidos": {
    "numero_contrato": { "valor": "001/2025", "confidence": 0.95 },
    "valor_total": { "valor": 450000, "confidence": 0.50 }
  },
  "correcoes_usuario": {
    "valor_total": {
      "valor_ocr": 450000,
      "valor_correto": 500000,
      "corrigido": true
    }
  },
  "confidence_inicial": 0.87,
  "campos_corretos": 5,
  "campos_incorretos": 1,
  "precisao": 0.83,
  "usuario_editou_tudo": false,
  "tempo_validacao_segundos": 45
}
```

### Como o Sistema Aprende

```javascript
async function analisarPrecisaoOCR(empresaId) {
  const historico = await supabase
    .from('ocr_learning')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .limit(50)

  const metricas = {
    precisao_media: historico.avg('precisao'),
    campos_mais_errados: [
      { campo: 'valor_total', taxa_erro: 0.40 },
      { campo: 'vigencia_fim', taxa_erro: 0.15 }
    ],
    evolucao: {
      primeira_semana: 0.65,
      ultima_semana: 0.87
    }
  }

  // Ajustar system prompt baseado em erros comuns
  if (metricas.campos_mais_errados[0].campo === 'valor_total') {
    // Adicionar instrução extra no prompt:
    // "ATENÇÃO ESPECIAL ao campo valor_total - buscar por
    //  'valor global', 'valor total do contrato', etc"
  }

  return metricas
}
```

---

## 🎯 CASOS DE USO & EXEMPLOS

### Caso 1: PDF Limpo (Confidence Alta)

```
INPUT: PDF digitalizado de contrato padrão
OUTPUT:
{
  "numero_contrato": { "valor": "001/2025", "confidence": 0.98 },
  "orgao_nome": { "valor": "Prefeitura Municipal SP", "confidence": 1.0 },
  "vigencia_inicio": { "valor": "2025-01-15", "confidence": 0.95 },
  "vigencia_fim": { "valor": "2026-01-14", "confidence": 0.95 },
  "valor_total": { "valor": 450000.00, "confidence": 0.92 },
  "modalidade": { "valor": "Pregão Eletrônico", "confidence": 1.0 },
  "confidence_geral": 0.97
}

AÇÃO USUÁRIO: Apenas revisar rapidamente e salvar (< 30s)
```

### Caso 2: PDF Escaneado (Confidence Média)

```
INPUT: Foto/scan de contrato (qualidade média)
OUTPUT:
{
  "numero_contrato": { "valor": "001/2025", "confidence": 0.85 },
  "orgao_nome": { "valor": "Sec. Saúde SP", "confidence": 0.80 },
  "vigencia_inicio": { "valor": "2025-01-15", "confidence": 0.70 },
  "vigencia_fim": { "valor": null, "confidence": 0.0 },
  "valor_total": { "valor": 450000.00, "confidence": 0.55 },
  "modalidade": { "valor": "Pregão", "confidence": 0.75 },
  "confidence_geral": 0.61
}

AÇÃO USUÁRIO: Revisar campos ⚠️ amarelos, preencher vigencia_fim manualmente (~2min)
```

### Caso 3: PDF Complexo (Confidence Baixa)

```
INPUT: Contrato manuscrito ou formato não-padrão
OUTPUT:
{
  "numero_contrato": { "valor": null, "confidence": 0.0 },
  "orgao_nome": { "valor": "Secretaria", "confidence": 0.40 },
  "vigencia_inicio": { "valor": null, "confidence": 0.0 },
  "vigencia_fim": { "valor": null, "confidence": 0.0 },
  "valor_total": { "valor": null, "confidence": 0.0 },
  "modalidade": { "valor": null, "confidence": 0.0 },
  "confidence_geral": 0.07
}

AÇÃO USUÁRIO: Formulário quase vazio - preencher manualmente (5-10min)
SISTEMA: Registra falha, sugere "Cadastro manual mais rápido"
```

---

## 📊 MÉTRICAS DE SUCESSO

```javascript
{
  "metricas_performance": {
    "tempo_medio_processamento": 18,  // segundos
    "taxa_sucesso": 0.85,
    "confidence_media": 0.82,
    "precisao_media": 0.88
  },

  "metricas_ux": {
    "tempo_medio_validacao": 45,   // segundos (vs 5-10min manual)
    "economia_tempo": 0.85,        // 85% mais rápido que manual
    "taxa_uso_ocr": 0.70,          // 70% dos usuários usam OCR
    "satisfacao_nps": 8.5
  },

  "evolucao_aprendizado": {
    "precisao_mes_1": 0.65,
    "precisao_mes_6": 0.88,
    "campos_problematicos": ["valor_total", "vigencia_fim"]
  }
}
```

---

## 🚀 ROADMAP IMPLEMENTAÇÃO (Sprint 3)

### Semana 1: Backend OCR
- [ ] Integração Anthropic API (PDF input)
- [ ] System prompt otimizado
- [ ] Tabela ocr_learning (Supabase)
- [ ] API endpoint `/api/ocr/extract-contract`

### Semana 2: UI Upload & Preview
- [ ] Componente upload PDF (drag & drop)
- [ ] Loading state (progress bar)
- [ ] Preview formulário com confidence indicators
- [ ] Validação campos obrigatórios

### Semana 3: Learning Layer
- [ ] Registro correções usuário
- [ ] Análise precisão por campo
- [ ] Dashboard métricas OCR (admin)
- [ ] Ajuste automático prompts

### Semana 4: Testes & Refinamento
- [ ] Testar 50+ PDFs reais
- [ ] Ajustar system prompt baseado em erros
- [ ] Otimizar performance (< 20s)
- [ ] Documentação usuário final

---

## ⚠️ LIMITAÇÕES CONHECIDAS

### O que o OCR NÃO faz

```
❌ PDFs protegidos por senha
❌ PDFs 100% ilegíveis (manuscrito ruim, scan péssimo)
❌ Contratos em idiomas estrangeiros (apenas PT-BR)
❌ Documentos que não são contratos (atas, ofícios, etc)
❌ Garantir 100% de precisão (sempre precisa validação humana)
```

### Fallback: Cadastro Manual

```
Se confidence_geral < 0.40:
  Mostrar mensagem:
  "Este PDF é complexo demais para extração automática.
   Recomendamos cadastro manual para economizar tempo."

  Opções:
  [ Tentar Mesmo Assim ]  [ Cadastro Manual → ]
```

---

## 💡 IDEIAS FUTURAS (Pós-Sprint 3)

```
1. OCR Multi-páginas (extrair múltiplos contratos de um PDF grande)
2. Reconhecimento de assinaturas (detectar se contrato foi assinado)
3. Extração de cláusulas críticas (multas, garantias, reajustes)
4. Comparação contrato vs contrato renovado (detectar mudanças)
5. OCR de Notas Fiscais (cadastro automático de pagamentos)
6. API pública para integrações externas
```

---

## 📝 NOTA FINAL

**Este documento é VIVO** - será atualizado durante Sprint 3 com:
- Ajustes no system prompt baseados em testes com PDFs reais
- Novos campos identificados como relevantes
- Otimizações de performance descobertas
- Feedback de usuários em produção

**Versão:** 1.0 (08 Março 2026)
**Próxima revisão:** Início Sprint 3
**Owner:** Sistema DUO Governance

**SEMPRE consultar versão mais recente antes de implementar.**

---

**FIM DO DOCUMENTO MASTER**
