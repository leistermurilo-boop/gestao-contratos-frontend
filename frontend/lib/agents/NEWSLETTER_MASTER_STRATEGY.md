# ESTRATÉGIA MASTER - NEWSLETTER AGENTS SYSTEM
**Versão:** 1.1
**Data:** 08 Março 2026
**Status:** Planejamento (Implementação Sprint 4)
**Documento Vivo:** Será atualizado conforme novas ideias surgirem

---

## 🎯 VISÃO GERAL

Sistema de Newsletter DUO™ é um **pipeline multi-agente de análise inteligente** que:

1. **Transforma dados brutos em insights estratégicos** via cruzamento massivo de fontes
2. **Cruza informações internas com APIs macro + microeconômicas** (IBGE, PNCP, Bacen, IPCA, News)
3. **Educa o cliente** sobre conceitos de gestão B2G (contexto educacional em cada insight)
4. **Aprende continuamente** sobre o negócio do cliente (memória persistente evolutiva)
5. **Cria dependência estratégica** através de valor insubstituível (lock-in por conhecimento)

**Diferencial:** Não é "relatório de contratos" - é **consultoria IA personalizada + educação contínua + aprendizado sobre o cliente**.

**Natureza das Recomendações:** Sistema gera **dicas baseadas em dados cruzados**, NÃO regras de negócio. Não assume riscos - decisões são sempre do empresário.

---

## 🏗️ ARQUITETURA (3 Agents + Learning Layer)

```
[AGENT 1: Data Collector + Learning]
    ↓ Dataset Massivo + Contexto Histórico Empresa

[AGENT 2: Insight Analyzer + External APIs + Educator]
    ↓ Insights Cruzados + Padrões Aprendidos + Contexto Educacional

[AGENT 3: AIOS Content Writer + Educator]
    ↓ Newsletter HTML Personalizada + Educação + Disclaimers

[Learning Layer: Memória Persistente]
    ↑ Retroalimentação Contínua (melhora a cada newsletter)
```

Tempo estimado por empresa: 25-40 minutos (pipeline completo)
Agendamento: Domingo 20h (gera) → Segunda 8h (envia)

---

## 🤖 AGENT 1: DATA COLLECTOR + LEARNING LAYER

### Responsabilidade Principal

- Coleta massiva de dados internos da empresa (Supabase)
- Construção de perfil evolutivo (aprende sobre o negócio ao longo do tempo)
- Validação de insights históricos (o que recomendamos funcionou?)

### 1.1 Coleta de Dados Internos (Supabase)

**Contratos Completos**
```sql
SELECT
  c.*,
  COUNT(i.id) as total_itens,
  SUM(i.quantidade * i.valor_unitario) as valor_total_calculado,
  c.margem_media,
  c.vigencia_inicio,
  c.vigencia_fim
FROM contratos c
LEFT JOIN itens_contrato i ON i.contrato_id = c.id
WHERE c.empresa_id = :empresa_id
GROUP BY c.id
ORDER BY c.valor_total DESC
```

**Itens de Contratos (Granularidade Máxima)**
```sql
SELECT
  i.descricao as material,
  i.unidade,
  i.quantidade,
  i.valor_unitario,
  i.valor_total,
  c.orgao_nome,
  c.municipio_contrato,
  c.estado_contrato,
  c.numero_contrato,
  c.vigencia_inicio,
  c.vigencia_fim,
  c.margem_media
FROM itens_contrato i
JOIN contratos c ON c.id = i.contrato_id
WHERE c.empresa_id = :empresa_id
ORDER BY i.valor_total DESC
```

### 1.2 Análises Derivadas

**Portfolio de Materiais/Produtos**
```javascript
{
  "portfolio_materiais": [
    {
      "material": "Equipamento médico X",
      "categorias": ["saúde", "tecnologia"],
      "total_contratos": 12,
      "valor_total": 1500000,
      "share_portfolio": 35.5,
      "margem_media": 12.8,
      "tendencia_margem": "decrescente",
      "primeiro_contrato": "2024-03-15",
      "ultimo_contrato": "2026-02-20"
    },
    {
      "material": "Material Y",
      "total_contratos": 8,
      "valor_total": 800000,
      "share_portfolio": 19.2,
      "margem_media": 15.3,
      "tendencia_margem": "estavel"
    }
  ],
  "concentracao_portfolio": {
    "top_3_materiais_share": 0.68,
    "risco_concentracao": "alto"
  }
}
```

**Regiões de Atuação Geográfica**
```javascript
{
  "regioes_atuacao": [
    {
      "estado": "SP",
      "municipios": ["São Paulo", "Campinas", "Santos"],
      "total_contratos": 25,
      "valor_total": 2300000,
      "share_geografico": 45.2,
      "margem_media_estado": 11.8,
      "orgaos_atendidos": [
        "Prefeitura SP",
        "Secretaria Saúde SP",
        "Hospital das Clínicas"
      ]
    },
    {
      "estado": "RJ",
      "municipios": ["Rio de Janeiro", "Niterói"],
      "total_contratos": 8,
      "valor_total": 800000,
      "share_geografico": 15.7,
      "margem_media_estado": 13.2
    }
  ]
}
```

**Perfil de Clientes (Órgãos Públicos)**
```javascript
{
  "perfil_clientes": [
    {
      "orgao": "Secretaria de Saúde SP",
      "tipo": "estadual",
      "total_contratos_historico": 5,
      "contratos_ativos": 3,
      "valor_total_historico": 1200000,
      "ticket_medio": 240000,
      "frequencia_renovacao": "alta",
      "taxa_sucesso_renovacao": 0.80,
      "margem_media_orgao": 12.5,
      "ultimo_contrato": "2025-11-20"
    }
  ]
}
```

**Análise Temporal e Sazonalidade**
```javascript
{
  "analise_temporal": {
    "contratos_proximos_vencimento": {
      "15_dias": 3,
      "30_dias": 5,
      "60_dias": 7,
      "90_dias": 12,
      "valor_total_risco": 1500000
    },
    "sazonalidade_detectada": {
      "mes_maior_volume": "Dezembro",
      "mes_menor_volume": "Fevereiro",
      "razao": "Ciclo orçamentário público (fim de ano)",
      "confianca": 0.92
    }
  }
}
```

**Alertas Internos Críticos**
```javascript
{
  "alertas_criticos": [
    {
      "tipo": "margem_baixa",
      "contratos_afetados": 5,
      "numeros_contratos": ["001/2025", "045/2025"],
      "valor_total": 450000,
      "margem_media": 6.2,
      "acao_recomendada": "Revisar precificação ou renegociar fornecedores"
    },
    {
      "tipo": "erosao",
      "contratos_afetados": 2,
      "valor_total": 180000,
      "margem_media": -2.5,
      "acao_recomendada": "URGENTE: Renegociar ou encerrar (prejuízo)"
    },
    {
      "tipo": "vencimento_massivo",
      "periodo": "próximos 30 dias",
      "contratos_afetados": 5,
      "valor_total": 1200000,
      "acao_recomendada": "Iniciar processos de renovação imediatamente"
    }
  ]
}
```

