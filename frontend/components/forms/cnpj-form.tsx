'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { cnpjsService } from '@/lib/services/cnpjs.service'
import { useEmpresa } from '@/contexts/empresa-context'
import { type Cnpj } from '@/types/models'
import toast from 'react-hot-toast'

const cnpjSchema = z.object({
  cnpj_numero: z
    .string()
    .regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos (apenas números, sem pontuação)'),
  tipo: z.enum(['matriz', 'filial']),
  razao_social: z.string().min(1, 'Razão social obrigatória'),
  nome_fantasia: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z
    .string()
    .length(2, 'UF deve ter 2 letras')
    .optional()
    .nullable()
    .or(z.literal('')),
})

type CnpjFormData = z.infer<typeof cnpjSchema>

interface CnpjFormProps {
  mode: 'create' | 'edit'
  cnpj?: Cnpj
  onSuccess: () => void
  onCancel: () => void
}

export function CnpjForm({ mode, cnpj, onSuccess, onCancel }: CnpjFormProps) {
  const { empresa } = useEmpresa()

  const form = useForm<CnpjFormData>({
    resolver: zodResolver(cnpjSchema),
    defaultValues: {
      cnpj_numero: cnpj?.cnpj_numero ?? '',
      tipo: cnpj?.tipo ?? 'filial',
      razao_social: cnpj?.razao_social ?? '',
      nome_fantasia: cnpj?.nome_fantasia ?? '',
      cidade: cnpj?.cidade ?? '',
      estado: cnpj?.estado ?? '',
    },
  })

  const { formState: { isSubmitting } } = form

  async function onSubmit(values: CnpjFormData) {
    try {
      const payload = {
        cnpj_numero: values.cnpj_numero,
        tipo: values.tipo,
        razao_social: values.razao_social,
        nome_fantasia: values.nome_fantasia || null,
        cidade: values.cidade || null,
        estado: values.estado || null,
      }

      if (mode === 'create') {
        if (!empresa?.id) {
          toast.error('Empresa não identificada. Recarregue a página.')
          return
        }
        // ⚠️ cnpjs Insert exige empresa_id explicitamente (RLS não injeta no INSERT)
        await cnpjsService.create({ ...payload, empresa_id: empresa.id })
        toast.success('CNPJ adicionado com sucesso!')
      } else {
        await cnpjsService.update(cnpj!.id, payload)
        toast.success('CNPJ atualizado com sucesso!')
      }

      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar CNPJ')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* CNPJ número */}
          <FormField
            control={form.control}
            name="cnpj_numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ * (apenas números)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="00000000000000"
                    maxLength={14}
                    {...field}
                    disabled={isSubmitting || mode === 'edit'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo */}
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="matriz">Matriz</SelectItem>
                    <SelectItem value="filial">Filial</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Razão social */}
          <FormField
            control={form.control}
            name="razao_social"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Razão Social *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da empresa conforme CNPJ" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nome fantasia */}
          <FormField
            control={form.control}
            name="nome_fantasia"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nome Fantasia</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nome fantasia (opcional)"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cidade */}
          <FormField
            control={form.control}
            name="cidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: São Paulo"
                    maxLength={100}
                    {...field}
                    value={field.value ?? ''}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Estado */}
          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UF</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: SP"
                    maxLength={2}
                    className="uppercase"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            {isSubmitting
              ? 'Salvando...'
              : mode === 'create'
                ? 'Adicionar CNPJ'
                : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
