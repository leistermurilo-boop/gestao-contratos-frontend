'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { dashboardService, type VencimentoData } from '@/lib/services/dashboard.service'
import toast from 'react-hot-toast'

// Cores por urgência: vermelho (Sem.1) → âmbar (Sem.2) → azul (demais)
const CORES_URGENCIA: Record<number, string> = {
  0: '#ef4444',
  1: '#f59e0b',
}
const COR_PADRAO = '#3b82f6'

export function VencimentosChart() {
  const [data, setData] = useState<VencimentoData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const result = await dashboardService.getVencimentosProximos(90)
        setData(result)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Erro ao carregar gráfico de vencimentos',
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-lg" />
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Nenhum contrato vencendo nos próximos 90 dias
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="semana" tick={{ fontSize: 12, fill: '#64748b' }} />
        <YAxis
          tick={{ fontSize: 12, fill: '#64748b' }}
          allowDecimals={false}
          width={30}
        />
        <Tooltip
          formatter={(value: number) => [value, 'Contratos']}
          contentStyle={{ fontSize: 12, borderRadius: '6px' }}
        />
        <Bar dataKey="contratos" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={CORES_URGENCIA[index] ?? COR_PADRAO} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