### 1.3 LEARNING LAYER (Memória Persistente) 🧠

Conceito: Sistema aprende sobre a empresa a cada newsletter gerada.

**Schema: Tabela empresa_intelligence (Supabase)**
```sql
CREATE TABLE empresa_intelligence (
  empresa_id UUID PRIMARY KEY REFERENCES empresas(id),
  perfil_evolutivo JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Estrutura do Perfil Evolutivo**
```javascript
{
  "empresa_id": "uuid-da-empresa",
  "perfil_evolutivo": {
    "primeira_analise": "2026-03-08",
    "ultima_analise": "2027-03-01",
    "total_analises": 52,

    "comportamento_renovacao": {
      "prazo_medio_inicio_negociacao": 45,
      "taxa_sucesso_renovacao": 0.78,
      "orgaos_maior_taxa_renovacao": [
        "Secretaria Saúde SP",
        "HCFMUSP"
      ],
      "contratos_sempre_renovados": ["001/2024", "012/2024"],
      "contratos_nunca_renovados": ["033/2024"]
    },

    "evolucao_portfolio": {
      "materiais_abandonados": [
        {
          "material": "Material X",
          "ultima_venda": "2025-08-15",
          "motivo_inferido": "margem negativa contínua"
        }
      ],
      "materiais_crescimento": [
        {
          "material": "Equipamento Y",
          "crescimento_12m": 0.35,
          "margem_tendencia": "crescente",
          "valor_atual": 1500000
        }
      ],
      "novos_materiais_adicionados": [
        {
          "material": "Equipamento Z",
          "data_primeiro_contrato": "2026-11-10",
          "performance_inicial": "promissora"
        }
      ]
    },

    "padroes_sazonais": {
      "meses_maior_volume": ["Novembro", "Dezembro"],
      "meses_menor_volume": ["Janeiro", "Fevereiro"],
      "razao_detectada": "Ciclo orçamentário público anual",
      "confianca_padrao": 0.92,
      "anos_observados": 2
    },

    "sensibilidade_macro": {
      "ipca_correlacao": 0.82,
      "selic_impacto": "baixo",
      "cambio_impacto": "zero",
      "pib_municipal_correlacao": 0.65
    },

    "insights_historicos_validados": [
      {
        "data_insight": "2025-11-15",
        "insight": "Iniciar renovação Contrato 001/2025 com 60 dias antecedência",
        "acao_tomada_cliente": true,
        "data_acao": "2025-11-16",
        "resultado": "Renovação aprovada sem licitação em 45 dias",
        "valor_gerado_estimado": 450000,
        "validado": true
      },
      {
        "data_insight": "2026-01-20",
        "insight": "Aplicar reajuste IPCA de 4.6% em renovações",
        "acao_tomada_cliente": true,
        "resultado": "Margem preservada em 3 contratos renovados",
        "valor_gerado_estimado": 234000,
        "validado": true
      },
      {
        "data_insight": "2026-02-10",
        "insight": "Participar Pregão 001/2026 Sec. Saúde (match 87%)",
        "acao_tomada_cliente": false,
        "resultado": "Não participou (razão desconhecida)",
        "validado": false
      }
    ],

    "preferencias_cliente": {
      "taxa_abertura_email": 0.92,
      "taxa_leitura_completa": 0.68,
      "secoes_mais_clicadas": [
        "Radar B2G",
        "Insights Macro",
        "Contexto Educacional"
      ],
      "secoes_menos_lidas": ["Glossário"],
      "acoes_mais_tomadas": [
        "Renovações antecipadas",
        "Participação em licitações sugeridas"
      ],
      "conceitos_educacionais_aplicados": [
        "reajuste_ipca",
        "margem_saudavel"
      ]
    },

    "metricas_aprendizado": {
      "precisao_insights": 0.89,
      "taxa_acao_cliente": 0.76,
      "roi_demonstrado_12m": 2234000,
      "confianca_sistema": "alta"
    }
  }
}
```

**Como o Agent 1 Aprende (Lógica de Atualização)**
```javascript
async function updateLearningLayer(empresaId, dataset_atual, acoes_cliente) {
  const perfil_anterior = await getPerfilEvolutivo(empresaId)

  // 1. DETECTAR NOVOS PADRÕES
  const novos_padroes = {
    comportamento: detectBehaviorPatterns(dataset_atual, perfil_anterior),
    sazonalidade: detectSeasonality(dataset_atual, perfil_anterior),
    sensibilidade: detectMacroSensitivity(dataset_atual, perfil_anterior)
  }

  // 2. VALIDAR INSIGHTS ANTERIORES
  const validacao = await validatePastInsights(empresaId, acoes_cliente, {
    contratos_renovados: dataset_atual.contratos_renovados,
    licitacoes_participadas: dataset_atual.licitacoes_participadas,
    reajustes_aplicados: dataset_atual.reajustes_aplicados
  })

  // 3. AJUSTAR PRECISÃO FUTURA
  if (validacao.prazo_medio_real_cliente > perfil_anterior.comportamento_renovacao.prazo_medio) {
    perfil_anterior.comportamento_renovacao.prazo_medio_inicio_negociacao =
      validacao.prazo_medio_real_cliente
  }

  // 4. ATUALIZAR PERFIL EVOLUTIVO
  const perfil_atualizado = {
    ...perfil_anterior,
    total_analises: perfil_anterior.total_analises + 1,
    ultima_analise: new Date().toISOString(),
    ...novos_padroes,
    insights_historicos_validados: [
      ...perfil_anterior.insights_historicos_validados,
      ...validacao.novos_insights_validados
    ],
    metricas_aprendizado: calculateMetrics(perfil_anterior, validacao)
  }

  await supabase
    .from('empresa_intelligence')
    .upsert({ empresa_id: empresaId, perfil_evolutivo: perfil_atualizado })

  return perfil_atualizado
}
```

### 1.4 Output do Agent 1

```javascript
{
  "dataset_atual": {
    "contratos": [...],
    "portfolio": {...},
    "regioes": {...},
    "alertas": [...]
  },

  "contexto_historico": {
    "total_semanas_analisadas": 52,
    "padroes_conhecidos": {
      "renovacao": {...},
      "sazonalidade": {...},
      "portfolio": {...}
    },
    "insights_validados_passado": [...],
    "nivel_conhecimento_empresa": "avançado"
  }
}
```

Tamanho estimado: 200-500 KB JSON

---

## 🤖 AGENT 2: INSIGHT ANALYZER + EXTERNAL APIs + EDUCATOR

### Responsabilidade Principal

- Cruzar dados internos (Agent 1) com APIs externas (macro + micro)
- Gerar insights acionáveis fundamentados em dados
- Adicionar contexto educacional a cada insight (ensinar o cliente)

### 2.1 APIs Externas a Integrar

**API 1: IBGE (Dados Econômicos Regionais)**

Base URL: `https://servicodados.ibge.gov.br/api/v3/`

