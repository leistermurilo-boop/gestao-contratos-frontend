'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProtectedRoute } from '@/components/common/protected-route'
import { AFTable } from '@/components/tables/af-table'
import { afService, type AFWithRelations, type FiltrosAF } from '@/lib/services/af.service'
import { useAuth } from '@/contexts/auth-context'
import { PERFIS, canEmitAF } from '@/lib/constants/perfis'
import { type AutorizacaoFornecimento } from '@/types/models'
import toast from 'react-hot-toast'

type StatusAF = AutorizacaoFornecimento['status']

const STATUS_OPTIONS: { value: StatusAF | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
]

export default function AutorizacoesPage() {
  const router = useRouter()
  const { usuario } = useAuth()

  const [afs, setAfs] = useState<AFWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<StatusAF | 'todos'>('todos')
  const [busca, setBusca] = useState('')

  const canEmitir = usuario ? canEmitAF(usuario.perfil) : false

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const filtros: FiltrosAF = {}
        if (filtroStatus !== 'todos') {
          filtros.status = filtroStatus
        }
        const data = await afService.getAll(filtros)
        setAfs(data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar autorizações')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filtroStatus])

  const filtered = useMemo(() => {
    const term = busca.toLowerCase().trim()
    if (!term) return afs
    return afs.filter((af) => af.numero_af?.toLowerCase().includes(term))
  }, [afs, busca])

  return (
    <ProtectedRoute
      allowedPerfis={[
        PERFIS.admin,
        PERFIS.juridico,
        PERFIS.financeiro,
        PERFIS.compras,
        PERFIS.logistica,
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Autorizações de Fornecimento
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Gestão de autorizações de fornecimento e controle de saldo.
            </p>
          </div>
          {canEmitir && (
            <Button
              onClick={() => router.push('/dashboard/autorizacoes/nova')}
              className="shrink-0 bg-brand-navy hover:bg-brand-navy/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Emitir AF
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por número da AF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={filtroStatus}
            onValueChange={(v) => setFiltroStatus(v as StatusAF | 'todos')}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <AFTable afs={filtered} loading={loading} canEmitir={canEmitir} />
      </div>
    </ProtectedRoute>
  )
}
