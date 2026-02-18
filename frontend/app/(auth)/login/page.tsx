'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { signIn, loading: authLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)

  useEffect(() => {
    // Verificar mensagens de erro do middleware
    const error = searchParams.get('error')
    if (error === 'inactive') {
      setErrorMessage('Sua conta está inativa. Entre em contato com o administrador.')
    } else if (error === 'db') {
      setErrorMessage('Erro ao verificar suas credenciais. Tente novamente.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoginError(null)

    try {
      await signIn(email, password)

      // Redirecionar para rota original ou dashboard
      const redirect = searchParams.get('redirect')
      if (redirect) {
        router.push(redirect)
      }
      // Se não há redirect, signIn já redireciona para /dashboard
    } catch (error: any) {
      console.error('Erro no login:', error)
      setLoginError(error.message || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>DUO Governance</CardTitle>
          <CardDescription>Sistema de Gestão de Contratos</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mensagens de erro do middleware */}
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Mensagens de erro do login */}
          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || authLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || authLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || authLoading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Sistema multi-tenant com isolamento RLS</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
