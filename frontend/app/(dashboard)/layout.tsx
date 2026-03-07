'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Só redirecionar quando auth estiver totalmente resolvido sem usuário.
    // Enquanto loading=true, o middleware já garantiu autenticação — não redirecionar.
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  // Enquanto não autenticado (e auth já resolveu), mostrar spinner durante redirect
  if (!loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    )
  }

  // Renderizar layout completo imediatamente — sidebar e header lidam com null graciosamente.
  // O middleware já garantiu que apenas usuários autenticados chegam aqui.
  // Isso elimina o spinner em branco durante a inicialização do Supabase client (200-500ms).
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
