'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProtectedRoute } from '@/components/common/protected-route'
import { EntregasTable } from '@/components/tables/entregas-table'
import { entregasService, type EntregaWithRelations } from '@/lib/services/entregas.service'
import { useAuth } from '@/contexts/auth-context'
import { PERFIS, canRegisterEntrega } from '@/lib/constants/perfis'
import toast from 'react-hot-toast'

export default function EntregasPage() {
  const { usuario } = useAuth()

  const [entregas, setEntregas] = useState<EntregaWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  const podeRegistrar = usuario ? canRegisterEntrega(usuario.perfil) : false

  useEffect(() => {
    async function load() {
      try {
        const data = await entregasService.getAll()
        setEntregas(data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar entregas')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = busca.toLowerCase().trim()
    if (!term) return entregas
    return entregas.filter(
      (e) =>
        e.af?.numero_af?.toLowerCase().includes(term) ||
        e.nf_saida_numero?.toLowerCase().includes(term),
    )
  }, [entregas, busca])

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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Entregas</h1>
            <p className="mt-1 text-sm text-slate-500">
              Registro e acompanhamento de entregas vinculadas às AFs.
            </p>
          </div>
          {podeRegistrar && (
            <Button
              variant="outline"
              className="shrink-0"
              asChild
            >
              <Link href="/dashboard/autorizacoes">
                Registrar via AF
              </Link>
            </Button>
          )}
        </div>

        {/* Filtro */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por AF ou NF saída..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabela */}
        <EntregasTable entregas={filtered} loading={loading} />
      </div>
    </ProtectedRoute>
  )
}