```javascript
// PIB Municipal
GET /agregados/5938/periodos/2023/variaveis/37?localidades=N6[3550308]

// População
GET /agregados/6579/periodos/2023/variaveis/9324?localidades=N6[3550308]

// PIB per capita (calculado)
pib_per_capita = pib_municipal / populacao
```

Uso no Sistema:
```javascript
for (regiao of empresa.regioes_atuacao) {
  const dados_ibge = await IBGE.getDadosMunicipio(regiao.municipio)
  const share_empresa = regiao.valor_total / dados_ibge.pib_municipal

  if (share_empresa < 0.001) {
    insights.push({
      tipo: "oportunidade_crescimento",
      titulo: `Potencial inexplorado em ${regiao.municipio}`,
      dados: {
        pib_municipal: dados_ibge.pib_municipal,
        populacao: dados_ibge.populacao,
        share_atual: share_empresa,
        valor_atual_empresa: regiao.valor_total
      },
      acao: `Prospectar mais órgãos nesta região (PIB R$ ${dados_ibge.pib_municipal})`
    })
  }
}
```

**API 2: IPCA (Inflação Oficial Brasil)**

Base URL: `https://servicodados.ibge.gov.br/api/v3/agregados/1737/`

```javascript
// IPCA Geral (12 meses)
GET /periodos/202401-202412/variaveis/2265

// IPCA por Grupo (ex: Saúde e cuidados pessoais)
GET /agregados/7060/periodos/202401-202412/variaveis/63?classificacao=315[7170]
```

Uso no Sistema:
```javascript
const ipca_geral = await IPCA.getAcumulado12Meses()
const ipca_setor = await IPCA.getGrupo(empresa.setor)

if (empresa.margem_atual < empresa.margem_ano_anterior) {
  const perda_margem = empresa.margem_ano_anterior - empresa.margem_atual

  if (ipca_geral > perda_margem) {
    insights.push({
      tipo: "alerta_precificacao",
      titulo: "Margem caiu mais que IPCA - precificação defasada",
      dados: {
        ipca_12m: ipca_geral,
        ipca_setor: ipca_setor,
        margem_perda: perda_margem,
        gap: ipca_geral - perda_margem
      },
      acao: `Reajustar preços em +${ipca_geral}% nas renovações`,
      valor_recuperavel: calcularValorRecuperavel(empresa, ipca_geral)
    })
  }
}
```

**API 3: PNCP (Portal Nacional de Contratações Públicas)**

Base URL: `https://pncp.gov.br/api/`

```javascript
// Licitações abertas por município
GET /consulta/v1/contratos-compras
  ?dataInicial=2026-03-01
  &municipio=São Paulo
  &objeto=equipamento médico

// Licitações de órgão específico
GET /consulta/v1/orgaos/:orgao_id/contratos
  ?modalidade=pregao
  &situacao=em_andamento
```

Uso no Sistema (Radar B2G™):
```javascript
for (material of empresa.portfolio_materiais) {
  const editais = await PNCP.searchEditais({
    objeto: material.descricao,
    regioes: empresa.regioes_atuacao.map(r => r.municipios).flat(),
    data_abertura_futura: 30
  })

  const editais_com_match = editais.map(edital => ({
    ...edital,
    match_score: calculateMatchScore(material, edital),
    razao_participar: generateParticipationReason(empresa, edital)
  }))

  const oportunidades = editais_com_match.filter(e => e.match_score > 0.70)

  insights.push({
    tipo: "radar_b2g",
    material: material.descricao,
    oportunidades: oportunidades,
    total_valor_oportunidades: oportunidades.sum(e => e.valor_estimado)
  })
}
```

**API 4: Bacen (Banco Central - Selic, Câmbio)**

Base URL: `https://api.bcb.gov.br/dados/serie/`

```javascript
// Selic (meta)
GET /bcdata.sgs.432/dados/ultimos/12

// Câmbio USD/BRL
GET /bcdata.sgs.1/dados/ultimos/30
```

Uso no Sistema:
```javascript
const selic_atual = await Bacen.getSelicAtual()
const tendencia_selic = await Bacen.getTendenciaSelic()

if (empresa.tem_divida || empresa.planejando_expansao) {
  insights.push({
    tipo: "contexto_macro",
    titulo: tendencia_selic === 'queda'
      ? "Selic em queda - momento favorável para investir"
      : "Selic em alta - custo capital maior",
    dados: {
      selic_atual: selic_atual,
      tendencia: tendencia_selic
    },
    acao: tendencia_selic === 'queda'
      ? "Considerar investimentos em expansão (custo capital menor)"
      : "Postergar investimentos não essenciais"
  })
}
```

**API 5: News APIs (Contexto de Mercado)**

Fontes: Google News API, RSS Valor Econômico, Portal Gov.br/Notícias

```javascript
const noticias = await News.search({
  keywords: [empresa.setor, ...empresa.portfolio_materiais.map(m => m.material)],
  data_recente: 7,
  relevancia_minima: 0.70
})

const noticias_relevantes = noticias.filter(n => {
  return calculateRelevanceScore(n, empresa) > 0.70
})

insights.push({
  tipo: "contexto_mercado",
  noticias: noticias_relevantes.map(n => ({
    titulo: n.titulo,
    fonte: n.fonte,
    data: n.data,
    relevancia: n.relevancia_score,
    impacto_previsto: predictImpact(n, empresa)
  }))
})
```

### 2.2 Lógica de Cruzamento de Dados (Exemplos)

**Exemplo 1: Erosão de Margem + IPCA**
```javascript
for (contrato of contratos_com_margem_decrescente) {
  const ipca_periodo = await IPCA.getAcumuladoBetween(
    contrato.vigencia_inicio,
    new Date()
  )

  const perda_margem = contrato.margem_inicial - contrato.margem_atual

  if (perda_margem > ipca_periodo) {
    insights.push({
      tipo: "alerta_gestao",
      contrato: contrato.numero_contrato,
      titulo: "Margem caiu além da inflação - possível desperdício",
      dados: {
        margem_inicial: contrato.margem_inicial,
        margem_atual: contrato.margem_atual,
        perda_margem: perda_margem,
        ipca_periodo: ipca_periodo,
        excesso_perda: perda_margem - ipca_periodo
      },
      acao: "Revisar custos operacionais deste contrato - perda além da inflação indica ineficiência"
    })
  } else if (ipca_periodo > perda_margem) {
    insights.push({
      tipo: "alerta_precificacao",
      contrato: contrato.numero_contrato,
      titulo: "Margem não acompanhou IPCA - precificação defasada",
      dados: {...},
      acao: "Propor reajuste contratual baseado em IPCA"
    })
  }
}
```

