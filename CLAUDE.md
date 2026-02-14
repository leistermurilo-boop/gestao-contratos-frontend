# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral do Projeto

Este é um projeto de **Sistema de Gestão de Contratos** construído usando o framework **Synkra AIOS** (AI-Orchestrated System for Full Stack Development).

## PROJETO: Gestão de Contratos

### Stack
- Frontend: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui (A CRIAR em /frontend)
- Backend: Supabase - já configurado com 10 tabelas, RLS 100%, 8 migrations
- Deploy: Vercel

### Database (COMPLETO - NUNCA ALTERAR SQL DIRETO)
Tabelas: empresas, usuarios, cnpjs, contratos, itens_contrato,
custos_item, autorizacoes_fornecimento, entregas, reajustes, auditoria
Credenciais: já estão no .env

### Regras Críticas de Negócio
1. Multi-tenant: todo dado isolado por empresa_id via RLS automático
2. Margem calculada via trigger: ((valor_unitario - custo_medio) / valor_unitario) * 100
3. Saldo AF e itens atualizados automaticamente por triggers
4. Soft delete em contratos e itens (campo deleted_at)
5. Perfis: admin, juridico, financeiro, compras, logistica
6. Perfil logistica NÃO vê custos (bloqueio via RLS)

### Próxima Tarefa
Criar frontend Next.js 14 em /frontend com autenticação Supabase,
layout base com sidebar, e módulos na ordem do roadmap em /docs/roadmap-executivo.md

### Documentação do Projeto
- `/docs/analise-sql-fornecido.md` → estrutura completa do banco
- `/docs/frontend-architecture.md` → arquitetura do frontend
- `/docs/roadmap-executivo.md` → ordem de desenvolvimento

### Framework Base: Synkra AIOS

O projeto utiliza o Synkra AIOS v4.31.0 como meta-framework para orquestração de agentes AI e desenvolvimento full-stack. **IMPORTANTE:** Todas as regras e configurações do AIOS em `.claude/CLAUDE.md` devem ser respeitadas.

Pontos-chave do AIOS:
- **CLI First:** Toda funcionalidade deve funcionar 100% via CLI antes de ter UI
- **Story-Driven Development:** Todo desenvolvimento começa com stories em `docs/stories/`
- **Agent System:** Use agentes especializados via `@agent-name` (ex: `@dev`, `@qa`, `@architect`)
- **Absolute Imports:** Sempre use imports absolutos, nunca relativos

## Estrutura do Projeto

```
gestao-contratos/
├── .aios-core/              # Framework Synkra AIOS (não modificar diretamente)
├── .claude/                 # Configurações Claude Code do AIOS
├── docs/                    # Documentação do projeto
│   └── stories/             # Development stories (quando criadas)
├── src/                     # Código fonte da aplicação (a ser criado)
├── tests/                   # Testes (a ser criado)
└── .env                     # Variáveis de ambiente
```

## Comandos Principais

### AIOS Framework
```bash
# Informações e diagnósticos
npx aios-core info           # Informações do sistema
npx aios-core doctor         # Diagnóstico de saúde
npx aios-core --help         # Ajuda completa

# Atualizar AIOS
npx aios-core install        # Atualizar instalação
```

### Desenvolvimento (quando configurado)
```bash
npm run dev                  # Iniciar desenvolvimento
npm test                     # Rodar testes
npm run lint                 # Verificar código
npm run typecheck            # Verificar tipos TypeScript
npm run build                # Build produção
```

### Sistema de Agentes

Ative agentes especializados com `@agent-name`:

| Agente | Uso | Exemplos de Comandos |
|--------|-----|----------------------|
| `@analyst` | Análise e pesquisa | `*research-deps` |
| `@architect` | Arquitetura e design | `*assess-complexity`, `*create-plan` |
| `@pm` | Product Management | `*gather-requirements`, `*write-spec` |
| `@dev` | Implementação | `*execute-subtask` |
| `@qa` | Testes e qualidade | `*review-build`, `*critique-spec` |
| `@devops` | CI/CD e git operations | `*create-worktree`, `*list-mcps` |

Comandos de agentes usam prefixo `*`:
- `*help` - Listar comandos disponíveis do agente
- `*create-story` - Criar nova development story
- `*task {name}` - Executar task específica

## Workflow de Desenvolvimento

