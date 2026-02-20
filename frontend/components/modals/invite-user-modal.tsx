'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

const inviteSchema = z.object({
  email: z.string().email('E-mail inválido'),
  nome: z.string().min(1, 'Nome obrigatório'),
  perfil: z.enum(['admin', 'juridico', 'financeiro', 'compras', 'logistica'], {
    required_error: 'Selecione um perfil',
  }),
})

type InviteFormData = z.infer<typeof inviteSchema>

const PERFIL_LABELS: Record<InviteFormData['perfil'], string> = {
  admin: 'Administrador',
  juridico: 'Jurídico',
  financeiro: 'Financeiro',
  compras: 'Compras',
  logistica: 'Logística',
}

interface InviteUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InviteUserModal({ open, onOpenChange, onSuccess }: InviteUserModalProps) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      nome: '',
      perfil: undefined,
    },
  })

  async function onSubmit(values: InviteFormData) {
    setSubmitting(true)
    try {
      const response = await fetch('/api/usuarios/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error ?? 'Erro ao enviar convite')
        return
      }

      toast.success('Convite enviado com sucesso!')
      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Erro ao enviar convite. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Usuário</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@empresa.com.br"
                      {...field}
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nome */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome completo"
                      {...field}
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Perfil */}
            <FormField
              control={form.control}
              name="perfil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={submitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o perfil de acesso" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PERFIL_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-brand-navy hover:bg-brand-navy/90"
              >
                {submitting ? 'Enviando...' : 'Enviar Convite'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