**Exemplo 2: Região Atuação + PIB Municipal**
```javascript
for (regiao of empresa.regioes_atuacao) {
  const pib_municipal = await IBGE.getPIB(regiao.municipio)
  const share_empresa = (regiao.valor_total / pib_municipal) * 100

  if (share_empresa < 0.01) {
    insights.push({
      tipo: "oportunidade_crescimento",
      titulo: `Potencial inexplorado em ${regiao.municipio}`,
      dados: {
        municipio: regiao.municipio,
        pib_municipal: pib_municipal,
        share_atual: share_empresa,
        contratos_atuais: regiao.total_contratos,
        valor_atual: regiao.valor_total
      },
      acao: `Prospectar mais órgãos nesta região. PIB de R$ ${formatCurrency(pib_municipal)} indica mercado maior que seu share de ${share_empresa.toFixed(3)}%`,
      potencial_estimado: pib_municipal * 0.001
    })
  }
}
```

**Exemplo 3: Material Portfolio + Radar B2G (PNCP)**
```javascript
for (material of empresa.portfolio_materiais.top(5)) {
  const editais_abertos = await PNCP.searchEditais({
    objeto_contem: material.descricao,
    municipios: empresa.regioes_atuacao,
    status: 'aberto',
    data_abertura: { min: 'hoje', max: '+30 dias' }
  })

  const editais_alto_match = editais_abertos.filter(edital => {
    const match_score = calculateSimilarity(material.descricao, edital.objeto)
    return match_score > 0.80
  })

  if (editais_alto_match.length > 0) {
    insights.push({
      tipo: "radar_b2g",
      material: material.descricao,
      oportunidades: editais_alto_match.map(edital => ({
        numero: edital.numero,
        orgao: edital.orgao,
        objeto: edital.objeto,
        valor_estimado: edital.valor,
        data_abertura: edital.data_abertura,
        municipio: edital.municipio,
        match_score: edital.match_score,
        razao_participar: [
          `Alto match (${(edital.match_score * 100).toFixed(0)}%) com seu portfolio`,
          `Valor R$ ${formatCurrency(edital.valor)} compatível com seu ticket médio`,
          edital.orgao in empresa.clientes_historico
            ? "Cliente atual seu - histórico positivo"
            : "Novo cliente potencial"
        ]
      })),
      total_valor_oportunidades: editais_alto_match.sum(e => e.valor)
    })
  }
}
```

### 2.3 CONTEXTO EDUCACIONAL (Feature Diferencial) 📚

Princípio: Para cada insight gerado, adicionar contexto educacional que ensine o cliente sobre o conceito.

**Biblioteca de Conceitos Educacionais**
```javascript
const CONCEITOS_EDUCACIONAIS = {
  "reajuste_contratual_ipca": {
    "titulo": "Reajuste Contratual por IPCA",
    "nivel": "básico",
    "explicacao": "Contratos públicos geralmente permitem reajuste anual baseado em índices oficiais como IPCA (inflação). Este mecanismo protege o fornecedor contra perda de poder de compra.",
    "como_aplicar": "Inclua cláusula no contrato: 'Preços serão reajustados anualmente pelo IPCA/IBGE acumulado no período'. Isso é legal e comum no setor público.",
    "exemplo_pratico": "Se contrato vale R$ 100k e IPCA foi 4.62%, novo valor seria R$ 104.620. Sem reajuste, você perde R$ 4.620 de margem.",
    "base_legal": "Lei 8.666/93 Art. 65, II, d - permite reequilíbrio econômico-financeiro",
    "modelo_clausula": "Os preços serão reajustados anualmente, na data de aniversário do contrato, pelo IPCA/IBGE acumulado no período."
  },

  "margem_saudavel_b2g": {
    "titulo": "Margem Saudável em Contratos Públicos",
    "nivel": "básico",
    "explicacao": "Margem líquida média no setor público brasileiro: 8-15%. Abaixo de 5% = alto risco de prejuízo. Acima de 20% = possível superfaturamento (risco auditoria TCU).",
    "benchmark_setorial": {
      "saude": "10-12%",
      "obras": "8-10%",
      "servicos": "12-15%",
      "fornecimento": "8-12%"
    },
    "seu_caso": "Detectamos sua margem média de [X]%. [Análise personalizada]"
  },

  "radar_b2g_conceito": {
    "titulo": "O que é Radar B2G™",
    "nivel": "intermediário",
    "explicacao": "Sistema que monitora automaticamente editais públicos (licitações) compatíveis com seu portfolio de produtos/serviços. Identifica oportunidades antes que você as veja manualmente.",
    "beneficio_comprovado": "Empresas que monitoram ativamente aumentam em 30-40% sua taxa de participação em licitações relevantes."
  },

  "ciclo_orcamentario_publico": {
    "titulo": "Ciclo Orçamentário do Setor Público",
    "nivel": "intermediário",
    "explicacao": "Órgãos públicos recebem orçamento anual (Jan-Dez). Padrão: concentram compras em Nov-Dez (fim do orçamento, 'use ou perca'). Jan-Fev = baixíssima atividade (orçamento novo ainda não liberado).",
    "sazonalidade_tipica": {
      "alta_atividade": ["Outubro", "Novembro", "Dezembro"],
      "media_atividade": ["Março", "Abril", "Maio", "Agosto", "Setembro"],
      "baixa_atividade": ["Janeiro", "Fevereiro"]
    },
    "acao_estrategica": "Planeje prospecção para Set-Out (antes do rush). Evite expectativas altas em Jan-Fev."
  },

  "renovacao_contrato_processo": {
    "titulo": "Como Funciona Renovação de Contrato Público",
    "nivel": "básico",
    "explicacao": "Renovação não é automática. Órgão precisa: (1) Ter orçamento, (2) Avaliar necessidade, (3) Decidir se renova direto ou faz nova licitação.",
    "prazo_seguro": "Ideal iniciar processo com 60-90 dias de antecedência. Órgãos precisam tempo para trâmites internos.",
    "processo_tipico": [
      "1. Fornecedor envia proposta de renovação ao órgão (60-90 dias antes)",
      "2. Órgão analisa orçamento disponível (15-30 dias)",
      "3. Se aprovado: Termo Aditivo (renovação direta) OU Nova Licitação",
      "4. Assinatura e continuidade do serviço"
    ],
    "base_legal": "Lei 8.666/93 Art. 57 - prazos de vigência e prorrogação"
  }
}
```

