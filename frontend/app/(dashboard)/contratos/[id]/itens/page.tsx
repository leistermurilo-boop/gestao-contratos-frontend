'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ItensTable } from '@/components/tables/itens-table'
import { contratosService } from '@/lib/services/contratos.service'
import { itensService } from '@/lib/services/itens.service'
import { useAuth } from '@/contexts/auth-context'
import { PERFIS, canViewCosts } from '@/lib/constants/perfis'
import { type ContratoWithRelations, type ItemContrato } from '@/types/models'
import toast from 'react-hot-toast'

function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-48" />
    </div>
  )
}

export default function ItensContratoPage() {
  const params = useParams()
  const contratoId = params.id as string
  const { usuario } = useAuth()

  const [contrato, setContrato] = useState<ContratoWithRelations | null>(null)
  const [itens, setItens] = useState<ItemContrato[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [contratoData, itensData] = await Promise.all([
          contratosService.getById(contratoId),
          itensService.getByContrato(contratoId),
        ])
        setContrato(contratoData)
        setItens(itensData)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [contratoId])

  async function handleDelete(itemId: string) {
    try {
      await itensService.softDelete(itemId)
      toast.success('Item removido com sucesso!')
      setItens((prev) => prev.filter((i) => i.id !== itemId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao remover item')
    }
  }

  const isAdmin = usuario?.perfil === PERFIS.admin
  const canViewCustos = usuario ? canViewCosts(usuario.perfil) : false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {loading ? (
            <HeaderSkeleton />
          ) : (
            <>
              <div className="mb-1 flex items-center gap-2">
                <Link
                  href={`/dashboard/contratos/${contratoId}`}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ← {contrato?.numero_contrato ?? 'Contrato'}
                </Link>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Itens do Contrato
              </h1>
              {contrato && (
                <p className="mt-1 text-sm text-slate-500">{contrato.orgao_publico}</p>
              )}
            </>
          )}
        </div>

        {isAdmin && (
          <Button asChild className="bg-brand-navy hover:bg-brand-navy/90">
            <Link href={`/dashboard/contratos/${contratoId}/itens/novo`}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Item
            </Link>
          </Button>
        )}
      </div>

      {/* Tabela */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-800">
              {loading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                `Itens (${itens.length})`
              )}
            </CardTitle>
            {!loading && contrato && (
              <Link
                href={`/dashboard/contratos/${contratoId}`}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
              >
                <ArrowLeft className="h-3 w-3" />
                Ver contrato
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ItensTable
            contratoId={contratoId}
            itens={itens}
            loading={loading}
            isAdmin={isAdmin}
            onDelete={handleDelete}
            canViewCustos={canViewCustos}
          />
        </CardContent>
      </Card>
    </div>
  )
}
