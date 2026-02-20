'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ContratoForm } from '@/components/forms/contrato-form'
import { contratosService } from '@/lib/services/contratos.service'
import { type ContratoWithRelations } from '@/types/models'
import toast from 'react-hot-toast'

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-48" />
      </div>
      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
            <div className="sm:col-span-2 space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-36" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function EditarContratoPage() {
  const params = useParams()
  const id = params.id as string

  const [contrato, setContrato] = useState<ContratoWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await contratosService.getById(id)
        setContrato(data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar contrato')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <LoadingSkeleton />

  if (!contrato) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-medium text-slate-900">Contrato não encontrado</p>
        <p className="mt-1 text-xs text-slate-500">
          O contrato pode ter sido removido ou você não tem acesso.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/contratos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar à lista
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <Link
            href={`/dashboard/contratos/${id}`}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            ← {contrato.numero_contrato}
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Editar Contrato</h1>
        <p className="mt-1 text-sm text-slate-500">{contrato.orgao_publico}</p>
      </div>

      {/* Formulário */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Dados do Contrato
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ContratoForm mode="edit" contratoId={id} initialData={contrato} />
        </CardContent>
      </Card>
    </div>
  )
}
