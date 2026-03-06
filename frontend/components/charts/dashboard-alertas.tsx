'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { MargemIndicator } from '@/components/common/margem-indicator'
import { contratosService } from '@/lib/services/contratos.service'
import { itensService, type ItemWithContrato } from '@/lib/services/itens.service'
import { type ContratoWithRelations } from '@/types/models'
import { useEmpresa } from '@/contexts/empresa-context'
import toast from 'react-hot-toast'

function getDiasRestantes(dataVigencia: string): number {
  const hoje = new Date()
  const fim = new Date(dataVigencia + 'T12:00:00')
  return Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function corDiasRestantes(dias: number): string {
  if (dias <= 7) return 'text-red-600 font-semibold'
  if (dias <= 14) return 'text-amber-600 font-semibold'
  return 'text-slate-500'
}

export function DashboardAlertas() {
  const { margemAlerta } = useEmpresa()
  const [contratos, setContratos] = useState<ContratoWithRelations[]>([])
  const [itens, setItens] = useState<ItemWithContrato[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [contratosResult, itensResult] = await Promise.all([
          contratosService.getExpiringSoon(30),
          itensService.getWithMargemBaixa(margemAlerta),
        ])
        setContratos(contratosResult)
        setItens(itensResult)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar alertas')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [margemAlerta])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const totalAlertas = contratos.length + itens.length

  if (totalAlertas === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <span className="text-green-500 text-base">✓</span>
        Nenhum alerta no momento
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Contratos próximos do vencimento */}
      {contratos.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <Clock className="h-3 w-3" />
            Vencendo em 30 dias ({contratos.length})
          </p>
          <div className="space-y-2">
            {contratos.map((contrato) => {
              const dias = getDiasRestantes(contrato.data_vigencia_fim)
              return (
                <div
                  key={contrato.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {contrato.numero_contrato}
                    </p>
                    <p className="truncate text-xs text-slate-500">{contrato.orgao_publico}</p>
                  </div>
                  <span className={`ml-3 whitespace-nowrap text-xs ${corDiasRestantes(dias)}`}>
                    {dias === 1 ? '1 dia' : `${dias} dias`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Itens com margem baixa */}
      {itens.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-700">
            <AlertTriangle className="h-3 w-3" />
            Margem baixa ({itens.length})
          </p>
          <div className="space-y-2">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{item.descricao}</p>
                  <p className="truncate text-xs text-slate-500">
                    {item.contrato?.numero_contrato ?? '—'} · {item.contrato?.orgao_publico ?? ''}
                  </p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <MargemIndicator margem={item.margem_atual} showIcon={false} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
