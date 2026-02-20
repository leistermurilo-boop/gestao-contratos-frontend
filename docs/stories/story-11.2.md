# Story 11.2: Gestão de Usuários

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 4h | **Responsável:** @dev
**Fase:** 11 — Configurações

## 🎯 Objetivo
Página de gestão de usuários da empresa (`/dashboard/usuarios`). Admin pode listar usuários, ativar/desativar e convidar novos via e-mail. Criar usuário requer `auth.admin.inviteUserByEmail()` com SERVICE_ROLE_KEY → implementar via Next.js API Route.

## 📁 Arquivos
```
app/(dashboard)/dashboard/usuarios/page.tsx         # 🔄 Substituir placeholder existente
app/api/usuarios/invite/route.ts                    # ✅ NOVO — API Route server-side
components/modals/invite-user-modal.tsx             # ✅ NOVO
```

## 🔑 Contexto Arquitetural
- **Rota:** `/dashboard/usuarios`
- **Acesso:** apenas `admin`
- **Problema arquitetural:** criar usuário no Supabase Auth requer `SERVICE_ROLE_KEY` (Decisão #8: nunca usar SERVICE_ROLE_KEY no cliente)
  - Solução: Next.js API Route com `createClient()` server-side usando SERVICE_ROLE_KEY
- **usuarios table** (database.types.ts):
  - Row: `id (= auth.users.id), empresa_id, email, nome, perfil, ativo, created_at, updated_at`
  - Insert: `id` é REQUIRED (não opcional) → precisa ser o UUID do auth.user criado
- **Fluxo de convite:**
  1. Admin preenche email + nome + perfil no modal
  2. Frontend → POST `/api/usuarios/invite`
  3. API Route → `supabase.auth.admin.inviteUserByEmail(email)` → obtém `user.id`
  4. API Route → `supabase.from('usuarios').insert({ id: user.id, empresa_id, email, nome, perfil })`
  5. Supabase envia email de convite automaticamente

## 🔨 Implementação

### `app/api/usuarios/invite/route.ts`
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 1. Verificar autenticação e perfil admin via session
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // 2. Verificar perfil admin
  const { data: usuario } = await supabase
    .from('usuarios').select('perfil, empresa_id').eq('id', session.user.id).single()
  if (usuario?.perfil !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  // 3. Criar usuário via admin client (SERVICE_ROLE_KEY)
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // Server-side only
  )

  const { email, nome, perfil } = await request.json()

  // 4. Convidar via Auth Admin
  const { data: { user }, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email)
  if (inviteError || !user) return NextResponse.json({ error: inviteError?.message }, { status: 400 })

  // 5. Inserir na tabela usuarios
  const { error: insertError } = await adminClient
    .from('usuarios')
    .insert({ id: user.id, empresa_id: usuario.empresa_id, email, nome, perfil })
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
```

**Variável de ambiente necessária:**
```
SUPABASE_SERVICE_ROLE_KEY=   # .env.local apenas — NUNCA expor no cliente
```

### `invite-user-modal.tsx`
```
Campos: Email | Nome | Perfil (select: admin/juridico/financeiro/compras/logistica)
Submit: POST /api/usuarios/invite → toast.success('Convite enviado') ou toast.error
Fecha modal após sucesso + recarrega lista de usuários
```

### Página `usuarios/page.tsx`
```tsx
'use client'
// Estados: usuarios (Usuario[]), loading

// Carregar: supabase.from('usuarios').select('*').order('nome')
//   (query direta — não tem service ainda; criar inline ou usuariosService.getAll())

// Tabela com colunas: Nome | Email | Perfil | Ativo | Criado em | Ações

// Ações:
//   - Toggle Ativo: UPDATE usuarios SET ativo = !ativo WHERE id = x
//   - Badge: admin/juridico/financeiro/compras/logistica com cores

// Botão "Convidar Usuário" → abre InviteUserModal

// ProtectedRoute allowedPerfis={[PERFIS.admin]}
```

## ✅ Critérios
- [x] Listagem de usuários da empresa funcionando (query direta na página)
- [x] Toggle ativo funcional (inline, sem reload)
- [x] Convidar usuário via modal → POST /api/usuarios/invite → email enviado pelo Supabase
- [x] SUPABASE_SERVICE_ROLE_KEY nunca exposta no cliente (apenas API Route server-side)
- [x] API Route valida autenticação + perfil admin antes de executar
- [x] Apenas admin acessa a página (ProtectedRoute)
- [x] TypeScript: 0 erros | ESLint: 0 warnings

## ⚠️ Regras Críticas
- NUNCA usar SERVICE_ROLE_KEY em código cliente (Decisão #8)
- API Route DEVE verificar que o usuário solicitante é admin antes de criar novos usuários
- `empresa_id` do novo usuário = `empresa_id` do admin autenticado (isolamento multi-tenant)
- O id do usuario na tabela `usuarios` DEVE ser igual ao id do auth.user criado (FK)
- Adicionar `SUPABASE_SERVICE_ROLE_KEY` ao `.env.local` E às variáveis de ambiente Vercel (Story 12.3)

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
