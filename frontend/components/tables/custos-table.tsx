'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ExternalLink } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { custosService, type CustoItemWithRelations } from '@/lib/services/custos.service'
import toast from 'react-hot-toast'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR')
}

export function CustosTable() {
  const [custos, setCustos] = useState<CustoItemWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await custosService.getAll()
        setCustos(data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar custos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    if (!term) return custos
    return custos.filter(
      (c) =>
        c.fornecedor?.toLowerCase().includes(term) ||
        c.numero_nf?.toLowerCase().includes(term),
    )
  }, [custos, search])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtro */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por fornecedor ou NF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabela ou empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-16 text-center">
          <p className="text-sm font-medium text-slate-900">
            {custos.length === 0 ? 'Nenhum custo registrado ainda.' : 'Nenhum resultado encontrado'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {custos.length === 0
              ? 'Os lançamentos aparecerão aqui após serem registrados nos itens.'
              : 'Tente ajustar a busca.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold text-slate-700">Data Lançamento</TableHead>
                <TableHead className="font-semibold text-slate-700">Contrato</TableHead>
                <TableHead className="font-semibold text-slate-700">Item</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Custo Unit.</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Qtd</TableHead>
                <TableHead className="font-semibold text-slate-700">Fornecedor</TableHead>
                <TableHead className="font-semibold text-slate-700">NF</TableHead>
                <TableHead className="font-semibold text-slate-700">Histórico</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((custo) => {
                const contratoId = custo.item?.contrato_id
                const itemId = custo.item_contrato_id
                const historicoHref =
                  contratoId
                    ? `/dashboard/contratos/${contratoId}/itens/${itemId}/custos`
                    : null

                return (
                  <TableRow key={custo.id} className="hover:bg-slate-50">
                    <TableCell className="whitespace-nowrap text-sm text-slate-700">
                      {formatDate(custo.data_lancamento)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      <span className="line-clamp-1">
                        {custo.item?.contrato?.numero_contrato ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-slate-700">
                      <span className="line-clamp-1">
                        {custo.item?.numero_item
                          ? `#${custo.item.numero_item} — ${custo.item.descricao}`
                          : (custo.item?.descricao ?? '—')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-slate-700">
                      {formatCurrency(custo.custo_unitario)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-700">
                      {custo.quantidade.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {custo.fornecedor ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {custo.numero_nf ? (
                        custo.nf_entrada_url ? (
                          <a
                            href={custo.nf_entrada_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            {custo.numero_nf}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          custo.numero_nf
                        )
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {historicoHref ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={historicoHref} className="text-blue-600">
                            Ver histórico
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            {filtered.length} lançamento{filtered.length !== 1 ? 's' : ''}
            {custos.length !== filtered.length && ` de ${custos.length} no total`}
          </div>
        </div>
      )}
    </div>
  )
}
