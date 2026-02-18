'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()

      // Processar callback do Supabase (reset senha, confirmação email, OAuth)
      const { error } = await supabase.auth.getSession()

      if (error) {
        console.error('Erro no callback:', error)
        router.push('/login?error=callback')
        return
      }

      // Redirecionar para dashboard após callback bem-sucedido
      router.push('/dashboard')
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Processando autenticação...</p>
      </div>
    </div>
  )
}
