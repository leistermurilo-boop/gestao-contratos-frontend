import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 1. Verificar autenticação via session cookie
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // 2. Verificar perfil admin
  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('perfil, empresa_id')
    .eq('id', session.user.id)
    .single()

  if (usuarioError || !usuario || usuario.perfil !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // 3. Validar body
  const body = await request.json()
  const { email, nome, perfil } = body as {
    email: string
    nome: string
    perfil: string
  }

  if (!email || !nome || !perfil) {
    return NextResponse.json({ error: 'email, nome e perfil são obrigatórios' }, { status: 400 })
  }

  const perfisValidos = ['admin', 'juridico', 'financeiro', 'compras', 'logistica']
  if (!perfisValidos.includes(perfil)) {
    return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 })
  }

  // 4. Criar usuário via admin client com SERVICE_ROLE_KEY (server-side apenas)
  // ⚠️ Decisão #8: SERVICE_ROLE_KEY NUNCA exposta no cliente
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: authData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email)

  if (inviteError || !authData?.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? 'Erro ao enviar convite' },
      { status: 400 },
    )
  }

  // 5. Inserir na tabela usuarios (id = auth.user.id — FK obrigatória)
  // empresa_id = empresa do admin autenticado (isolamento multi-tenant)
  const { error: insertError } = await adminClient.from('usuarios').insert({
    id: authData.user.id,
    empresa_id: usuario.empresa_id,
    email,
    nome,
    perfil,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
