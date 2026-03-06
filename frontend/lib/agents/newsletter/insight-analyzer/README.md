# Agent 2: Insight Analyzer + APIs Externas + Educator

## Responsabilidade
1. Cruzar dados internos (Agent 1) com APIs externas
2. Gerar insights acionáveis fundamentados em dados
3. Adicionar contexto educacional a cada insight

## Status
⏳ Sprint 4 — Semana 3-4

## APIs Externas Integradas

### 1. IBGE — Dados Econômicos Regionais
- PIB municipal (dimensionar potencial de mercado)
- População por município
- Endpoint: `servicodados.ibge.gov.br/api/v3`

### 2. IPCA — Inflação Oficial Brasil
- IPCA acumulado 12 meses
- IPCA setorial (saúde, obras, serviços)
- Alertar defasagem de precificação
- Endpoint: `servicodados.ibge.gov.br/api/v3/agregados/1737`

### 3. PNCP — Radar B2G™
- Licitações abertas por região e objeto
- Match portfolio da empresa x editais abertos
- Oportunidades com score > 80%
- Endpoint: `pncp.gov.br/api`

### 4. Bacen — Banco Central
- Selic atual e tendência
- Câmbio (quando relevante)
- Endpoint: `api.bcb.gov.br/dados/serie`

### 5. News APIs — Contexto de Mercado
- Google News (setor da empresa)
- RSS Valor Econômico
- Portal gov.br/Notícias

## Lógica de Cruzamento

### Exemplo 1: Margem x IPCA
```
Se margem_atual < margem_anterior:
  ipca = IPCA.getAcumulado(vigencia_inicio, hoje)

  Se perda_margem > ipca → ineficiência operacional
  Se ipca > perda_margem → precificação defasada (reajuste!)

→ Insight: "Reajustar +X% nas renovações"
→ Educação: "Como aplicar reajuste por IPCA"
```

### Exemplo 2: Região x PIB Municipal
```
Para cada região de atuação:
  pib = IBGE.getPIB(municipio)
  share = valor_empresa / pib

  Se share < 0.01% → potencial inexplorado

→ Insight: "Prospectar mais órgãos em X"
→ Educação: "Dimensionamento de mercado B2G"
```

### Exemplo 3: Material x Radar B2G (PNCP)
```
Para cada material do portfolio:
  editais = PNCP.search(material, regioes, proximos_30_dias)
  match_score = similaridade(material, edital.objeto)

  Se match_score > 80% → oportunidade alta

→ Insight: "Participar Pregão X (match 87%)"
→ Educação: "Como funciona o Radar B2G™"
```

## Contexto Educacional 📚

Para cada insight, sistema adiciona:
- **Conceito** — nome do conceito técnico
- **Explicação** — o que é e por que importa (linguagem acessível)
- **Como aplicar** — passo a passo prático
- **Exemplo prático** — antes vs depois com números
- **Base legal** — referência à lei aplicável

### Biblioteca: 20+ Conceitos Educacionais
Ver `CONCEITOS_EDUCACIONAIS` em [core/config.ts](../../core/config.ts)

## Detalhes
Ver seção "Agent 2" em [NEWSLETTER_MASTER_STRATEGY.md](../../NEWSLETTER_MASTER_STRATEGY.md)
