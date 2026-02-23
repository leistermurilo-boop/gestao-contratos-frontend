'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Plus, Upload, Building2 } from 'lucide-react'
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
import { CnpjForm } from '@/components/forms/cnpj-form'
import { cnpjsService } from '@/lib/services/cnpjs.service'
import { uploadService } from '@/lib/services/upload.service'
import { PERFIS } from '@/lib/constants/perfis'
import { BUCKETS } from '@/lib/constants/buckets'
import { useEmpresa } from '@/contexts/empresa-context'
import { createClient } from '@/lib/supabase/client'
import { type Cnpj } from '@/types/models'
import toast from 'react-hot-toast'

function formatCnpj(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export default function EmpresasPage() {
  const { empresa, refreshEmpresa } = useEmpresa()
  const [cnpjs, setCnpjs] = useState<Cnpj[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCnpj, setEditingCnpj] = useState<Cnpj | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !empresa) return

    const validation = uploadService.validateFile(file, BUCKETS.LOGOS)
    if (!validation.valid) {
      toast.error(validation.error ?? 'Arquivo inválido')
      return
    }

    setUploadingLogo(true)
    try {
      const result = await uploadService.upload(BUCKETS.LOGOS, empresa.id, file)
      const supabase = createClient()
      const { error } = await supabase
        .from('empresas')
        .update({ logo_url: result.url })
        .eq('id', empresa.id)

      if (error) throw new Error(error.message)
      await refreshEmpresa()
      toast.success('Logotipo atualizado com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar logotipo')
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  async function loadCnpjs() {
    try {
      const data = await cnpjsService.getAll()
      setCnpjs(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar CNPJs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCnpjs()
  }, [])

  function handleEdit(cnpj: Cnpj) {
    setEditingCnpj(cnpj)
    setShowForm(true)
  }

  function handleCancelForm() {
    setShowForm(false)
    setEditingCnpj(null)
  }

  async function handleFormSuccess() {
    setShowForm(false)
    setEditingCnpj(null)
    setLoading(true)
    await loadCnpjs()
  }

  async function handleToggleAtivo(cnpj: Cnpj) {
    setTogglingId(cnpj.id)
    try {
      const updated = await cnpjsService.toggleAtivo(cnpj.id, !cnpj.ativo)
      setCnpjs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <ProtectedRoute allowedPerfis={[PERFIS.admin]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Gestão de CNPJs
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              CNPJs da empresa associados aos contratos e itens.
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={() => { setEditingCnpj(null); setShowForm(true) }}
              className="shrink-0 bg-brand-navy hover:bg-brand-navy/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar CNPJ
            </Button>
          )}
        </div>

        {/* Card logotipo da empresa */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              Logotipo da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex items-center gap-6">
              {/* Preview */}
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden">
                {empresa?.logo_url ? (
                  <Image
                    src={empresa.logo_url}
                    alt="Logotipo da empresa"
                    width={80}
                    height={80}
                    className="h-20 w-20 object-contain p-1"
                    unoptimized
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-slate-300" />
                )}
              </div>

              {/* Ação */}
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-slate-700">
                  {empresa?.logo_url ? 'Alterar logotipo' : 'Adicionar logotipo'}
                </p>
                <p className="text-xs text-slate-400">
                  PNG, JPG, SVG ou WebP · Máx. 2 MB · Exibido no topo do menu lateral
                </p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg,.webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                  className="mt-1"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  {uploadingLogo ? 'Enviando...' : 'Escolher arquivo'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário inline */}
        {showForm && (
          <Card className="border-brand-navy/20 bg-slate-50">
            <CardHeader className="border-b border-slate-200 pb-4">
              <CardTitle className="text-base font-semibold text-slate-800">
                {editingCnpj ? 'Editar CNPJ' : 'Novo CNPJ'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <CnpjForm
                mode={editingCnpj ? 'edit' : 'create'}
                cnpj={editingCnpj ?? undefined}
                onSuccess={handleFormSuccess}
                onCancel={handleCancelForm}
              />
            </CardContent>
          </Card>
        )}

        {/* Tabela */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              CNPJs Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : cnpjs.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500">Nenhum CNPJ cadastrado.</p>
                <p className="mt-1 text-xs text-slate-400">
                  Adicione o primeiro CNPJ usando o botão acima.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">CNPJ</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tipo</TableHead>
                    <TableHead className="font-semibold text-slate-700">Razão Social</TableHead>
                    <TableHead className="font-semibold text-slate-700">Cidade/UF</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cnpjs.map((cnpj) => (
                    <TableRow key={cnpj.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-sm text-slate-700">
                        {formatCnpj(cnpj.cnpj_numero)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            cnpj.tipo === 'matriz'
                              ? 'border-transparent bg-green-100 text-green-800'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }
                        >
                          {cnpj.tipo === 'matriz' ? 'Matriz' : 'Filial'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        <div className="font-medium">{cnpj.razao_social}</div>
                        {cnpj.nome_fantasia && (
                          <div className="text-xs text-slate-400">{cnpj.nome_fantasia}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {cnpj.cidade && cnpj.estado
                          ? `${cnpj.cidade}/${cnpj.estado}`
                          : cnpj.cidade ?? cnpj.estado ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            cnpj.ativo
                              ? 'border-transparent bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }
                        >
                          {cnpj.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cnpj)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={togglingId === cnpj.id}
                            onClick={() => handleToggleAtivo(cnpj)}
                            className={cnpj.ativo ? 'text-amber-600' : 'text-green-600'}
                          >
                            {togglingId === cnpj.id
                              ? '...'
                              : cnpj.ativo
                                ? 'Desativar'
                                : 'Ativar'}
                          </Button>
                        </div>
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
