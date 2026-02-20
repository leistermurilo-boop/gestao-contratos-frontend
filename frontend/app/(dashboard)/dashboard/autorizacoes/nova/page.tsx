'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/common/protected-route'
import { AFForm } from '@/components/forms/af-form'
import { PERFIS } from '@/lib/constants/perfis'

export default function NovaAFPage() {
  return (
    <ProtectedRoute allowedPerfis={[PERFIS.admin, PERFIS.compras]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="mb-1">
            <Link
              href="/dashboard/autorizacoes"
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ← Autorizações de Fornecimento
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Emitir Autorização de Fornecimento
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Preencha os dados para emitir uma nova AF. O saldo do item será validado automaticamente.
          </p>
        </div>

        {/* Formulário */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              Dados da Autorização
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <AFForm />
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
