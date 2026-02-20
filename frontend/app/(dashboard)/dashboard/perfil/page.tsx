'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ProtectedRoute } from '@/components/common/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { useEmpresa } from '@/contexts/empresa-context'
import { createClient } from '@/lib/supabase/client'
import { PERFIS } from '@/lib/constants/perfis'
import toast from 'react-hot-toast'

const PERFIL_LABELS: Record<string, string> = {
  admin: 'Administrador',
  juridico: 'Jurídico',
  financeiro: 'Financeiro',
  compras: 'Compras',
  logistica: 'Logística',
}

// ─── Schema: Dados básicos ──────────────────────────────────────────────────
const dadosSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
})

// ─── Schema: Alterar senha ──────────────────────────────────────────────────
const senhaSchema = z
  .object({
    nova_senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmar_senha: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.nova_senha === data.confirmar_senha, {
    message: 'As senhas não coincidem',
    path: ['confirmar_senha'],
  })

type DadosFormData = z.infer<typeof dadosSchema>
type SenhaFormData = z.infer<typeof senhaSchema>

export default function PerfilPage() {
  const { usuario, refreshUser } = useAuth()
  const { empresa } = useEmpresa()
  const [savingDados, setSavingDados] = useState(false)
  const [savingSenha, setSavingSenha] = useState(false)

  const dadosForm = useForm<DadosFormData>({
    resolver: zodResolver(dadosSchema),
    defaultValues: {
      nome: usuario?.nome ?? '',
    },
  })

  const senhaForm = useForm<SenhaFormData>({
    resolver: zodResolver(senhaSchema),
    defaultValues: {
      nova_senha: '',
      confirmar_senha: '',
    },
  })

  async function onSaveDados(values: DadosFormData) {
    if (!usuario) return
    setSavingDados(true)
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ nome: values.nome })
        .eq('id', usuario.id)

      if (error) throw new Error(error.message)
      await refreshUser()
      toast.success('Dados atualizados com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar dados')
    } finally {
      setSavingDados(false)
    }
  }

  async function onSaveSenha(values: SenhaFormData) {
    setSavingSenha(true)
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.updateUser({ password: values.nova_senha })
      if (error) throw new Error(error.message)
      senhaForm.reset()
      toast.success('Senha alterada com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar senha')
    } finally {
      setSavingSenha(false)
    }
  }

  const inicial = usuario?.nome?.charAt(0)?.toUpperCase() ?? 'U'

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Meu Perfil</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie seus dados pessoais e segurança da conta.
          </p>
        </div>

        {/* Card dados da conta */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              Dados da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Avatar */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-navy text-xl font-bold text-white">
                {inicial}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{usuario?.nome ?? '—'}</p>
                <p className="text-sm text-slate-500">{usuario?.email ?? '—'}</p>
              </div>
            </div>

            <Form {...dadosForm}>
              <form
                onSubmit={dadosForm.handleSubmit(onSaveDados)}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Nome — editável */}
                  <FormField
                    control={dadosForm.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Seu nome completo"
                            {...field}
                            disabled={savingDados}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email — read-only */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium leading-none text-slate-700">E-mail</p>
                    <Input
                      value={usuario?.email ?? ''}
                      disabled
                      className="bg-slate-50 text-slate-500"
                    />
                    <p className="text-xs text-slate-400">
                      Alteração de e-mail requer verificação — entre em contato com o administrador.
                    </p>
                  </div>

                  {/* Perfil — read-only */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium leading-none text-slate-700">Perfil</p>
                    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <Badge variant="outline" className="bg-slate-100 text-slate-700">
                        {usuario?.perfil ? PERFIL_LABELS[usuario.perfil] : '—'}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        Gerenciado pelo administrador
                      </span>
                    </div>
                  </div>

                  {/* Empresa — read-only */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium leading-none text-slate-700">Empresa</p>
                    <Input
                      value={empresa?.nome_fantasia ?? empresa?.razao_social ?? '—'}
                      disabled
                      className="bg-slate-50 text-slate-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={savingDados}
                    className="bg-brand-navy hover:bg-brand-navy/90"
                  >
                    {savingDados ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Card segurança */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">Segurança</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...senhaForm}>
              <form
                onSubmit={senhaForm.handleSubmit(onSaveSenha)}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Nova senha */}
                  <FormField
                    control={senhaForm.control}
                    name="nova_senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Senha *</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            {...field}
                            disabled={savingSenha}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirmar senha */}
                  <FormField
                    control={senhaForm.control}
                    name="confirmar_senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nova Senha *</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Repita a nova senha"
                            {...field}
                            disabled={savingSenha}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={savingSenha}
                    className="bg-brand-navy hover:bg-brand-navy/90"
                  >
                    {savingSenha ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
