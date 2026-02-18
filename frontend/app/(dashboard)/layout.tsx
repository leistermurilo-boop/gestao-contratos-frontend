'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirecionar se não há sessão (após loading)
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  // Bloquear render enquanto carrega
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    )
  }

  // Bloquear render se não autenticado
  if (!user) {
    return null
  }

  // Render protegido (usuario.ativo é verificado no AuthContext)
  return <>{children}</>
}
