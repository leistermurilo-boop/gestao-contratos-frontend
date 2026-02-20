'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/common/protected-route'
import { StatusBadge } from '@/components/common/status-badge'
import { ReajusteForm } from '@/components/forms/reajuste-form'
import { reajustesService, type ReajusteWithRelations } from '@/lib/services/reajustes.service'
import { PERFIS } from '@/lib/constants/perfis'
import { type Reajuste } from '@/types/models'
import toast from 'react-hot-toast'

type StatusReajuste = Reajuste['status']

const STATUS_OPCOES: { value: StatusReajuste; label: string }[] = [
  { value: 'solicitado', label: 'Solicitado' },
  { value: 'analise', label: 'Em Análise' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'rejeitado', label: 'Rejeitado' },
  { value: 'implementado', label: 'Implementado' },
]

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR')
}

export default function ReajustesPage() {
  const [reajustes, setReajustes] = useState<ReajusteWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function loadReajustes() {
    try {
      const data = await reajustesService.getAll()
      setReajustes(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar reajustes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReajustes()
  }, [])

  async function handleStatusChange(id: string, novoStatus: StatusReajuste) {
    setUpdatingId(id)
    try {
      const updated = await reajustesService.updateStatus(id, novoStatus)
      setReajustes((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar status')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleFormSuccess() {
    setShowForm(false)
    setLoading(true)
    await loadReajustes()
  }

  return (
    <ProtectedRoute allowedPerfis={[PERFIS.admin, PERFIS.juridico]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reajustes</h1>
            <p className="mt-1 text-sm text-slate-500">
              Gestão de reajustes contratuais por índice ou percentual.
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="shrink-0 bg-brand-navy hover:bg-brand-navy/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Solicitar Reajuste
            </Button>
          )}
        </div>

        {/* Formulário inline */}
        {showForm && (
          <Card className="border-brand-navy/20 bg-slate-50">
            <CardHeader className="border-b border-slate-200 pb-4">
              <CardTitle className="text-base font-semibold text-slate-800">
                Solicitar Reajuste
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ReajusteForm
                onSuccess={handleFormSuccess}
                onCancel={() => setShowForm(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Tabela */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              Reajustes Registrados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : reajustes.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500">Nenhum reajuste registrado.</p>
                <p className="mt-1 text-xs text-slate-400">
                  Solicite o primeiro reajuste usando o botão acima.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Contrato</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tipo</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">%</TableHead>
                    <TableHead className="font-semibold text-slate-700">Índice Ref.</TableHead>
                    <TableHead className="font-semibold text-slate-700">Data Ref.</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Atualizar Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reajustes.map((reajuste) => (
                    <TableRow key={reajuste.id} className="hover:bg-slate-50">
                      <TableCell className="text-sm text-slate-700">
                        <div className="font-medium">
                          {reajuste.contrato?.numero_contrato ?? '—'}
                        </div>
                        {reajuste.contrato?.orgao_publico && (
                          <div className="text-xs text-slate-400 line-clamp-1">
                            {reajuste.contrato.orgao_publico}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-700">
                        {reajuste.tipo}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-slate-700">
                        {reajuste.percentual.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}%
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {reajuste.indice_referencia ?? '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-600">
                        {formatDate(reajuste.data_referencia)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={reajuste.status} />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={reajuste.status}
                          onValueChange={(v) =>
                            handleStatusChange(reajuste.id, v as StatusReajuste)
                          }
                          disabled={updatingId === reajuste.id}
                        >
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPCOES.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
