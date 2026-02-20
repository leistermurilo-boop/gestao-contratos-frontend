'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
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
import { type EntregaWithRelations } from '@/lib/services/entregas.service'

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR')
}

function formatQty(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

interface EntregasTableProps {
  entregas: EntregaWithRelations[]
  loading: boolean
}

export function EntregasTable({ entregas, loading }: EntregasTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (entregas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-16 text-center">
        <p className="text-sm font-medium text-slate-900">Nenhuma entrega registrada.</p>
        <p className="mt-1 text-xs text-slate-500">
          As entregas aparecerão aqui após serem registradas nas AFs.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="font-semibold text-slate-700">Data Entrega</TableHead>
            <TableHead className="font-semibold text-slate-700">AF#</TableHead>
            <TableHead className="font-semibold text-slate-700">Contrato</TableHead>
            <TableHead className="font-semibold text-slate-700">Item</TableHead>
            <TableHead className="text-right font-semibold text-slate-700">Qtd Entregue</TableHead>
            <TableHead className="font-semibold text-slate-700">NF Saída</TableHead>
            <TableHead className="font-semibold text-slate-700">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entregas.map((entrega) => (
            <TableRow key={entrega.id} className="hover:bg-slate-50">
              <TableCell className="whitespace-nowrap text-sm text-slate-700">
                {formatDate(entrega.data_entrega)}
              </TableCell>
              <TableCell className="font-mono text-sm text-slate-700">
                {entrega.af?.numero_af ?? '—'}
              </TableCell>
              <TableCell className="text-sm text-slate-700">
                <span className="line-clamp-1">
                  {entrega.af?.item?.contrato?.numero_contrato ?? '—'}
                </span>
              </TableCell>
              <TableCell className="max-w-xs text-sm text-slate-700">
                <span className="line-clamp-1">
                  {entrega.af?.item
                    ? `${entrega.af.item.numero_item ? `#${entrega.af.item.numero_item} — ` : ''}${entrega.af.item.descricao}`
                    : '—'}
                </span>
              </TableCell>
              <TableCell className="text-right text-sm font-medium text-slate-700">
                {formatQty(entrega.quantidade_entregue)}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {entrega.nf_saida_numero ? (
                  entrega.anexo_nf_url ? (
                    <a
                      href={entrega.anexo_nf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      {entrega.nf_saida_numero}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    entrega.nf_saida_numero
                  )
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={`/dashboard/autorizacoes/${entrega.af_id}`}
                    className="text-blue-600"
                  >
                    Ver AF
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
        {entregas.length} entrega{entregas.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
