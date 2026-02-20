'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import { dashboardService, type DashboardMetrics } from '@/lib/services/dashboard.service'
import toast from 'react-hot-toast'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return `${value.toFixed(1)}%`
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Erro ao carregar métricas'
}

function MetricCardSkeleton() {
  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-3 w-24" />
      </CardContent>
    </Card>
  )
}

export function DashboardCards() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await dashboardService.getMetrics()
        setMetrics(data)
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
    )
  }

  if (!metrics) return null

  const totalAlertas = metrics.alertas.contratosVencendo + metrics.alertas.afsPendentes
  const temAlertas = totalAlertas > 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card: Contratos Ativos */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Contratos Ativos</CardTitle>
          <FileText className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{metrics.contratos.total}</div>
          <p className="mt-1 text-xs text-slate-500">contratos em vigência</p>
        </CardContent>
      </Card>

      {/* Card: Valor Total */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(metrics.contratos.valorTotal)}
          </div>
          <p className="mt-1 text-xs text-slate-500">contratos ativos</p>
        </CardContent>
      </Card>

      {/* Card: Margem Média */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Margem Média</CardTitle>
          <TrendingUp className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {formatPercent(metrics.itens.margemMedia)}
          </div>
          <p className="mt-1 text-xs text-slate-500">dos itens ativos</p>
        </CardContent>
      </Card>

      {/* Card: Alertas */}
      <Card
        className={`border-slate-200 bg-white ${temAlertas ? 'border-l-4 border-l-amber-400' : ''}`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Alertas</CardTitle>
          <AlertTriangle
            className={`h-4 w-4 ${temAlertas ? 'text-amber-500' : 'text-slate-400'}`}
          />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${temAlertas ? 'text-amber-600' : 'text-slate-900'}`}
          >
            {totalAlertas}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {metrics.alertas.contratosVencendo} vencem em 30 dias ·{' '}
            {metrics.alertas.afsPendentes} AFs pendentes
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
