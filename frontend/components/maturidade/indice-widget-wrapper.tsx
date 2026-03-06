'use client'

import { useEmpresa } from '@/contexts/empresa-context'
import { getNivelMaximoVisual, getProximoNivel, calcularNivelPorPontuacao } from '@/lib/permissions'
import { IndiceWidget } from './indice-widget'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function WidgetSkeleton() {
  return (
    <Card className="shadow-md ring-1 ring-slate-100">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-1 h-3 w-64" />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

export function IndiceWidgetWrapper() {
  const { empresa, loading } = useEmpresa()

  if (loading) return <WidgetSkeleton />
  if (!empresa) return null

  const nivel = empresa.nivel_maturidade || 1
  const pontuacao = empresa.pontuacao_maturidade || 0
  const nivelAtual = calcularNivelPorPontuacao(pontuacao)
  const nivelMaximoPlano = getNivelMaximoVisual(empresa)
  const proximoNivel = getProximoNivel(empresa)

  return (
    <IndiceWidget
      nivel={nivel}
      pontuacao={pontuacao}
      nivelMaximoPlano={nivelMaximoPlano}
      nivelAtual={nivelAtual}
      proximoNivel={proximoNivel}
    />
  )
}
