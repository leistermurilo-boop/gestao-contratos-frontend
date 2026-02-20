import { ProtectedRoute } from '@/components/common/protected-route'
import { PERFIS } from '@/lib/constants/perfis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from 'lucide-react'

export default function EntregasPage() {
  return (
    <ProtectedRoute allowedPerfis={[PERFIS.admin, PERFIS.juridico, PERFIS.financeiro, PERFIS.compras, PERFIS.logistica]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Entregas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registro e acompanhamento de entregas vinculadas às AFs.
          </p>
        </div>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <Package className="h-5 w-5 text-slate-600" />
            </div>
            <CardTitle className="text-base">Módulo de Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Conteúdo do módulo de entregas em desenvolvimento.</p>
            <div className="mt-3">
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                Em desenvolvimento — Story futura
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
