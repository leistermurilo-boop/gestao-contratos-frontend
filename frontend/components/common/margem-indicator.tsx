'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useEmpresa } from '@/contexts/empresa-context'

interface MargemIndicatorProps {
  /** Valor da margem em % — calculado pelo trigger no banco (Decisão #3) */
  margem: number | null
  /** Limiar de alerta — abaixo disso é vermelho. Se omitido, usa margemAlerta do EmpresaContext */
  threshold?: number
  showIcon?: boolean
  showValue?: boolean
  className?: string
}

function getColor(margem: number, threshold: number): string {
  if (margem < threshold) return 'text-red-600 bg-red-50 border-red-200'
  if (margem < threshold * 2) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-green-600 bg-green-50 border-green-200'
}

export function MargemIndicator({
  margem,
  threshold,
  showIcon = true,
  showValue = true,
  className,
}: MargemIndicatorProps) {
  const { margemAlerta } = useEmpresa()
  const effectiveThreshold = threshold ?? margemAlerta
  if (margem === null || margem === undefined) {
    return <span className={cn('text-sm text-muted-foreground', className)}>N/A</span>
  }

  const color = getColor(margem, effectiveThreshold)
  const isAbaixo = margem < effectiveThreshold
  const isAtencao = !isAbaixo && margem < effectiveThreshold * 2

  const Icon = isAbaixo ? TrendingDown : isAtencao ? Minus : TrendingUp

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded border px-2 py-1 text-sm font-medium',
              color,
              className
            )}
          >
            {showIcon && <Icon className="h-3 w-3 flex-shrink-0" />}
            {showValue && <span>{margem.toFixed(2)}%</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <p>
              <strong>Margem:</strong> {margem.toFixed(2)}%
            </p>
            <p>
              <strong>Alerta abaixo de:</strong> {effectiveThreshold}%
            </p>
            {isAbaixo && (
              <p className="font-semibold text-red-400">Abaixo do esperado</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
