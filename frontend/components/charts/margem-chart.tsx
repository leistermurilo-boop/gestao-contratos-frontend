'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { dashboardService, type MargemHistorico } from '@/lib/services/dashboard.service'
import toast from 'react-hot-toast'

export function MargemChart() {
  const [data, setData] = useState<MargemHistorico[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const result = await dashboardService.getMargemHistorico(3)
        setData(result)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Erro ao carregar gráfico de margem',
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
        Sem dados de margem disponíveis
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} />
        <YAxis
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickFormatter={(v: number) => `${v}%`}
          domain={['auto', 'auto']}
          width={45}
        />
        <Tooltip
          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Margem Média']}
          contentStyle={{ fontSize: 12, borderRadius: '6px' }}
        />
        <Line
          type="monotone"
          dataKey="margemMedia"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ r: 4, fill: '#f59e0b' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
