'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Plus } from 'lucide-react'
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
import { StatusBadge } from '@/components/common/status-badge'
import { afService, type AFWithRelations } from '@/lib/services/af.service'
import { entregasService } from '@/lib/services/entregas.service'
import { useAuth } from '@/contexts/auth-context'
import { PERFIS, canRegisterEntrega } from '@/lib/constants/perfis'
import { type Entrega } from '@/types/models'
import toast from 'react-hot-toast'

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR')
}

function formatQty(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

export default function DetalhesAFPage() {
  const params = useParams()
  const afId = params.afId as string
  const { usuario } = useAuth()

  const [af, setAf] = useState<AFWithRelations | null>(null)
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [afData, entregasData] = await Promise.all([
          afService.getById(afId),
          entregasService.getByAF(afId),
        ])
        setAf(afData)
        setEntregas(entregasData)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar AF')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [afId])

  const podeRegistrarEntrega =
    usuario &&
    canRegisterEntrega(usuario.perfil) &&
    af?.status !== 'cancelada' &&
    (af?.saldo_af ?? 0) > 0

  const progressPercent =
    af && af.quantidade_autorizada > 0
      ? Math.min((af.quantidade_entregue / af.quantidade_autorizada) * 100, 100)
      : 0

  return (
    <ProtectedRoute
      allowedPerfis={[
        PERFIS.admin,
        PERFIS.juridico,
        PERFIS.financeiro,
        PERFIS.compras,
        PERFIS.logistica,
      ]}
    >
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
          {loading ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              AF {af?.numero_af ?? '—'}
            </h1>
          )}
        </div>

        {/* Not-found */}
        {!loading && !af && (
          <Card className="border-slate-200">
            <CardContent className="py-16 text-center">
              <p className="text-sm font-medium text-slate-900">
                Autorização de Fornecimento não encontrada.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/dashboard/autorizacoes">Voltar para lista</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        )}

        {!loading && af && (
          <>
            {/* Card dados da AF */}
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-800">
                    Dados da Autorização
                  </CardTitle>
                  <StatusBadge status={af.status} />
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Número AF
                    </dt>
                    <dd className="mt-1 font-mono text-sm font-semibold text-slate-900">
                      {af.numero_af}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Contrato
                    </dt>
                    <dd className="mt-1 text-sm text-slate-700">
                      {af.item?.contrato
                        ? `${af.item.contrato.numero_contrato} — ${af.item.contrato.orgao_publico}`
                        : '—'}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Item
                    </dt>
                    <dd className="mt-1 text-sm text-slate-700">
                      {af.item
                        ? `${af.item.numero_item ? `#${af.item.numero_item} — ` : ''}${af.item.descricao}`
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Data de Emissão
                    </dt>
                    <dd className="mt-1 text-sm text-slate-700">
                      {af.data_emissao ? formatDate(af.data_emissao) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Data de Vencimento
                    </dt>
                    <dd className="mt-1 text-sm text-slate-700">
                      {af.data_vencimento ? formatDate(af.data_vencimento) : '—'}
                    </dd>
                  </div>
                  {af.observacao && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Observação
                      </dt>
                      <dd className="mt-1 text-sm text-slate-700">{af.observacao}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Documento AF
                    </dt>
                    <dd className="mt-1 text-sm">
                      {af.anexo_url ? (
                        <a
                          href={af.anexo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          Ver documento
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Card saldo / progresso */}
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold text-slate-800">
                  Controle de Saldo
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Qtd Autorizada
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {formatQty(af.quantidade_autorizada)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Qtd Entregue
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {formatQty(af.quantidade_entregue)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Saldo Atual
                    </p>
                    {/* ⚠️ saldo_af é GENERATED ALWAYS — exibir do banco, nunca recalcular */}
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {formatQty(af.saldo_af)}
                    </p>
                  </div>
                </div>
                {/* Barra de progresso */}
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>Progresso de entrega</span>
                    <span>{progressPercent.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        af.saldo_af === 0 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card entregas */}
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-800">
                    Entregas ({entregas.length})
                  </CardTitle>
                  {podeRegistrarEntrega && (
                    <Button size="sm" className="bg-brand-navy hover:bg-brand-navy/90" asChild>
                      <Link href={`/dashboard/autorizacoes/${afId}/entregas/nova`}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Registrar Entrega
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {entregas.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-slate-500">
                      Nenhuma entrega registrada para esta AF.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-semibold text-slate-700">Data Entrega</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">
                          Qtd Entregue
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">NF Saída</TableHead>
                        <TableHead className="font-semibold text-slate-700">Observação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entregas.map((entrega) => (
                        <TableRow key={entrega.id} className="hover:bg-slate-50">
                          <TableCell className="whitespace-nowrap text-sm text-slate-700">
                            {formatDate(entrega.data_entrega)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-slate-700">
                            {formatQty(entrega.quantidade_entregue)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {entrega.nf_saida_numero ? (
                              entrega.anexo_nf_url ? (
                                <a
                                  href={entrega.anexo_nf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                  {entrega.nf_saida_numero}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                entrega.nf_saida_numero
                              )
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs text-sm text-slate-500">
                            <span className="line-clamp-2">
                              {entrega.observacao ?? '—'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}
