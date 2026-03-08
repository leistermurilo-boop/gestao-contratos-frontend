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
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }

    if (!loading && !user) {
      // Timer evita redirect prematuro durante race condition pós-login:
      // signIn() pode retornar antes de processSession completar, causando
      // janela breve de user=null. 2000ms garante que auth estabilize primeiro.
      //
      // IMPORTANTE: usar /api/auth/signout em vez de router.push('/login').
      // router.push('/login') causa loop: middleware server-side ainda vê sessão
      // válida (cookies httpOnly) e redireciona de volta para /dashboard indefinidamente.
      // /api/auth/signout limpa TODOS os cookies (inclusive httpOnly) antes de ir
      // para /login, garantindo que o middleware não bloqueie o login.
      redirectTimerRef.current = setTimeout(() => {
        window.location.href = '/api/auth/signout'
      }, 2000)
    }

    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    )
  }

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
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
