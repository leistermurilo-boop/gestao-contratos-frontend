'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// error.tsx: captura erros no segmento raiz (abaixo do root layout).
// Renderiza dentro do layout existente — sem <html>/<body>.
export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[RootError]', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8 text-center">
      <div className="w-full max-w-sm rounded-lg border border-red-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-red-600">Algo deu errado</p>
        <p className="mt-1 text-xs text-slate-500">
          {error.message || 'Ocorreu um erro. Tente novamente.'}
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-slate-400">ID: {error.digest}</p>
        )}
        <Button onClick={reset} className="mt-4 bg-brand-navy hover:bg-brand-navy/90" size="sm">
          Tentar novamente
        </Button>
      </div>
    </div>
  )
}
