'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FileDown, Pencil, ArrowLeft } from 'lucide-react'
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
import { StatusBadge, type StatusContrato } from '@/components/common/status-badge'
import { MargemIndicator } from '@/components/common/margem-indicator'
import { contratosService } from '@/lib/services/contratos.service'
import { itensService } from '@/lib/services/itens.service'
import { type ContratoWithRelations, type ItemContrato } from '@/types/models'
import toast from 'react-hot-toast'

const ESFERA_LABELS: Record<string, string> = {
  municipal: 'Municipal',
  estadual: 'Estadual',
  federal: 'Federal',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR')
}

interface FieldProps {
  label: string
  value: string | null | undefined
}

function Field({ label, value }: FieldProps) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}

export default function ContratoDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [contrato, setContrato] = useState<ContratoWithRelations | null>(null)
  const [itens, setItens] = useState<ItemContrato[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [contratoData, itensData] = await Promise.all([
          contratosService.getById(id),
          itensService.getByContrato(id),
        ])
        setContrato(contratoData)
        setItens(itensData)
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

  const vigenciaFim = contrato.prorrogado && contrato.data_vigencia_fim_prorrogacao
    ? contrato.data_vigencia_fim_prorrogacao
    : contrato.data_vigencia_fim

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Link
              href="/dashboard/contratos"
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ← Contratos
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {contrato.numero_contrato}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{contrato.orgao_publico}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {contrato.anexo_url && (
            <Button variant="outline" asChild>
              <a href={contrato.anexo_url} target="_blank" rel="noopener noreferrer">
                <FileDown className="mr-2 h-4 w-4" />
                Ver Anexo
              </a>
            </Button>
          )}
          <Button asChild className="bg-brand-navy hover:bg-brand-navy/90">
            <Link href={`/dashboard/contratos/${id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Dados do Contrato */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-800">
              Dados do Contrato
            </CardTitle>
            <StatusBadge status={contrato.status as StatusContrato} />
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="CNPJ" value={contrato.cnpj?.cnpj_numero} />
            <Field label="Razão Social" value={contrato.cnpj?.razao_social} />
            <Field label="CNPJ do Órgão" value={contrato.cnpj_orgao} />
            <Field
              label="Valor Total"
              value={formatCurrency(contrato.valor_total)}
            />
            <Field
              label="Esfera"
              value={contrato.esfera ? ESFERA_LABELS[contrato.esfera] : null}
            />
            <Field label="Índice de Reajuste" value={contrato.indice_reajuste} />
            <Field label="Data de Assinatura" value={formatDate(contrato.data_assinatura)} />
            <Field
              label="Vigência Início"
              value={formatDate(contrato.data_vigencia_inicio)}
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Vigência Fim
              </p>
              <p className="mt-0.5 text-sm text-slate-800">
                {formatDate(vigenciaFim)}
                {contrato.prorrogado && (
                  <span className="ml-2 text-xs text-amber-600">(prorrogado)</span>
                )}
              </p>
            </div>
            {contrato.objeto && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Objeto
                </p>
                <p className="mt-0.5 text-sm text-slate-800">{contrato.objeto}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Itens do Contrato */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Itens do Contrato ({itens.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {itens.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Nenhum item cadastrado neste contrato
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">#</TableHead>
                  <TableHead className="font-semibold text-slate-700">Descrição</TableHead>
                  <TableHead className="font-semibold text-slate-700">Un.</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Qtd</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Saldo</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">
                    Vlr Unit.
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50">
                    <TableCell className="text-sm text-slate-500">
                      {item.numero_item ?? '—'}
                    </TableCell>
                    <TableCell className="max-w-xs text-sm font-medium text-slate-900">
                      <span className="line-clamp-2">{item.descricao}</span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{item.unidade}</TableCell>
                    <TableCell className="text-right text-sm text-slate-700">
                      {item.quantidade.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-700">
                      {item.saldo_quantidade.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-slate-700">
                      {formatCurrency(item.valor_unitario)}
                    </TableCell>
                    <TableCell>
                      <MargemIndicator margem={item.margem_atual} showIcon={false} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
