'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProtectedRoute } from '@/components/common/protected-route'
import { MargemIndicator } from '@/components/common/margem-indicator'
import { itensService } from '@/lib/services/itens.service'
import { custosService } from '@/lib/services/custos.service'
import { useAuth } from '@/contexts/auth-context'
import { PERFIS, canViewCosts } from '@/lib/constants/perfis'
import { type ItemContrato, type CustoItem } from '@/types/models'
import toast from 'react-hot-toast'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR')
}

function ItemSummarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
      ))}
    </div>
  )
}

export default function CustosItemPage() {
  const params = useParams()
  const contratoId = params.id as string
  const itemId = params.itemId as string
  const { usuario } = useAuth()

  const [item, setItem] = useState<ItemContrato | null>(null)
  const [custos, setCustos] = useState<CustoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [itemData, custosData] = await Promise.all([
          itensService.getById(itemId),
          custosService.getByItem(itemId),
        ])
        setItem(itemData)
        setCustos(custosData)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [itemId])

  const canRegistrar = usuario ? canViewCosts(usuario.perfil) : false

  return (
    <ProtectedRoute
      allowedPerfis={[PERFIS.admin, PERFIS.juridico, PERFIS.financeiro, PERFIS.compras]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Link
                href={`/dashboard/contratos/${contratoId}/itens`}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ← Itens do Contrato
              </Link>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Histórico de Custos
            </h1>
            {!loading && item && (
              <p className="mt-1 text-sm text-slate-500">
                {item.numero_item ? `#${item.numero_item} — ` : ''}
                {item.descricao}
              </p>
            )}
          </div>

          {canRegistrar && (
            <Button asChild className="bg-brand-navy hover:bg-brand-navy/90">
              <Link href={`/dashboard/contratos/${contratoId}/itens/${itemId}/custos/novo`}>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Custo
              </Link>
            </Button>
          )}
        </div>

        {/* Card resumo do item */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">
              Resumo do Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ItemSummarySkeleton />
            ) : item ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Unidade
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{item.unidade}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Vlr Unitário
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {formatCurrency(item.valor_unitario)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Custo Médio (CMP)
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {item.custo_medio !== null ? formatCurrency(item.custo_medio) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Margem Atual
                  </p>
                  <div className="mt-1">
                    <MargemIndicator margem={item.margem_atual} showIcon={false} />
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Tabela de lançamentos */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              {loading ? (
                <Skeleton className="h-5 w-40" />
              ) : (
                `Lançamentos (${custos.length})`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            ) : custos.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-medium text-slate-900">
                  Nenhum custo registrado para este item.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Os lançamentos aparecerão aqui após serem registrados.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Data Lançamento</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">
                      Custo Unit.
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Qtd</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Total</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fornecedor</TableHead>
                    <TableHead className="font-semibold text-slate-700">NF</TableHead>
                    <TableHead className="font-semibold text-slate-700">Obs.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {custos.map((custo) => (
                    <TableRow key={custo.id} className="hover:bg-slate-50">
                      <TableCell className="whitespace-nowrap text-sm text-slate-700">
                        {formatDate(custo.data_lancamento)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-slate-700">
                        {formatCurrency(custo.custo_unitario)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-700">
                        {custo.quantidade.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-slate-700">
                        {formatCurrency(custo.custo_unitario * custo.quantidade)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {custo.fornecedor ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {custo.numero_nf ? (
                          custo.nf_entrada_url ? (
                            <a
                              href={custo.nf_entrada_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              {custo.numero_nf}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            custo.numero_nf
                          )
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs text-sm text-slate-500">
                        <span className="line-clamp-1">{custo.observacao ?? '—'}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