**Aplicação de Contexto Educacional**
```javascript
function adicionarContextoEducacional(insight) {
  let conceito_chave = null

  if (insight.tipo === 'alerta_precificacao' && insight.titulo.includes('IPCA')) {
    conceito_chave = CONCEITOS_EDUCACIONAIS['reajuste_contratual_ipca']
  } else if (insight.tipo === 'radar_b2g') {
    conceito_chave = CONCEITOS_EDUCACIONAIS['radar_b2g_conceito']
  } else if (insight.tipo === 'alerta_renovacao') {
    conceito_chave = CONCEITOS_EDUCACIONAIS['renovacao_contrato_processo']
  }

  if (conceito_chave) {
    return {
      ...insight,
      contexto_educacional: {
        conceito: conceito_chave.titulo,
        explicacao: conceito_chave.explicacao,
        como_aplicar: conceito_chave.como_aplicar,
        exemplo_pratico: conceito_chave.exemplo_pratico,
        base_legal: conceito_chave.base_legal,
        seu_caso_especifico: personalizarParaEmpresa(conceito_chave, empresa)
      }
    }
  }

  return insight
}
```

### 2.4 Output do Agent 2

```javascript
{
  "insights_macro": [
    {
      "categoria": "economia",
      "titulo": "IPCA acumulado 4.62% - Margem não acompanhou",
      "dados_base": {
        "ipca_12m": 4.62,
        "margem_atual": 11.8,
        "margem_ano_anterior": 13.2,
        "delta_margem": -1.4
      },
      "impacto": "Perda de poder de compra não compensada",
      "acao_recomendada": "Reajustar preços em +4.6% nas renovações",
      "valor_recuperavel": 234000,
      "prioridade": "alta",

      "contexto_educacional": {
        "conceito": "Reajuste Contratual por IPCA",
        "explicacao": "...",
        "como_aplicar": "...",
        "exemplo_pratico": "...",
        "base_legal": "Lei 8.666/93 Art. 65",
        "seu_caso": "Você não aplicou reajuste em 5 contratos renovados. Perda estimada: R$ 234k."
      }
    }
  ],

  "insights_micro": [...],
  "oportunidades_b2g": [...],
  "alertas_prioritarios": [...],

  "conceitos_ensinados_esta_semana": [
    "reajuste_contratual_ipca",
    "margem_saudavel_b2g"
  ]
}
```

Tamanho estimado: 50-150 KB JSON

---

## 🤖 AGENT 3: AIOS CONTENT WRITER + EDUCATOR

### Responsabilidade Principal

- Transformar insights técnicos em newsletter HTML profissional
- Adicionar seções educacionais (ensinar enquanto informa)
- Disclaimers legais (dicas, não decisões - não assumir riscos)
- Demonstrar ROI e aprendizado contínuo (lock-in estratégico)

