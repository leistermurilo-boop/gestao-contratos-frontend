'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/common/status-badge'
import { type AFWithRelations } from '@/lib/services/af.service'

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR')
}

function formatQty(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

interface AFTableProps {
  afs: AFWithRelations[]
  loading: boolean
  canEmitir: boolean
}

export function AFTable({ afs, loading }: AFTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (afs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-16 text-center">
        <p className="text-sm font-medium text-slate-900">
          Nenhuma autorização de fornecimento registrada.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          As AFs emitidas aparecerão aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="font-semibold text-slate-700">AF#</TableHead>
            <TableHead className="font-semibold text-slate-700">Contrato</TableHead>
            <TableHead className="font-semibold text-slate-700">Item</TableHead>
            <TableHead className="text-right font-semibold text-slate-700">Qtd Aut.</TableHead>
            <TableHead className="text-right font-semibold text-slate-700">Qtd Entregue</TableHead>
            <TableHead className="text-right font-semibold text-slate-700">Saldo AF</TableHead>
            <TableHead className="font-semibold text-slate-700">Status</TableHead>
            <TableHead className="font-semibold text-slate-700">Data Emissão</TableHead>
            <TableHead className="font-semibold text-slate-700">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {afs.map((af) => (
            <TableRow key={af.id} className="hover:bg-slate-50">
              <TableCell className="whitespace-nowrap font-mono text-sm text-slate-700">
                {af.numero_af}
              </TableCell>
              <TableCell className="text-sm text-slate-700">
                <span className="line-clamp-1">
                  {af.item?.contrato?.numero_contrato ?? '—'}
                </span>
              </TableCell>
              <TableCell className="max-w-xs text-sm text-slate-700">
                <span className="line-clamp-1">
                  {af.item?.numero_item
                    ? `#${af.item.numero_item} — ${af.item.descricao}`
                    : (af.item?.descricao ?? '—')}
                </span>
              </TableCell>
              <TableCell className="text-right text-sm text-slate-700">
                {formatQty(af.quantidade_autorizada)}
              </TableCell>
              <TableCell className="text-right text-sm text-slate-700">
                {formatQty(af.quantidade_entregue)}
              </TableCell>
              <TableCell className="text-right text-sm font-medium text-slate-700">
                {/* ⚠️ saldo_af é GENERATED ALWAYS — exibir do banco, nunca recalcular */}
                {formatQty(af.saldo_af)}
              </TableCell>
              <TableCell>
                <StatusBadge status={af.status} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-slate-600">
                {af.data_emissao ? formatDate(af.data_emissao) : '—'}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={`/dashboard/autorizacoes/${af.id}`}
                    className="text-blue-600"
                  >
                    Detalhes
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
        {afs.length} autorização{afs.length !== 1 ? 'ões' : ''}
      </div>
    </div>
  )
}
