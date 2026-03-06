'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { MargemIndicator } from '@/components/common/margem-indicator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { contratosService } from '@/lib/services/contratos.service'
import { itensService, type ItemWithContrato } from '@/lib/services/itens.service'
import { type ContratoWithRelations } from '@/types/models'
import { useEmpresa } from '@/contexts/empresa-context'
import toast from 'react-hot-toast'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getVigenciaFim(contrato: ContratoWithRelations): string {
  return contrato.prorrogado && contrato.data_vigencia_fim_prorrogacao
    ? contrato.data_vigencia_fim_prorrogacao
    : contrato.data_vigencia_fim
}

function getDiasRestantes(dataVigencia: string): number {
  const hoje = new Date()
  const fim = new Date(dataVigencia + 'T12:00:00')
  return Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function getMesAno(dataVigencia: string): string {
  const d = new Date(dataVigencia + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function corDias(dias: number): string {
  if (dias <= 15) return 'text-red-600 font-semibold'
  if (dias <= 30) return 'text-amber-600 font-semibold'
  return 'text-slate-500'
}

// Agrupa contratos por mês/ano de vencimento
function agruparPorMes(contratos: ContratoWithRelations[]): { mes: string; itens: ContratoWithRelations[] }[] {
  const mapa = new Map<string, ContratoWithRelations[]>()
  for (const c of contratos) {
    const mes = getMesAno(getVigenciaFim(c))
    if (!mapa.has(mes)) mapa.set(mes, [])
    mapa.get(mes)!.push(c)
  }
  return Array.from(mapa.entries()).map(([mes, itens]) => ({ mes, itens }))
}

// ─── Sub-componente: Grupo de mês expansível ──────────────────────────────────

function MesGroup({ mes, contratos }: { mes: string; contratos: ContratoWithRelations[] }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {/* Header clicável */}
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          {aberto ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
          <span className="text-sm font-medium capitalize text-slate-800">{mes}</span>
        </div>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
          {contratos.length} contrato{contratos.length !== 1 ? 's' : ''}
        </span>
      </button>

      {/* Lista expandida */}
      {aberto && (
        <div className="divide-y divide-slate-100 border-t border-slate-100">
          {contratos.map((c) => {
            const dias = getDiasRestantes(getVigenciaFim(c))
            return (
              <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/contratos/${c.id}`}
                    className="truncate text-sm font-medium text-blue-600 hover:underline"
                  >
                    {c.numero_contrato}
                  </Link>
                  <p className="truncate text-xs text-slate-500">{c.orgao_publico}</p>
                </div>
                <span className={`ml-4 whitespace-nowrap text-xs ${corDias(dias)}`}>
                  {dias === 1 ? '1 dia' : `${dias} dias`}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Sub-componente: Card compacto de margem baixa ────────────────────────────

function MargemBaixaCard({
  itens,
  margemAlerta,
}: {
  itens: ItemWithContrato[]
  margemAlerta: number
}) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setSheetOpen(true)}
        className="flex w-full items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left transition-colors hover:bg-red-100"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {itens.length} {itens.length === 1 ? 'item' : 'itens'} com margem abaixo de {margemAlerta}%
            </p>
            <p className="text-xs text-red-600">Clique para ver detalhes</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-red-400" />
      </button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Itens com margem abaixo de {margemAlerta}%
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-2">
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
        </SheetContent>
      </Sheet>
    </>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function DashboardAlertas() {
  const { margemAlerta } = useEmpresa()
  const [contratos, setContratos] = useState<ContratoWithRelations[]>([])
  const [itens, setItens] = useState<ItemWithContrato[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [contratosResult, itensResult] = await Promise.all([
          contratosService.getExpiringSoon(90),
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
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const gruposMes = agruparPorMes(contratos)
  const semAlertas = contratos.length === 0 && itens.length === 0

  if (semAlertas) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <span className="text-green-500 text-base">✓</span>
        Nenhum alerta no momento
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Contratos vencendo — agrupados por mês (90 dias) */}
      {gruposMes.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <Clock className="h-3 w-3" />
            Vencendo nos próximos 90 dias ({contratos.length})
          </p>
          <div className="space-y-2">
            {gruposMes.map(({ mes, itens: cs }) => (
              <MesGroup key={mes} mes={mes} contratos={cs} />
            ))}
          </div>
        </div>
      )}

      {/* Itens com margem baixa — card compacto + sheet */}
      {itens.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-700">
            <AlertTriangle className="h-3 w-3" />
            Margem abaixo do limite
          </p>
          <MargemBaixaCard itens={itens} margemAlerta={margemAlerta} />
        </div>
      )}
    </div>
  )
}
