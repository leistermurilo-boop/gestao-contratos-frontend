# OCR Agent

Extração automática de dados de contratos PDF usando Claude API.

## Status
⏳ **Planejado para Sprint 3** (Abril 2026)

## Documentação Completa
Ver [OCR_MASTER_STRATEGY.md](./OCR_MASTER_STRATEGY.md)

## Resumo Funcional

### O que faz
1. Recebe PDF de contrato público
2. Extrai campos estruturados (número, órgão, datas, valor, itens)
3. Retorna JSON com confidence score por campo
4. Preenche formulário automaticamente
5. Usuário valida e ajusta antes de salvar
6. Aprende com cada correção (Learning Layer)

### Campos Extraídos
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `numero_contrato` | string | ✅ |
| `orgao_nome` | string | ✅ |
| `vigencia_inicio` | date | ✅ |
| `vigencia_fim` | date | ✅ |
| `valor_total` | number | ✅ |
| `modalidade` | string | ✅ |
| `cnpj_orgao` | string | ⬜ |
| `municipio_contrato` | string | ⬜ |
| `objeto_contrato` | string | ⬜ |
| `itens[]` | array | ⬜ |

### Confidence Score
| Faixa | Indicador | Ação |
|-------|-----------|------|
| 90-100% | ✓ verde | Apenas revisar |
| 70-89% | ⚠️ amarelo | Verificar campo |
| 0-69% | ❌ vermelho | Revisar manualmente |

## Uso Futuro (Sprint 3)

```typescript
import { OCRAgent } from '@/lib/agents/ocr'

const result = await OCRAgent.extractContract(pdfFile)

// result.campos_extraidos
// result.confidence_geral
// result.itens
```

## Tecnologia
- **Modelo:** Claude Sonnet 4.6 (Anthropic API)
- **Input:** PDF nativo (base64)
- **Temperature:** 0.1 (determinístico)
- **Learning:** tabela `ocr_learning` no Supabase