### 3.1 Template Newsletter Strategic (Completo)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter DUO™ - [Empresa]</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 650px; margin: 0 auto; background: #fff; }
    .header { background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 30px; text-align: center; }
    .logo { color: #fff; font-size: 24px; font-weight: bold; }
    .caixa-educacional { background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; }
    .disclaimer { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; margin: 30px 0; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">

    <!-- HEADER -->
    <div class="header">
      <div class="logo">DUO <span style="font-weight: 300;">Governance</span></div>
      <p style="color: #94A3B8; margin-top: 10px;">Sua Newsletter Semanal | 8 Março 2026</p>
    </div>

    <!-- SEÇÃO 1: RESUMO EXECUTIVO -->
    <div style="padding: 30px;">
      <h1 style="color: #0F172A;">Sua Semana em Números</h1>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
        <div style="background: #F8FAFC; padding: 20px; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #10B981;">45</div>
          <div style="color: #64748B; font-size: 14px;">Contratos Ativos</div>
        </div>
        <div style="background: #F8FAFC; padding: 20px; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #0F172A;">R$ 5.1M</div>
          <div style="color: #64748B; font-size: 14px;">Valor Total Portfolio</div>
        </div>
        <div style="background: #FEF3C7; padding: 20px; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #F59E0B;">8</div>
          <div style="color: #92400E; font-size: 14px;">Alertas Críticos</div>
        </div>
        <div style="background: #ECFDF5; padding: 20px; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #10B981;">3</div>
          <div style="color: #065F46; font-size: 14px;">Oportunidades B2G</div>
        </div>
      </div>
    </div>

    <!-- SEÇÃO 2: ALERTAS CRÍTICOS -->
    <div style="padding: 0 30px;">
      <h2 style="color: #0F172A; border-bottom: 2px solid #10B981; padding-bottom: 10px;">
        🚨 Ação Imediata Necessária
      </h2>

      <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 20px; margin: 20px 0;">
        <h3 style="color: #991B1B;">3 Contratos Grandes Vencem em 15 Dias</h3>
        <p><strong>Valor Total:</strong> R$ 1.5M (30% do seu faturamento anual)</p>
        <p><strong>Órgãos:</strong> Secretaria Saúde SP, Hospital X, Prefeitura Y</p>

        <!-- CONTEXTO EDUCACIONAL -->
        <div class="caixa-educacional" style="margin-top: 20px;">
          <h4 style="color: #065F46;">📚 Você Sabia? Prazo Seguro para Renovação</h4>
          <p style="color: #064E3B; font-size: 14px;">
            <strong>Regra de ouro:</strong> Iniciar processo de renovação com 60-90 dias de antecedência.
          </p>
          <details style="margin-top: 15px;">
            <summary style="cursor: pointer; color: #047857; font-weight: 600;">
              Como funciona o processo de renovação? (clique para expandir)
            </summary>
            <div style="margin-top: 10px; padding-left: 20px; border-left: 2px solid #10B981;">
              <ol style="color: #064E3B; font-size: 13px; line-height: 1.8;">
                <li>Fornecedor envia proposta de renovação ao órgão (60-90 dias antes)</li>
                <li>Órgão analisa orçamento disponível (15-30 dias)</li>
                <li>Se aprovado: Termo Aditivo OU Nova Licitação</li>
                <li>Assinatura e continuidade do contrato</li>
              </ol>
              <p style="font-size: 12px; color: #065F46;">
                <em>Base legal: Lei 8.666/93 Art. 57</em>
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>

    <!-- SEÇÃO 3: INSIGHTS + EDUCAÇÃO -->
    <div style="padding: 0 30px;">
      <h2 style="color: #0F172A; border-bottom: 2px solid #10B981; padding-bottom: 10px;">
        💡 Insights da Semana
      </h2>

      <div style="background: #F8FAFC; padding: 25px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #0F172A;">Margem Não Acompanhou IPCA</h3>

        <div style="background: #ECFDF5; padding: 15px; border-radius: 6px;">
          <strong style="color: #065F46;">✅ Recomendação:</strong>
          <p style="color: #064E3B; font-size: 14px;">
            Nas próximas renovações (7 contratos nos próximos 90 dias), aplicar reajuste
            mínimo de <strong>4.6%</strong> baseado em IPCA.<br>
            <strong>Potencial de recuperação:</strong> R$ 234k/ano de margem preservada.
          </p>
        </div>

        <!-- EDUCAÇÃO: IPCA -->
        <div class="caixa-educacional" style="margin-top: 25px;">
          <h4 style="color: #065F46;">📚 Entenda: Reajuste por IPCA</h4>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
            <div style="background: #FEF2F2; padding: 15px; border-radius: 6px;">
              <div style="font-weight: bold; color: #991B1B;">❌ Sem reajuste:</div>
              <div style="font-size: 13px; color: #7F1D1D; line-height: 1.6;">
                Custo: R$ 88k → R$ 92k (+4.6%)<br>
                Venda: R$ 100k (fixo)<br>
                <strong>Margem: 12% → 8%</strong>
              </div>
            </div>
            <div style="background: #ECFDF5; padding: 15px; border-radius: 6px;">
              <div style="font-weight: bold; color: #065F46;">✅ Com reajuste IPCA:</div>
              <div style="font-size: 13px; color: #064E3B; line-height: 1.6;">
                Custo: R$ 88k → R$ 92k (+4.6%)<br>
                Venda: R$ 100k → R$ 104.6k (+4.6%)<br>
                <strong>Margem: 12% mantida</strong>
              </div>
            </div>
          </div>

          <div style="background: #FEF9C3; padding: 15px; border-radius: 6px; margin-top: 15px;">
            <p style="color: #713F12; font-size: 14px; margin: 0;">
              <strong>⚖️ É legal?</strong> Sim! Lei 8.666/93 Art. 65 permite reequilíbrio econômico-financeiro.
            </p>
          </div>

          <div style="background: #F9FAFB; padding: 12px; border-left: 3px solid #10B981; font-family: monospace; font-size: 13px; margin-top: 15px;">
            "Os preços serão reajustados anualmente, na data de aniversário do
             contrato, pelo IPCA/IBGE acumulado no período de 12 meses."
          </div>
        </div>
      </div>
    </div>

    <!-- SEÇÃO 4: RADAR B2G™ (APENAS STRATEGIC) -->
    <div style="padding: 0 30px;">
      <h2 style="color: #0F172A; border-bottom: 2px solid #10B981; padding-bottom: 10px;">
        🎯 Radar B2G™ - Oportunidades Esta Semana
      </h2>

      <div style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); padding: 25px; border-radius: 8px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <span style="background: #10B981; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: bold;">
            Match 87%
          </span>
          <span style="font-size: 24px; font-weight: bold; color: #065F46;">R$ 1.2M</span>
        </div>

        <h3 style="color: #065F46;">Pregão 001/2026 - Secretaria de Saúde SP</h3>

        <p style="color: #064E3B; font-size: 14px;">
          <strong>Objeto:</strong> Aquisição de equipamentos médicos hospitalares<br>
          <strong>Abertura:</strong> 20/03/2026 às 10h (prazo: 12 dias)
        </p>

        <div style="background: #FFFFFF; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <strong style="color: #065F46;">Por que participar:</strong>
          <ul style="color: #064E3B; font-size: 13px; line-height: 1.8;">
            <li>Alto match (87%) com seu portfolio</li>
            <li>Cliente atual - histórico positivo de 5 contratos renovados</li>
            <li>Ticket R$ 1.2M acima da sua média (R$ 113k)</li>
            <li>Município São Paulo - região onde você já atua</li>
          </ul>
        </div>

        <a href="#" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Ver Edital Completo →
        </a>
      </div>
    </div>

    <!-- SEÇÃO 5: CONTEXTO MACROECONÔMICO -->
    <div style="padding: 0 30px; margin-top: 30px;">
      <h2 style="color: #0F172A; border-bottom: 2px solid #10B981; padding-bottom: 10px;">
        📊 Contexto de Mercado
      </h2>

      <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          <strong style="color: #0F172A;">Selic em 10.75%</strong> com tendência de queda
          nos próximos 6 meses. Bom momento para planejar expansão.
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 15px;">
          <strong style="color: #0F172A;">Notícia relevante:</strong> Governo Federal anuncia
          R$ 2 bilhões para saúde pública em 2026. Expectativa de +15-20% em licitações do setor no Q2 2026.
        </p>
      </div>
    </div>

    <!-- SEÇÃO 6: PRÓXIMOS PASSOS -->
    <div style="padding: 0 30px; margin-top: 30px;">
      <h2 style="color: #0F172A; border-bottom: 2px solid #10B981; padding-bottom: 10px;">
        📋 Sua Lista de Ações da Semana
      </h2>

      <ol style="color: #475569; font-size: 15px; line-height: 2;">
        <li>Iniciar renovação 3 contratos grandes (vencimento 22/03) - URGENTE</li>
        <li>Analisar edital Pregão 001/2026 Sec. Saúde SP (deadline 18/03)</li>
        <li>Revisar precificação: aplicar reajuste IPCA +4.6% nas renovações</li>
        <li>Prospectar novos órgãos em Campinas (potencial R$ 500k-1M)</li>
      </ol>
    </div>

    <!-- SEÇÃO 7: GLOSSÁRIO SEMANAL -->
    <div style="padding: 0 30px; margin-top: 30px;">
      <h2 style="color: #0F172A; font-size: 20px;">📖 Glossário da Semana</h2>

      <dl style="color: #475569; font-size: 13px;">
        <dt style="font-weight: bold; color: #0F172A; margin-top: 10px;">IPCA</dt>
        <dd style="margin-left: 20px; margin-bottom: 10px;">
          Índice de Preços ao Consumidor Amplo - inflação oficial do Brasil (IBGE)
        </dd>
        <dt style="font-weight: bold; color: #0F172A;">Termo Aditivo</dt>
        <dd style="margin-left: 20px; margin-bottom: 10px;">
          Documento que altera contrato original (prazo, valor, escopo, etc)
        </dd>
        <dt style="font-weight: bold; color: #0F172A;">Radar B2G™</dt>
        <dd style="margin-left: 20px; margin-bottom: 10px;">
          Monitoramento inteligente de oportunidades Business-to-Government
        </dd>
        <dt style="font-weight: bold; color: #0F172A;">PNCP</dt>
        <dd style="margin-left: 20px; margin-bottom: 10px;">
          Portal Nacional de Contratações Públicas - site oficial de licitações
        </dd>
      </dl>
    </div>

    <!-- SEÇÃO 8: APRENDIZADO CONTÍNUO (LOCK-IN) -->
    <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); padding: 25px; margin: 30px 30px 0 30px; border-radius: 8px;">
      <h3 style="color: #1E40AF; margin-top: 0;">🧠 Nossa Inteligência Sobre Seu Negócio</h3>

      <p style="color: #1E3A8A; font-size: 14px;">
        Estamos analisando sua empresa há <strong>52 semanas</strong> (1 ano completo)
      </p>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0;">
        <div style="background: #FFFFFF; padding: 15px; border-radius: 6px; text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #1E40AF;">1.247</div>
          <div style="font-size: 12px; color: #64748B;">dados coletados</div>
        </div>
        <div style="background: #FFFFFF; padding: 15px; border-radius: 6px; text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #10B981;">89%</div>
          <div style="font-size: 12px; color: #64748B;">precisão insights</div>
        </div>
        <div style="background: #FFFFFF; padding: 15px; border-radius: 6px; text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #F59E0B;">34</div>
          <div style="font-size: 12px; color: #64748B;">insights validados</div>
        </div>
      </div>

      <p style="background: #FFFFFF; padding: 15px; border-radius: 6px; color: #1E3A8A; font-size: 13px;">
        💡 <strong>Quanto mais tempo você usa o DUO™, mais precisos ficamos.</strong><br>
        Nosso sistema já conhece <strong>15 padrões únicos</strong> do seu negócio que
        nenhum concorrente ou consultor externo poderia saber sem 1 ano de análise contínua.
      </p>
    </div>

    <!-- SEÇÃO 9: ROI DEMONSTRÁVEL -->
    <div style="background: #F0FDF4; padding: 25px; margin: 30px 30px 0 30px; border-radius: 8px;">
      <h3 style="color: #065F46; margin-top: 0;">💰 Valor Gerado por Nossas Recomendações (12 meses)</h3>

      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr style="border-bottom: 1px solid #D1FAE5;">
          <td style="padding: 10px 0; color: #064E3B; font-size: 14px;">
            Renovações iniciadas a tempo
          </td>
          <td style="text-align: right; padding: 10px 0; font-weight: bold; color: #065F46;">R$ 1.200.000</td>
        </tr>
        <tr style="border-bottom: 1px solid #D1FAE5;">
          <td style="padding: 10px 0; color: #064E3B; font-size: 14px;">
            Reajustes IPCA aplicados (margem recuperada)
          </td>
          <td style="text-align: right; padding: 10px 0; font-weight: bold; color: #065F46;">R$ 234.000</td>
        </tr>
        <tr style="border-bottom: 1px solid #D1FAE5;">
          <td style="padding: 10px 0; color: #064E3B; font-size: 14px;">
            Licitações ganhas via Radar B2G™
          </td>
          <td style="text-align: right; padding: 10px 0; font-weight: bold; color: #065F46;">R$ 800.000</td>
        </tr>
        <tr style="background: #DCFCE7;">
          <td style="padding: 15px 10px; color: #065F46; font-size: 16px; font-weight: bold;">
            Total Gerado em 12 meses
          </td>
          <td style="text-align: right; padding: 15px 10px; font-weight: bold; color: #065F46; font-size: 20px;">
            R$ 2.234.000
          </td>
        </tr>
      </table>

      <div style="background: #FFFFFF; padding: 15px; border-radius: 6px; text-align: center;">
        <p style="color: #064E3B; font-size: 14px; margin: 0;">
          Sua assinatura Strategic: <strong>R$ 6.470/ano</strong><br>
          <span style="font-size: 24px; font-weight: bold; color: #10B981; display: block; margin: 10px 0;">ROI: 34x</span>
          <span style="font-size: 13px; color: #65A30D;">
            (cada R$ 1 investido gerou R$ 34 de valor)
          </span>
        </p>
      </div>
    </div>

    <!-- DISCLAIMER LEGAL -->
    <div class="disclaimer" style="margin: 30px;">
      <h4 style="color: #92400E; margin-top: 0;">⚠️ Importante: Natureza das Recomendações</h4>

      <p style="color: #78350F; font-size: 13px;"><strong>Este documento contém:</strong></p>
      <ul style="color: #78350F; font-size: 13px; line-height: 1.8;">
        <li>✅ Dicas baseadas em dados públicos oficiais (IBGE, Bacen, PNCP)</li>
        <li>✅ Insights gerados por análise automatizada (IA)</li>
        <li>✅ Contexto educacional sobre práticas do setor público</li>
      </ul>

      <p style="color: #78350F; font-size: 13px;"><strong>Este documento NÃO contém:</strong></p>
      <ul style="color: #78350F; font-size: 13px; line-height: 1.8;">
        <li>❌ Consultoria jurídica</li>
        <li>❌ Consultoria contábil ou fiscal</li>
        <li>❌ Garantias de resultados financeiros</li>
        <li>❌ Decisões de negócio tomadas por você</li>
      </ul>

      <div style="background: #FFFBEB; padding: 15px; border-radius: 6px; margin-top: 15px;">
        <p style="color: #78350F; font-size: 13px; margin: 0;">
          <strong>Responsabilidade:</strong> Todas as decisões empresariais são de
          <strong>exclusiva responsabilidade da sua empresa e seus gestores</strong>.
          Recomendamos validar qualquer ação significativa com seu contador e/ou advogado.
        </p>
      </div>

      <p style="color: #92400E; font-size: 13px; font-weight: 600; text-align: center; margin-top: 15px;">
        DUO Governance™ - Sistema de Análise Inteligente<br>
        <em style="font-weight: 400;">Seu assistente de inteligência B2G, não seu decisor.</em>
      </p>
    </div>

    <!-- FOOTER -->
    <div style="background: #F8FAFC; padding: 25px 30px; text-align: center; border-top: 1px solid #E2E8F0;">
      <p style="color: #64748B; font-size: 12px;">
        Newsletter gerada automaticamente pelo sistema DUO Governance™ baseado em análise de
        <strong>45 contratos</strong> e cruzamento com <strong>5 fontes de dados</strong> macroeconômicos.
      </p>
      <p style="color: #94A3B8; font-size: 11px; margin: 15px 0 0 0;">
        DUO Governance™ | Santos, SP
      </p>
    </div>

  </div>
