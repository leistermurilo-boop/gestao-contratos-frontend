'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'inactive') {
      setError('Sua conta está inativa. Entre em contato com o administrador.')
    } else if (errorParam === 'db') {
      setError('Erro ao verificar suas credenciais. Tente novamente.')
    } else if (errorParam === 'callback') {
      setError('Erro ao processar autenticação. Tente novamente.')
    }

    const successParam = searchParams.get('success')
    if (successParam === 'reset') {
      setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.')
    } else if (successParam === 'confirm-email') {
      setSuccess('Conta criada! Confirme seu email antes de fazer login.')
    }
  }, [searchParams])

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true)
      setError(null)
      await signIn(data.email, data.password)

      // Redirecionar para rota original ou dashboard (com validação anti-open-redirect)
      const redirect = searchParams.get('redirect')
      if (redirect) {
        // Validar que é path interno seguro
        const isSafePath = redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.includes('://')
        if (isSafePath) {
          router.push(redirect)
        } else {
          console.warn('Redirect param inválido (possível open redirect):', redirect)
          router.push('/dashboard')
        }
      }
      // Se não há redirect, signIn já redireciona para /dashboard
    } catch (err: any) {
      console.error('Erro no login:', err)
      const raw: string = err?.message ?? ''
      if (raw.toLowerCase().includes('email not confirmed')) {
        setError('Email não confirmado. Verifique sua caixa de entrada e clique no link enviado.')
      } else if (raw.toLowerCase().includes('invalid login credentials') || raw.toLowerCase().includes('invalid credentials')) {
        setError('Email ou senha incorretos.')
      } else {
        setError(raw || 'Erro ao fazer login. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Gestão de Contratos</CardTitle>
        <CardDescription>
          Entre com suas credenciais para acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/recuperar-senha"
                className="text-sm text-blue-600 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground text-center">
          Não tem uma conta?{' '}
          <Link href="/cadastro" className="text-blue-600 hover:underline font-medium">
            Criar conta
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
