# Testes Manuais - Middleware de Autenticação

## ✅ Cenário 1: Usuário não autenticado tenta acessar rota protegida

**Objetivo:** Validar redirect com preservação de rota original

**Passos:**
1. Abrir navegador em modo anônimo
2. Acessar `http://localhost:3000/dashboard`

**Resultado Esperado:**
- Redireciona para `/login?redirect=/dashboard`
- Após login, redireciona de volta para `/dashboard`

---

## ✅ Cenário 2: Usuário autenticado acessa rota de login

**Objetivo:** Evitar acesso a tela de login quando já autenticado

**Passos:**
1. Fazer login com usuário válido
2. Tentar acessar `http://localhost:3000/login`

**Resultado Esperado:**
- Redireciona automaticamente para `/dashboard`

---

## ✅ Cenário 3: Usuário inativo tenta acessar sistema

**Objetivo:** Validar verificação de usuario.ativo em toda request

**Passos:**
1. No Supabase, marcar um usuário como `ativo = false`
2. Fazer login com esse usuário
3. Tentar acessar qualquer rota protegida

**Resultado Esperado:**
- Usuário é deslogado automaticamente
- Redireciona para `/login?error=inactive`
- Exibe mensagem: "Sua conta está inativa. Entre em contato com o administrador."

---

## ✅ Cenário 4: Erro de banco ao verificar usuário

**Objetivo:** Validar tratamento de erro de RLS/banco

**Passos:**
1. Remover temporariamente policy SELECT em `usuarios`
2. Fazer login com usuário válido
3. Tentar acessar rota protegida

**Resultado Esperado:**
- Usuário é deslogado automaticamente
- Redireciona para `/login?error=db`
- Exibe mensagem: "Erro ao verificar suas credenciais. Tente novamente."

---

## ✅ Cenário 5: Sessão expirada

**Objetivo:** Validar refresh automático de sessão

**Passos:**
1. Fazer login com usuário válido
2. Aguardar expiração do token JWT (ou forçar via Supabase)
3. Tentar acessar rota protegida

**Resultado Esperado:**
- Middleware tenta refresh automático
- Se refresh falhar, redireciona para `/login`

---

## ✅ Cenário 6: Rotas públicas sem autenticação

**Objetivo:** Validar acesso a rotas públicas

**Passos:**
1. Abrir navegador em modo anônimo
2. Acessar rotas: `/`, `/login`, `/register`, `/recuperar-senha`

**Resultado Esperado:**
- Todas as rotas acessíveis sem autenticação
- Nenhum redirecionamento

---

## ✅ Cenário 7: Arquivos estáticos não passam pelo middleware

**Objetivo:** Validar matcher exclui arquivos estáticos

**Passos:**
1. Abrir DevTools > Network
2. Acessar qualquer página
3. Observar requisições de: `_next/static/*`, imagens, favicon

**Resultado Esperado:**
- Requisições de arquivos estáticos não executam middleware
- Status 200 direto, sem redirecionamento

---

## ✅ Cenário 8: Redirect após login preserva query params

**Objetivo:** Validar que redirect preserva query parameters

**Passos:**
1. Tentar acessar `/dashboard/contratos?filtro=ativos`
2. Fazer login

**Resultado Esperado:**
- Redireciona para `/dashboard/contratos?filtro=ativos`
- Query params preservados

---

## 🔒 Testes de Segurança Críticos

### Teste Crítico 1: usuario.ativo verificado em TODA request

**Validar:**
- Middleware consulta `usuarios.ativo` em cada request autenticada
- Verificação ocorre ANTES de permitir acesso

**Como testar:**
1. Fazer login e acessar `/dashboard`
2. No Supabase, marcar `ativo = false` enquanto navega
3. Tentar acessar outra rota protegida

**Esperado:**
- Próxima request detecta inativo e desloga

---

### Teste Crítico 2: Usuário inativo não consegue acessar NENHUMA rota

**Validar:**
- Usuário inativo é bloqueado em todas rotas protegidas

**Como testar:**
1. Usuário com `ativo = false`
2. Tentar acessar: `/dashboard`, `/test-auth`, `/test-empresa`

**Esperado:**
- Todas redirecionam para `/login?error=inactive`

---

### Teste Crítico 3: Erro de banco não permite bypass

**Validar:**
- Erro de banco força signOut

**Como testar:**
1. Remover policy SELECT temporariamente
2. Tentar acessar rota protegida

**Esperado:**
- SignOut automático + redirect `/login?error=db`

---

### Teste Crítico 4: Redirect param não permite XSS/Open Redirect

**Validar:**
- Redirect param não aceita URLs externas

**Como testar:**
1. Tentar acessar `/login?redirect=https://malicious.com`
2. Fazer login

**Esperado:**
- Next.js bloqueia redirect para domínio externo
- Redireciona apenas para rotas internas

---

## 📊 Checklist de Validação

- [ ] Cenário 1: Redirect com preservação de rota
- [ ] Cenário 2: Usuário autenticado redireciona de /login
- [ ] Cenário 3: Usuário inativo é bloqueado
- [ ] Cenário 4: Erro de banco tratado
- [ ] Cenário 5: Sessão refresh automático
- [ ] Cenário 6: Rotas públicas acessíveis
- [ ] Cenário 7: Arquivos estáticos não passam por middleware
- [ ] Cenário 8: Query params preservados
- [ ] Teste Crítico 1: usuario.ativo em toda request
- [ ] Teste Crítico 2: Inativo bloqueado em todas rotas
- [ ] Teste Crítico 3: Erro de banco força signOut
- [ ] Teste Crítico 4: Redirect param seguro

---

**Status:** Aguardando testes com usuário no Supabase
**Criado em:** 2026-02-18 - Story 2.3
