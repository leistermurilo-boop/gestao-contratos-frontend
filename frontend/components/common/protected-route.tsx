'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { type Perfil } from '@/lib/constants/perfis'
import { hasPermission } from '@/lib/utils/permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedPerfis: Perfil[]
  redirectTo?: string
  showError?: boolean
}

/**
 * HOC de proteção de rota baseado em perfil.
 *
 * ATENÇÃO: Este componente é UX-level (Decisão #7).
 * A segurança real é garantida pelo RLS no banco de dados.
 *
 * @param allowedPerfis - Perfis que podem acessar o conteúdo
 * @param redirectTo - Para onde redirecionar se não tiver permissão e showError=false
 * @param showError - Se true, exibe tela de "Acesso Negado". Se false, redireciona silenciosamente.
 */
export function ProtectedRoute({
  children,
  allowedPerfis,
  redirectTo = '/dashboard',
  showError = true,
}: ProtectedRouteProps) {
  const { usuario, loading } = useAuth()
  const router = useRouter()

  // Usar string como dep estável para evitar re-render infinito (Decisão #12)
  const allowedPerfisStr = allowedPerfis.join(',')

  useEffect(() => {
    if (!loading && usuario && !hasPermission(usuario.perfil, allowedPerfis) && !showError) {
      router.push(redirectTo)
    }
    // allowedPerfisStr estabiliza a referência do array allowedPerfis
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, usuario, allowedPerfisStr, redirectTo, router, showError])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy" />
      </div>
    )
  }

  // Middleware e AuthContext já redirecionam usuários não autenticados
  if (!usuario) return null

  if (!hasPermission(usuario.perfil, allowedPerfis)) {
    if (!showError) return null

    return (
      <div className="flex min-h-[400px] items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 flex-shrink-0 text-red-500" />
              <div>
                <CardTitle className="text-red-700">Acesso Negado</CardTitle>
                <CardDescription>
                  Você não tem permissão para acessar esta página.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">
                Seu perfil:{' '}
                <strong className="capitalize">{usuario.perfil}</strong>
              </p>
              <p className="mt-1 text-xs text-red-600">
                Esta página requer um dos seguintes perfis:{' '}
                {allowedPerfis.map((p) => p.toUpperCase()).join(', ')}
              </p>
            </div>
            <Button
              onClick={() => router.push(redirectTo)}
              className="w-full bg-brand-navy hover:bg-brand-navy/90"
            >
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