1. **Planejamento:** Use `@analyst`, `@pm` e `@architect` para criar PRD e documentos de arquitetura
2. **Story Creation:** `@po` ou `@sm` criam development stories em `docs/stories/`
3. **Implementação:** `@dev` implementa seguindo a story
4. **Testes:** `@qa` valida e testa
5. **Deploy:** `@devops` gerencia CI/CD e git operations

## Padrões de Código

### TypeScript/JavaScript
- Use TypeScript com tipos explícitos
- Sem `any` - use tipos apropriados ou `unknown` com type guards
- Sempre defina interfaces de props para componentes
- Imports absolutos via `@/` (ex: `import { util } from '@/utils/helper'`)

### Nomenclatura
- Componentes: `PascalCase` (ex: `ContractList`)
- Arquivos: `kebab-case` (ex: `contract-list.tsx`)
- Hooks: prefixo `use` (ex: `useContracts`)
- Constantes: `SCREAMING_SNAKE_CASE` (ex: `MAX_CONTRACTS`)

### Git Commits
Seguir Conventional Commits com referência à story:
```bash
feat: implementar listagem de contratos [Story 1.1]
fix: corrigir validação de data [Story 1.2]
docs: atualizar README
```

## Quality Gates

Antes de qualquer commit ou push, garantir que os seguintes checks passam:
```bash
npm run lint                 # ESLint
npm run typecheck            # TypeScript
npm test                     # Testes
```

## Variáveis de Ambiente

Configurar em `.env` (ver `.env.example` para referência):

### Essenciais para Agentes AIOS
- `DEEPSEEK_API_KEY` - Para comando claude-free
- `ANTHROPIC_API_KEY` - API Anthropic (se não usar Claude Max)
- `OPENROUTER_API_KEY` - Roteamento multi-modelo

### Ferramentas de Pesquisa
- `EXA_API_KEY` - Busca web para agentes
- `CONTEXT7_API_KEY` - Documentação de bibliotecas

### Projeto Específico (adicionar conforme necessário)
- Configurações de banco de dados
- APIs externas
- Credenciais de serviços

## Regras Importantes

1. **CLI First:** Funcionalidades devem funcionar via CLI antes de ter UI
2. **Story-Driven:** Sempre trabalhar a partir de uma story em `docs/stories/`
3. **Agent Authority:** Respeitar autoridade dos agentes (ex: apenas `@devops` faz push)
4. **No Invention:** Não inventar requisitos; seguir exatamente as acceptance criteria
5. **Quality First:** Todos os quality gates devem passar antes de merge
6. **Absolute Imports:** Nunca usar imports relativos (`../../../`)

## MCP Servers

O projeto usa MCPs para funcionalidades estendidas. Gerenciamento via `@devops`:
- **playwright:** Automação de browser
- **EXA:** Busca web (via Docker)
- **Context7:** Documentação de bibliotecas (via Docker)
- **Apify:** Web scraping (via Docker)

**IMPORTANTE:** Sempre preferir ferramentas nativas do Claude Code (`Read`, `Write`, `Bash`, `Grep`, `Glob`) sobre MCP quando possível.

## Documentação Adicional

- **AIOS Complete Guide:** `.claude/CLAUDE.md`
- **MCP Usage Rules:** `.claude/rules/mcp-usage.md`
- **AIOS README:** `.aios-core/README.md`
- **User Guide:** `.aios-core/docs/guides/user-guide.md`
- **Architecture:** `.aios-core/docs/architecture/ARCHITECTURE-INDEX.md`

## Início Rápido para Novos Desenvolvedores

1. **Setup inicial:**
   ```bash
   npm install
   npx aios-core doctor  # Verificar instalação
   ```

2. **Configurar IDE:**
   - Windsurf/Cursor: Copiar regras de `.aios-core/.windsurf/global-rules.md`
   - Claude Code: Já configurado via `.claude/CLAUDE.md`

3. **Criar primeira story:**
   ```bash
   @po *create-story  # No seu IDE com Claude Code
   ```

4. **Desenvolver:**
   ```bash
   @dev *help  # Ver comandos disponíveis
   ```

---

**Framework:** Synkra AIOS v4.31.0
**Projeto:** Sistema de Gestão de Contratos
**Filosofia:** CLI First → Observability Second → UI Third
