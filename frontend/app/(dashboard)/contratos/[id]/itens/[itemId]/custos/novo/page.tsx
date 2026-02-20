'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ProtectedRoute } from '@/components/common/protected-route'
import { CustoForm } from '@/components/forms/custo-form'
import { itensService } from '@/lib/services/itens.service'
import { PERFIS } from '@/lib/constants/perfis'
import { type ItemContrato } from '@/types/models'
import toast from 'react-hot-toast'

export default function NovoCustoPage() {
  const params = useParams()
  const contratoId = params.id as string
  const itemId = params.itemId as string

  const [item, setItem] = useState<ItemContrato | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await itensService.getById(itemId)
        setItem(data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar item')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [itemId])

  return (
    <ProtectedRoute allowedPerfis={[PERFIS.admin, PERFIS.financeiro, PERFIS.compras]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="mb-1">
            <Link
              href={`/contratos/${contratoId}/itens/${itemId}/custos`}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ← Histórico de Custos
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Registrar Custo</h1>
          {!loading && item && (
            <p className="mt-1 text-sm text-slate-500">
              {item.numero_item ? `#${item.numero_item} — ` : ''}
              {item.descricao}
            </p>
          )}
          {loading && <Skeleton className="mt-1 h-4 w-64" />}
        </div>

        {/* Formulário */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              Dados do Lançamento
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <CustoForm contratoId={contratoId} itemId={itemId} />
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
