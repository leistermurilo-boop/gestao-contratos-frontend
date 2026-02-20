'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cadastroSchema, type CadastroFormData } from '@/lib/validations/cadastro.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function CadastroPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
  })

  const onSubmit = async (data: CadastroFormData) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          // Garante que o link de confirmação retorne para o callback correto
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      })

      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error('Erro ao criar credenciais. Tente novamente.')

      // 2. authData.session é null quando "Confirm Email" está ativado no Supabase.
      //    NÃO usar getSession() aqui — pode retornar sessão temporária do signUp mesmo
      //    com confirmação obrigatória, causando erro nas inserções seguintes.
      if (!authData.session) {
        // Confirmação de email obrigatória — usuário deve confirmar antes de continuar
        router.push('/login?success=confirm-email')
        return
      }

      // 3. Criar empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .insert({
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia || null,
        })
        .select()
        .single()

      if (empresaError) {
        // Fazer logout antes de retornar erro para não deixar auth user órfão
        await supabase.auth.signOut()
        throw new Error(
          empresaError.message.includes('row-level security')
            ? 'Permissão negada ao criar empresa. Verifique as políticas RLS no Supabase.'
            : `Erro ao criar empresa: ${empresaError.message}`
        )
      }

      // 4. Criar perfil do usuário na tabela usuarios
      const { error: usuarioError } = await supabase.from('usuarios').insert({
        id: authData.user.id,
        empresa_id: empresa.id,
        email: data.email,
        nome: data.nome,
        perfil: 'admin',
        ativo: true,
      })

      if (usuarioError) {
        await supabase.auth.signOut()
        throw new Error(
          usuarioError.message.includes('row-level security')
            ? 'Permissão negada ao criar perfil. Verifique as políticas RLS no Supabase.'
            : `Erro ao criar perfil: ${usuarioError.message}`
        )
      }

      // 5. Sucesso — redirecionar para dashboard
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Criar Conta</CardTitle>
        <CardDescription>Configure sua empresa e crie o primeiro acesso de administrador</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ─── Dados da Empresa ─────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b pb-1.5">
              Dados da Empresa
            </p>

            <div className="space-y-2">
              <Label htmlFor="razao_social">Razão Social *</Label>
              <Input
                id="razao_social"
                placeholder="Empresa LTDA"
                {...register('razao_social')}
                disabled={loading}
              />
              {errors.razao_social && (
                <p className="text-sm text-red-500">{errors.razao_social.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
              <Input
                id="nome_fantasia"
                placeholder="Opcional"
                {...register('nome_fantasia')}
                disabled={loading}
              />
            </div>
          </div>

          {/* ─── Administrador ────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b pb-1.5">
              Administrador
            </p>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                placeholder="Seu nome"
                {...register('nome')}
                disabled={loading}
              />
              {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@empresa.com"
                {...register('email')}
                disabled={loading}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                {...register('password')}
                disabled={loading}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirm">Confirmar Senha *</Label>
              <Input
                id="password_confirm"
                type="password"
                placeholder="Repita a senha"
                {...register('password_confirm')}
                disabled={loading}
              />
              {errors.password_confirm && (
                <p className="text-sm text-red-500">{errors.password_confirm.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-sm text-center w-full text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Fazer login
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
