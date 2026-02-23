'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <div className="w-full max-w-sm rounded-lg border border-red-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-red-600">Algo deu errado</p>
        <p className="mt-1 text-xs text-slate-500">
          {error.message || 'Ocorreu um erro ao carregar esta página.'}
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-slate-400">ID: {error.digest}</p>
        )}
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Voltar
          </Button>
          <Button size="sm" onClick={reset} className="bg-brand-navy hover:bg-brand-navy/90">
            Tentar novamente
          </Button>
        </div>
      </div>
    </div>
  )
}
