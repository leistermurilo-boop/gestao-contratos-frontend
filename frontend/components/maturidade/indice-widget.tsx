'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type NivelMaturidade } from '@/lib/permissions'

interface IndiceWidgetProps {
  nivel: number
  pontuacao: number
  nivelMaximoPlano: number // 3 para Core, 5 para Strategic
  nivelAtual: NivelMaturidade
  proximoNivel: {
    nivel: number
    nome: string
    pontos_necessarios: number
    fora_do_plano: boolean
    mensagem?: string
  } | null
}

const COR_CLASSES = {
  slate: {
    badge: 'bg-slate-500',
    ring: 'ring-slate-200',
    progress: 'bg-slate-500',
    text: 'text-slate-700',
    bg: 'bg-slate-50 border-slate-200',
  },
  blue: {
    badge: 'bg-blue-500',
    ring: 'ring-blue-200',
    progress: 'bg-blue-500',
    text: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
  },
  emerald: {
    badge: 'bg-emerald-500',
    ring: 'ring-emerald-200',
    progress: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  purple: {
    badge: 'bg-purple-500',
    ring: 'ring-purple-200',
    progress: 'bg-purple-500',
    text: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
  },
  yellow: {
    badge: 'bg-gradient-to-br from-yellow-400 to-amber-500',
    ring: 'ring-yellow-200',
    progress: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    text: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
  },
} as const

export function IndiceWidget({
  nivel,
  pontuacao,
  nivelAtual,
  proximoNivel,
}: IndiceWidgetProps) {
  const cores = COR_CLASSES[nivelAtual.cor]

  const pontosProximo = proximoNivel?.pontos_necessarios ?? nivelAtual.pontos_min
  const pontosInicioNivel = nivelAtual.pontos_min
  const progressoPct =
    proximoNivel && !proximoNivel.fora_do_plano && pontosProximo > pontosInicioNivel
      ? Math.min(
          100,
          ((pontuacao - pontosInicioNivel) / (pontosProximo - pontosInicioNivel)) * 100
        )
      : 100

  return (
    <Card className="shadow-md ring-1 ring-slate-100">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          Índice de Maturidade DUO™
        </CardTitle>
        <p className="text-xs text-slate-500">
          Badge de engajamento · Não afeta acesso a features
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Badge circular com nível */}
        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              'flex h-20 w-20 items-center justify-center rounded-full',
              'text-2xl font-bold text-white shadow-lg',
              cores.badge
            )}
          >
            {nivel}
          </div>
          <p className="mt-3 font-semibold text-slate-900">Nível {nivel}</p>
          <p className={cn('text-sm font-medium', cores.text)}>{nivelAtual.nome}</p>
          <p className="mt-0.5 text-xs text-slate-400">{nivelAtual.descricao}</p>
        </div>

        {/* Barra de progresso (apenas quando há próximo nível acessível) */}
        {proximoNivel && !proximoNivel.fora_do_plano && (
          <div className="space-y-1.5">
            <div className={cn('h-3 w-full overflow-hidden rounded-full ring-2', cores.ring)}>
              <div
                className={cn('h-full transition-all duration-500 ease-out', cores.progress)}
                style={{ width: `${progressoPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{pontuacao} pontos</span>
              <span>
                {proximoNivel.pontos_necessarios - pontuacao} para próximo badge
              </span>
            </div>
          </div>
        )}

        {/* Próximo badge disponível no plano */}
        {proximoNivel && !proximoNivel.fora_do_plano && (
          <div className="rounded-lg border bg-emerald-50 border-emerald-200 p-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-900">
                Próximo badge: Nível {proximoNivel.nivel}
              </p>
            </div>
            <p className="mt-0.5 text-sm text-emerald-700">
              {proximoNivel.nome} · {proximoNivel.pontos_necessarios - pontuacao} pontos
            </p>
          </div>
        )}

        {/* Badge fora do plano atual (Core tentando ver nível 4/5) */}
        {proximoNivel && proximoNivel.fora_do_plano && (
          <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 space-y-1">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-900">
                Badge Nível {proximoNivel.nivel} (Strategic)
              </p>
            </div>
            <p className="text-sm text-blue-700">{proximoNivel.mensagem}</p>
            <p className="text-xs text-blue-500">
              Faça upgrade para Strategic para ver badges superiores
            </p>
          </div>
        )}

        {/* Nível máximo absoluto (nível 5 atingido) */}
        {!proximoNivel && nivel >= 5 && (
          <div className="rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 p-3 text-center">
            <p className="text-sm font-semibold text-amber-900">
              🏆 Badge Máximo Alcançado!
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Nível 5 — Contrato Estratégico
            </p>
          </div>
        )}

        {/* Dica de gamificação */}
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">
            Ganhe pontos cadastrando contratos, configurando alertas e usando features
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
