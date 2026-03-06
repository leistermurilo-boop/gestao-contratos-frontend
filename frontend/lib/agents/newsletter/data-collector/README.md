# Agent 1: Data Collector + Learning Layer

## Responsabilidade
1. Coleta massiva de dados internos (Supabase)
2. Construção de perfil evolutivo da empresa
3. Validação de insights históricos (o que funcionou?)

## Status
⏳ Sprint 4 — Semana 1-2

## Dados Coletados

### Contratos Completos
- Todos os contratos ativos e histórico
- Margem média, valor total, vigências
- Status (ativo, próximo vencimento, encerrado)

### Itens de Contratos (Granularidade Máxima)
- Cada material/produto por contrato
- Quantidades, valores unitários, saldos
- Municípios e órgãos por item

### Análises Derivadas
- **Portfolio de materiais** — top produtos, share do faturamento, tendência de margem
- **Regiões de atuação** — estados, municípios, share geográfico
- **Perfil de clientes** — órgãos públicos, ticket médio, taxa renovação
- **Sazonalidade** — meses de maior/menor volume, ciclo orçamentário
- **Alertas críticos** — margem baixa, erosão, vencimentos em massa

## Learning Layer 🧠

### O que Aprende
- **Comportamento de renovação** — prazo médio de início, taxa de sucesso
- **Evolução do portfolio** — materiais abandonados vs crescentes
- **Padrões sazonais** — ciclo orçamentário detectado automaticamente
- **Sensibilidade macro** — correlação margem x IPCA, Selic, PIB municipal

### Como Aprende
1. Registra insights gerados na newsletter
2. Rastreia ações do cliente (abriu? agiu?)
3. Valida se o resultado foi positivo
4. Ajusta precisão para próxima newsletter

### Tabela: `empresa_intelligence`
```sql
CREATE TABLE empresa_intelligence (
  empresa_id UUID PRIMARY KEY REFERENCES empresas(id),
  perfil_evolutivo JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Estrutura do Perfil Evolutivo
```typescript
{
  primeira_analise: '2026-03-08',
  total_analises: 52,        // 1 por semana
  aprendizados_acumulados: {
    comportamento_renovacao: { prazo_medio: 45, taxa_sucesso: 0.78 },
    evolucao_portfolio: { materiais_crescimento: [...] },
    padroes_sazonais: { meses_alta: ['Nov', 'Dez'], confianca: 0.92 },
    sensibilidade_macro: { ipca_correlacao: 0.82 }
  },
  insights_historicos_validados: [...],
  preferencias_cliente: {
    taxa_abertura_email: 0.92,
    secoes_mais_clicadas: ['Radar B2G', 'Insights Macro']
  }
}
```

## Detalhes
Ver seção "Agent 1" em [NEWSLETTER_MASTER_STRATEGY.md](../../NEWSLETTER_MASTER_STRATEGY.md)
