'use client'

import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/common/protected-route'
import { InviteUserModal } from '@/components/modals/invite-user-modal'
import { createClient } from '@/lib/supabase/client'
import { PERFIS } from '@/lib/constants/perfis'
import toast from 'react-hot-toast'

type UsuarioRow = {
  id: string
  email: string
  nome: string
  perfil: 'admin' | 'juridico' | 'financeiro' | 'compras' | 'logistica'
  ativo: boolean
  created_at: string
}

const PERFIL_LABELS: Record<UsuarioRow['perfil'], string> = {
  admin: 'Admin',
  juridico: 'Jurídico',
  financeiro: 'Financeiro',
  compras: 'Compras',
  logistica: 'Logística',
}

const PERFIL_COLORS: Record<UsuarioRow['perfil'], string> = {
  admin: 'border-transparent bg-purple-100 text-purple-800',
  juridico: 'bg-blue-50 text-blue-700 border-blue-200',
  financeiro: 'bg-green-50 text-green-700 border-green-200',
  compras: 'bg-amber-50 text-amber-700 border-amber-200',
  logistica: 'bg-slate-100 text-slate-700 border-slate-200',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function loadUsuarios() {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, email, nome, perfil, ativo, created_at')
        .order('nome', { ascending: true })

      if (error) throw new Error(error.message)
      setUsuarios((data ?? []) as UsuarioRow[])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsuarios()
  }, [])

  async function handleToggleAtivo(usuario: UsuarioRow) {
    setTogglingId(usuario.id)
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ ativo: !usuario.ativo })
        .eq('id', usuario.id)
        .select('id, email, nome, perfil, ativo, created_at')
        .single()

      if (error) throw new Error(error.message)
      setUsuarios((prev) => prev.map((u) => (u.id === data.id ? (data as UsuarioRow) : u)))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleInviteSuccess() {
    setLoading(true)
    await loadUsuarios()
  }

  return (
    <ProtectedRoute allowedPerfis={[PERFIS.admin]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Usuários</h1>
            <p className="mt-1 text-sm text-slate-500">
              Gerenciamento de usuários e perfis de acesso da empresa.
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="shrink-0 bg-brand-navy hover:bg-brand-navy/90"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar Usuário
          </Button>
        </div>

        {/* Tabela */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              Usuários Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : usuarios.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500">Nenhum usuário cadastrado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Nome</TableHead>
                    <TableHead className="font-semibold text-slate-700">E-mail</TableHead>
                    <TableHead className="font-semibold text-slate-700">Perfil</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Criado em</TableHead>
                    <TableHead className="font-semibold text-slate-700">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => (
                    <TableRow key={usuario.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-sm text-slate-900">
                        {usuario.nome}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{usuario.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={PERFIL_COLORS[usuario.perfil]}
                        >
                          {PERFIL_LABELS[usuario.perfil]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            usuario.ativo
                              ? 'border-transparent bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }
                        >
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(usuario.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={togglingId === usuario.id}
                          onClick={() => handleToggleAtivo(usuario)}
                          className={usuario.ativo ? 'text-amber-600' : 'text-green-600'}
                        >
                          {togglingId === usuario.id
                            ? '...'
                            : usuario.ativo
                              ? 'Desativar'
                              : 'Ativar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <InviteUserModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleInviteSuccess}
      />
    </ProtectedRoute>
  )
}
