'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ProtectedRoute } from '@/components/common/protected-route'
import { EntregaForm } from '@/components/forms/entrega-form'
import { afService, type AFWithRelations } from '@/lib/services/af.service'
import { PERFIS } from '@/lib/constants/perfis'
import toast from 'react-hot-toast'

export default function NovaEntregaPage() {
  const params = useParams()
  const router = useRouter()
  const afId = params.afId as string

  const [af, setAf] = useState<AFWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await afService.getById(afId)

        // AF cancelada ou sem saldo → redirecionar
        if (data.status === 'cancelada') {
          toast.error('Esta AF está cancelada e não aceita novas entregas.')
          router.replace(`/dashboard/autorizacoes/${afId}`)
          return
        }
        if (data.saldo_af <= 0) {
          toast.error('Esta AF não possui saldo disponível para novas entregas.')
          router.replace(`/dashboard/autorizacoes/${afId}`)
          return
        }

        setAf(data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar AF')
        router.replace('/dashboard/autorizacoes')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [afId, router])

  return (
    <ProtectedRoute
      allowedPerfis={[PERFIS.admin, PERFIS.juridico, PERFIS.compras, PERFIS.logistica]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="mb-1">
            <Link
              href={`/dashboard/autorizacoes/${afId}`}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ← Detalhes da AF
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Registrar Entrega
          </h1>
          {!loading && af && (
            <p className="mt-1 text-sm text-slate-500">
              AF {af.numero_af}
              {af.item ? ` — ${af.item.descricao}` : ''}
            </p>
          )}
          {loading && <Skeleton className="mt-1 h-4 w-64" />}
        </div>

        {/* Formulário */}
        {loading && (
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && af && (
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold text-slate-800">
                Dados da Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <EntregaForm afId={afId} af={af} />
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}
