'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// global-error.tsx: captura erros no root layout.
// Deve incluir <html> e <body> pois substitui o layout inteiro.
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-lg border border-red-100 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-600">Erro crítico</p>
          <p className="mt-1 text-xs text-slate-500">
            {error.message || 'Ocorreu um erro inesperado. Tente recarregar a página.'}
          </p>
          {error.digest && (
            <p className="mt-1 font-mono text-xs text-slate-400">ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700"
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  )
}
