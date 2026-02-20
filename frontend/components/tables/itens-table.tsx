'use client'

import Link from 'next/link'
import { Pencil } from 'lucide-react'
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
import { MargemIndicator } from '@/components/common/margem-indicator'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { type ItemContrato } from '@/types/models'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface ItensTableProps {
  contratoId: string
  itens: ItemContrato[]
  loading: boolean
  isAdmin: boolean
  onDelete: (id: string) => Promise<void>
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

export function ItensTable({ contratoId, itens, loading, isAdmin, onDelete }: ItensTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50 hover:bg-slate-50">
          <TableHead className="font-semibold text-slate-700">#</TableHead>
          <TableHead className="font-semibold text-slate-700">Descrição</TableHead>
          <TableHead className="font-semibold text-slate-700">Un.</TableHead>
          <TableHead className="text-right font-semibold text-slate-700">Qtd</TableHead>
          <TableHead className="text-right font-semibold text-slate-700">Saldo</TableHead>
          <TableHead className="text-right font-semibold text-slate-700">Vlr Unit.</TableHead>
          <TableHead className="font-semibold text-slate-700">Margem</TableHead>
          {isAdmin && (
            <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <SkeletonRows />
        ) : itens.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={isAdmin ? 8 : 7}
              className="py-12 text-center text-sm text-slate-400"
            >
              Nenhum item cadastrado neste contrato
            </TableCell>
          </TableRow>
        ) : (
          itens.map((item) => (
            <TableRow key={item.id} className="hover:bg-slate-50">
              <TableCell className="text-sm text-slate-500">
                {item.numero_item ?? '—'}
              </TableCell>
              <TableCell className="max-w-xs text-sm font-medium text-slate-900">
                <span className="line-clamp-2">{item.descricao}</span>
              </TableCell>
              <TableCell className="text-sm text-slate-600">{item.unidade}</TableCell>
              <TableCell className="text-right text-sm text-slate-700">
                {item.quantidade.toLocaleString('pt-BR')}
              </TableCell>
              <TableCell className="text-right text-sm text-slate-700">
                {item.saldo_quantidade.toLocaleString('pt-BR')}
              </TableCell>
              <TableCell className="text-right font-mono text-sm text-slate-700">
                {formatCurrency(item.valor_unitario)}
              </TableCell>
              <TableCell>
                <MargemIndicator margem={item.margem_atual} showIcon={false} />
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/contratos/${contratoId}/itens/${item.id}/editar`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          ✕
                        </Button>
                      }
                      title="Remover item?"
                      description={`"${item.descricao}" será removido do contrato. Esta ação não pode ser desfeita pelo usuário.`}
                      confirmLabel="Remover"
                      onConfirm={() => onDelete(item.id)}
                    />
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
