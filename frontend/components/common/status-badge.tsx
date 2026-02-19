import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type StatusContrato = 'ativo' | 'concluido' | 'rescindido' | 'suspenso' | 'arquivado'
export type StatusReajuste = 'solicitado' | 'analise' | 'aprovado' | 'rejeitado' | 'implementado'
export type StatusBadgeType = StatusContrato | StatusReajuste

interface StatusBadgeProps {
  status: StatusBadgeType
  className?: string
}

interface StatusConfig {
  label: string
  className: string
}

const STATUS_CONFIG: Record<StatusBadgeType, StatusConfig> = {
  // Status de contratos
  ativo: {
    label: 'Ativo',
    className: 'border-transparent bg-green-100 text-green-800 hover:bg-green-100',
  },
  concluido: {
    label: 'Concluído',
    className: 'border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
  rescindido: {
    label: 'Rescindido',
    className: 'border-transparent bg-red-100 text-red-800 hover:bg-red-100',
  },
  suspenso: {
    label: 'Suspenso',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  arquivado: {
    label: 'Arquivado',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  // Status de reajustes
  solicitado: {
    label: 'Solicitado',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  analise: {
    label: 'Em Análise',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  aprovado: {
    label: 'Aprovado',
    className: 'border-transparent bg-green-100 text-green-800 hover:bg-green-100',
  },
  rejeitado: {
    label: 'Rejeitado',
    className: 'border-transparent bg-red-100 text-red-800 hover:bg-red-100',
  },
  implementado: {
    label: 'Implementado',
    className: 'border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
