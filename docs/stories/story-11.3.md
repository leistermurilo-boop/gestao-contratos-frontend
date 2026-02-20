# Story 11.3: Perfil do Usuário

**Tipo:** Feature | **Prioridade:** Baixa | **Estimativa:** 1h | **Responsável:** @dev
**Fase:** 11 — Configurações

## 🎯 Objetivo
Página de perfil do usuário autenticado (`/dashboard/perfil`). Permite atualizar nome e alterar senha. Email e perfil são somente leitura (email gerenciado pelo Supabase Auth; perfil gerenciado pelo admin).

## 📁 Arquivos
```
app/(dashboard)/dashboard/perfil/page.tsx           # ✅ NOVO — página não existe ainda
```

## 🔑 Contexto Arquitetural
- **Rota:** `/dashboard/perfil` → `app/(dashboard)/dashboard/perfil/page.tsx`
  - ⚠️ Placeholder não existe: precisa criar arquivo e verificar se sidebar tem link para `/dashboard/perfil`
- **Acesso:** todos os perfis (próprio usuário)
- **Dados do usuário:** `useAuth()` → `usuario` (do contexto de autenticação existente)
- **Atualizar nome:** `supabase.from('usuarios').update({ nome }).eq('id', usuario.id)`
- **Alterar senha:** `supabase.auth.updateUser({ password: novasenha })`
  - Não precisa de senha atual — Supabase Auth gerencia sessão
- **Email:** somente leitura — alterar email requer fluxo de verificação (fora de escopo)
- **Perfil/cargo:** somente leitura — gerenciado pelo admin

## 🔨 Implementação

### Página `perfil/page.tsx`
```tsx
'use client'
// useAuth() → usuario, supabase (client)
// Estados: nome (string), senhaAtual (só para UX, não enviada ao backend), novaSenha, confirmarSenha, saving

// Form 1 — Dados básicos:
//   Nome: input text, editável
//   Email: input text, disabled (read-only)
//   Perfil: badge display, não editável
//   Submit "Salvar" → supabase.from('usuarios').update({ nome }).eq('id', usuario.id)

// Form 2 — Alterar senha (separado):
//   Nova Senha: input password, min 6 chars
//   Confirmar Nova Senha: input password
//   Validação: novasSenha === confirmarSenha
//   Submit → supabase.auth.updateUser({ password: novaSenha })

// Toast de sucesso/erro em ambos os forms
// ProtectedRoute: todos os perfis (sem restrição)
```

**Layout:**
```
Cabeçalho: "Meu Perfil"

Card: Dados da Conta
  - Avatar/inicial do nome (gerado pelo CSS, sem upload de foto — fora de escopo)
  - Nome (editável)
  - Email (read-only)
  - Perfil badge
  - Empresa (read-only, do contexto)
  - Botão "Salvar Alterações"

Card: Segurança
  - Nova Senha
  - Confirmar Nova Senha
  - Botão "Alterar Senha"
```

## ✅ Critérios
- [ ] Exibir nome, email e perfil do usuário autenticado
- [ ] Atualizar nome funcionando
- [ ] Alterar senha funcionando
- [ ] Email e perfil somente leitura
- [ ] Toast de sucesso/erro
- [ ] Todos os perfis acessam
- [ ] TypeScript: 0 erros | ESLint: 0 warnings

## ⚠️ Regras Críticas
- NUNCA permitir editar email diretamente (requer fluxo de verificação Supabase)
- NUNCA permitir editar perfil (apenas admin pode fazer isso via página de usuários)
- `supabase.auth.updateUser({ password })` usa a sessão atual — não precisa de senha anterior
- Verificar se existe link "Meu Perfil" na sidebar; se não existir, adicionar em Story 12.1

**Status:** ⏳ Aguardando | **Criado:** @sm/@architect — 2026-02-21