</body>
</html>
```

### 3.2 Tom e Estilo de Escrita (Checklist AIOS)

```javascript
const REGRAS_ESCRITA = {
  tom: {
    fazer: [
      "Profissional consultivo (não vendedor)",
      "Acionável (sempre próximos passos claros)",
      "Específico com números (não 'vários', mas '3 contratos')",
      "Baseado em dados (citar fontes sempre)",
      "Empático (entender desafios do empresário)"
    ],
    nunca: [
      "Tom alarmista ou sensacionalista",
      "Jargões técnicos desnecessários",
      "Promessas exageradas",
      "Linguagem corporativa vazia"
    ]
  },

  personalizacao: {
    sempre: [
      "Usar nome da empresa",
      "Referenciar histórico específico",
      "Comparar com próprio passado (não genérico)",
      "Mencionar órgãos/contratos específicos"
    ]
  },

  recomendacoes: {
    formato: "DADOS → ANÁLISE → SUGESTÃO + DISCLAIMER",

    nunca_escrever: [
      "Você DEVE renovar este contrato",
      "É obrigatório aplicar reajuste",
      "Garantimos que você vai ganhar"
    ],

    sempre_escrever: [
      "Recomendamos considerar a renovação",
      "Avaliar aplicação de reajuste pode preservar margem",
      "Esta licitação tem alto match (87%) - considere participar"
    ]
  },

  educacao: {
    quando: "Sempre que introduzir conceito novo ou técnico",
    como: "Caixa educacional destacada + exemplo prático",
    nivel: "Acessível para gestor não-técnico"
  }
}
```

### 3.3 Output do Agent 3

```javascript
{
  "subject": "🚨 3 contratos (R$ 1.5M) vencem em 15 dias + 2 oportunidades B2G",
  "preview_text": "Ação imediata: renovações urgentes + Pregão Sec. Saúde SP match 87%",
  "html": "<html>...</html>",
  "plain_text": "versão texto puro (fallback email clients antigos)",

  "metadata": {
    "palavras": 2850,
    "tempo_leitura_estimado": "12 min",
    "secoes": 9,
    "ctas": 5,
    "conceitos_educacionais": 4,
    "links_externos": 3
  },

  "conceitos_ensinados_esta_semana": [
    "reajuste_contratual_ipca",
    "renovacao_processo",
    "radar_b2g_conceito",
    "margem_saudavel"
  ],

  "roi_demonstrado": 2234000,

  "personalizacao": {
    "empresa": "Empresa Exemplo LTDA",
    "contratos_referenciados": 5,
    "orgaos_mencionados": 3,
    "historico_usado": true
  }
}
```

---

## 🧲 ESTRATÉGIA DE LOCK-IN (Dependência Estratégica)

### Como Criar Valor Insubstituível

**1. Aprendizado Contínuo Visível**
- Mostrar "52 semanas analisando você"
- Exibir "1.247 dados coletados"
- Destacar "89% de precisão" (aumenta com tempo)
- Provar "34 insights validados que funcionaram"

> Mensagem subliminar: "Trocar de fornecedor = perder 1 ano de aprendizado"

**2. Insights Impossíveis de Replicar**
- Cruzamento 5+ APIs externas (IBGE, PNCP, Bacen, IPCA, News)
- Análise histórica 12+ meses do cliente
- 15 padrões únicos detectados (comportamento renovação, sazonalidade, etc)
- Benchmarking setorial personalizado

> Mensagem subliminar: "Nenhum concorrente tem esse nível de dados sobre você"

**3. Educação Progressiva (Curva de Aprendizado)**
- Cliente aprende 20+ conceitos em 1 ano
- Aplica conhecimento no dia-a-dia
- Fica "fluente" em gestão B2G

> Mensagem subliminar: "Você investiu tempo aprendendo - começar do zero com outro sistema é doloroso"

**4. ROI Demonstrável e Rastreável**
- Valor gerado: R$ 2.234M
- Custo assinatura: R$ 6.470
- ROI: 34x

> Mensagem subliminar: "Você está ganhando 34x mais do que paga - vale MUITO a pena"

---

## ⚖️ DISCLAIMERS E RESPONSABILIDADE LEGAL

### Linguagem de Proteção (CRÍTICA)

Incluir em TODAS as newsletters:

```html
<div class="disclaimer">
  <h4>⚠️ Importante: Natureza das Recomendações</h4>

  <p><strong>Este documento contém:</strong></p>
  <ul>
    <li>✅ Dicas baseadas em dados públicos oficiais</li>
    <li>✅ Insights gerados por IA</li>
    <li>✅ Contexto educacional</li>
  </ul>

  <p><strong>Este documento NÃO contém:</strong></p>
  <ul>
    <li>❌ Consultoria jurídica</li>
    <li>❌ Consultoria contábil/fiscal</li>
    <li>❌ Garantias de resultados</li>
    <li>❌ Decisões tomadas por você</li>
  </ul>

  <p><strong>Responsabilidade:</strong> Todas as decisões empresariais são de exclusiva
  responsabilidade da sua empresa. Recomendamos validar ações com contador/advogado.</p>

  <p><strong>DUO Governance™</strong> — Seu assistente de inteligência B2G, não seu decisor.</p>
