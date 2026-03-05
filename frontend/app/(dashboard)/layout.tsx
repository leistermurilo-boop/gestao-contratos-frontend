'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Limpar timer anterior se o estado mudou (ex: TOKEN_REFRESHED restaurou o usuário)
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }

    if (!loading && !user) {
      // TIMING CRÍTICO: processSession do AuthProvider pode levar até 1.5s
      // (fetch Supabase + validação usuário ativo). Timer de redirect deve
      // aguardar auth estabilizar antes de redirecionar usuário não autenticado.
      // 2000ms garante margem segura mesmo em conexões lentas e cobre o caso
      // de race condition pós-login (signIn() retorna antes de processSession
      // completar, causando janela breve de user=null no DashboardLayout).
      redirectTimerRef.current = setTimeout(() => {
        router.push('/login')
      }, 2000)
    }

    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    }
  }, [loading, user, router])

  // Bloquear render enquanto carrega
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    )
  }

  // Enquanto router.push('/login') navega, manter spinner em vez de null
  // para evitar janela de tela branca entre signOut e a navegação completar
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Conteúdo principal com offset da sidebar no desktop */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
