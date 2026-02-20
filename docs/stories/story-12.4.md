# Story 12.4: Deploy Vercel

**Tipo:** DevOps | **Prioridade:** Alta | **Estimativa:** 1h | **Responsável:** @devops
**Fase:** 12 — Deploy

## 🎯 Objetivo
Deploy do frontend Next.js 14 na Vercel, com variáveis de ambiente configuradas e domínio personalizado (opcional). Pré-requisito: Story 12.3 (build passando).

## 📁 Arquivos
```
frontend/vercel.json            # ✅ CRIAR se necessário (configurações específicas Vercel)
```

## 🔑 Contexto
- **Framework:** Next.js 14 (App Router) — detectado automaticamente pela Vercel
- **Diretório raiz do projeto Vercel:** `frontend/` (não a raiz do repositório)
- **Build command:** `npm run build` (padrão Next.js)
- **Output directory:** `.next` (padrão Next.js)

## 🔨 Implementação

### 1. Criar projeto na Vercel
```bash
# Via CLI Vercel:
cd frontend
npx vercel

# Responder:
# ? Set up and deploy: Y
# ? Which scope: [selecionar org]
# ? Link to existing project: N (ou Y se já existe)
# ? Project name: gestao-contratos
# ? In which directory is your code located: ./  (já estamos em frontend/)
# ? Override settings: N
```

### 2. Configurar variáveis de ambiente na Vercel
Via painel Vercel (https://vercel.com/[org]/gestao-contratos/settings/environment-variables):
```
NEXT_PUBLIC_SUPABASE_URL        → Production + Preview + Development
NEXT_PUBLIC_SUPABASE_ANON_KEY   → Production + Preview + Development
SUPABASE_SERVICE_ROLE_KEY       → Production only (marcar "Sensitive")
```

### 3. Configurar Supabase para domínio Vercel
No painel Supabase → Authentication → URL Configuration:
```
Site URL:           https://gestao-contratos.vercel.app (ou domínio customizado)
Redirect URLs:      https://gestao-contratos.vercel.app/**
                    http://localhost:3000/**  (para desenvolvimento local)
```

### 4. Primeiro deploy
```bash
npx vercel --prod
# Ou: push para branch main → deploy automático se CI configurado
```

### 5. Verificar deploy
```
URL de produção: https://[projeto].vercel.app
Testar:
  - Login funcional
  - Dashboard carregando métricas
  - Navegação entre módulos
  - Upload de arquivos (Supabase Storage)
  - API Route de convite de usuário (/api/usuarios/invite)
```

### 6. `vercel.json` (se necessário)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```
Criar apenas se Vercel não detectar corretamente o framework.

## ✅ Critérios
- [ ] Deploy bem-sucedido na Vercel
- [ ] Variáveis de ambiente configuradas (incluindo SUPABASE_SERVICE_ROLE_KEY)
- [ ] Supabase URL Configuration atualizado para domínio Vercel
- [ ] Login e dashboard funcionando em produção
- [ ] API Route `/api/usuarios/invite` funcionando em produção
- [ ] Uploads para Supabase Storage funcionando

## ⚠️ Notas
- O diretório raiz para a Vercel deve ser `frontend/` — configurar corretamente no projeto Vercel
- Supabase Storage RLS: confirmar que as políticas de storage aceitam uploads do domínio Vercel
- Após primeiro deploy bem-sucedido, pushes para `main` fazem deploy automático

**Status:** 🚀 Pronto para deploy (passos manuais pendentes) | **Criado:** @sm/@architect — 2026-02-21
