# 🏢 Sistema de Gestão de Contratos

SaaS multi-tenant para gestão de contratos públicos.

## 🚀 Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deploy**: Vercel

## 📦 Setup

1. Instalar dependências:
```bash
npm install
```

2. Configurar variáveis de ambiente:
```bash
cp .env.example .env.local
# Editar .env.local com suas credenciais do Supabase
```

3. Rodar em desenvolvimento:
```bash
npm run dev
```

## 📖 Documentação

Veja a pasta `/docs` para:
- Análise completa do banco de dados
- Arquitetura do frontend
- Roadmap de desenvolvimento
- Guia de setup detalhado

## 🗄️ Database

Scripts SQL em `/database/migrations/`

Execute na ordem:
1. 001_schema_core.sql
2. 002_contratos_itens.sql
3. 003_schema_operacional.sql
4. 004_auditoria_reajustes.sql
5. 005_rls_policies.sql
6. 006_complementar.sql

## 🔒 Segurança

- Row Level Security (RLS) em todas as tabelas
- Multi-tenant isolation
- Auditoria completa (LGPD compliance)

## 👥 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Proprietário - Gestão Murilo Leister
