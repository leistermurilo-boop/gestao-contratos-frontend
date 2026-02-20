'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ItemForm } from '@/components/forms/item-form'
import { contratosService } from '@/lib/services/contratos.service'
import { type ContratoWithRelations } from '@/types/models'
import toast from 'react-hot-toast'

export default function NovoItemPage() {
  const params = useParams()
  const contratoId = params.id as string

  const [contrato, setContrato] = useState<ContratoWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await contratosService.getById(contratoId)
        setContrato(data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar contrato')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contratoId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Card className="border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!contrato) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-medium text-slate-900">Contrato não encontrado</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/contratos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <Link
            href={`/dashboard/contratos/${contratoId}/itens`}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            ← Itens do Contrato
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Adicionar Item</h1>
        <p className="mt-1 text-sm text-slate-500">{contrato.orgao_publico}</p>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Dados do Item
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ItemForm
            mode="create"
            contratoId={contratoId}
            cnpjId={contrato.cnpj_id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