</div>
```

### Tom das Recomendações (Template)

```
[DADOS OBJETIVOS]
  ↓
[ANÁLISE FUNDAMENTADA]
  ↓
[SUGESTÃO CLARA]
  ↓
[DISCLAIMER ESPECÍFICO]

Exemplo:
"Contrato X vence em 15 dias (DADO). Histórico mostra que renovações
 com <30 dias têm 40% mais risco de atraso (ANÁLISE). Sugerimos iniciar
 hoje (SUGESTÃO). Valide viabilidade orçamentária com órgão (DISCLAIMER)."
```

---

## 📊 MÉTRICAS DE SUCESSO DO SISTEMA

```javascript
{
  "metricas_email": {
    "taxa_abertura": 0.40,
    "taxa_leitura_completa": 0.25,
    "taxa_clique": 0.15,
    "taxa_acao": 0.60
  },

  "metricas_aprendizado": {
    "precisao_insights": 0.89,
    "insights_validados": 34,
    "taxa_aplicacao_conceitos": 0.75
  },

  "metricas_valor": {
    "roi_demonstrado": 2234000,
    "nps_newsletter": 8.5,
    "churn_rate": 0.02
  }
}
```

---

## 🚀 ROADMAP IMPLEMENTAÇÃO (Sprint 4)

### Semana 1-2: Agent 1 + Learning Layer
- Queries Supabase otimizadas
- Tabela `empresa_intelligence`
- Lógica detecção padrões
- Sistema validação insights históricos

### Semana 3-4: Agent 2 + APIs + Educação
- Integração 5 APIs (IBGE, PNCP, Bacen, IPCA, News)
- Biblioteca 20 conceitos educacionais
- Lógica cruzamento dados
- Sistema match insight → educação

### Semana 5-6: Agent 3 + Template + Disclaimers
- Template HTML responsivo
- Caixas educacionais interativas
- ROI tracker visual
- Disclaimers legais em todas seções

### Semana 7: Integração + Testes
- Orquestração 3 agents
- Resend API
- Vercel Cron
- Testes end-to-end
- Revisão jurídica disclaimers

---

## 📝 NOTA FINAL - DOCUMENTO VIVO

**Este documento será atualizado conforme:**
- Novas APIs ficarem disponíveis
- Novos conceitos educacionais identificados
- Feedback dos clientes
- Evolução da legislação
- Novas ideias de análise

**Versão:** 1.1 (08 Março 2026)
**Próxima revisão:** Início Sprint 4 (Abril 2026)
**Owner:** Sistema DUO Governance

**SEMPRE consultar versão mais recente antes de implementar.**

---

**FIM DO DOCUMENTO MASTER**
