'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge, type StatusContrato } from '@/components/common/status-badge'
import { contratosService } from '@/lib/services/contratos.service'
import { type ContratoWithRelations } from '@/types/models'
import toast from 'react-hot-toast'

const STATUS_OPTIONS: { value: StatusContrato | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'rescindido', label: 'Rescindido' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'arquivado', label: 'Arquivado' },
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR')
}

function getVigencia(contrato: ContratoWithRelations): string {
  if (contrato.prorrogado && contrato.data_vigencia_fim_prorrogacao) {
    return formatDate(contrato.data_vigencia_fim_prorrogacao)
  }
  return formatDate(contrato.data_vigencia_fim)
}

export function ContratosTable() {
  const [contratos, setContratos] = useState<ContratoWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusContrato | 'todos'>('todos')

  useEffect(() => {
    async function load() {
      try {
        const data = await contratosService.getAll()
        setContratos(data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar contratos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return contratos.filter((c) => {
      const matchSearch =
        !term ||
        c.numero_contrato.toLowerCase().includes(term) ||
        c.orgao_publico.toLowerCase().includes(term)
      const matchStatus = statusFilter === 'todos' || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [contratos, search, statusFilter])

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
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por número ou órgão..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusContrato | 'todos')}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela ou empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-16 text-center">
          <p className="text-sm font-medium text-slate-900">
            {contratos.length === 0 ? 'Nenhum contrato cadastrado' : 'Nenhum resultado encontrado'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {contratos.length === 0
              ? 'Os contratos aparecerão aqui após serem cadastrados.'
              : 'Tente ajustar os filtros de busca.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold text-slate-700">Número</TableHead>
                <TableHead className="font-semibold text-slate-700">Órgão</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Valor Total
                </TableHead>
                <TableHead className="font-semibold text-slate-700">Vigência</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contrato) => (
                <TableRow key={contrato.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Link
                      href={`/dashboard/contratos/${contrato.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {contrato.numero_contrato}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs text-slate-700">
                    <span className="line-clamp-1">{contrato.orgao_publico}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-slate-700">
                    {formatCurrency(contrato.valor_total)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-slate-600">
                    {getVigencia(contrato)}
                    {contrato.prorrogado && (
                      <span className="ml-1.5 text-xs text-amber-600">(prorrogado)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={contrato.status as StatusContrato} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            {filtered.length} contrato{filtered.length !== 1 ? 's' : ''}
            {contratos.length !== filtered.length && ` de ${contratos.length} no total`}
          </div>
        </div>
      )}
    </div>
  )
}
