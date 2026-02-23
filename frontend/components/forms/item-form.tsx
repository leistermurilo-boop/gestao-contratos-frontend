'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { itensService } from '@/lib/services/itens.service'
import { type ItemContrato } from '@/types/models'
import toast from 'react-hot-toast'

const itemSchema = z.object({
  numero_item: z.coerce.number().int().positive('Deve ser um número positivo').optional().or(z.literal('')),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  quantidade: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  valor_unitario: z.coerce.number().positive('Valor deve ser maior que zero'),
})

type ItemFormData = z.infer<typeof itemSchema>

interface ItemFormProps {
  mode?: 'create' | 'edit'
  /** ID do contrato — obrigatório no create */
  contratoId: string
  /** cnpj_id do contrato — obrigatório no create */
  cnpjId?: string
  /** ID do item — obrigatório no edit */
  itemId?: string
  /** Dados existentes — obrigatório no edit */
  initialData?: ItemContrato
}

export function ItemForm({ mode = 'create', contratoId, cnpjId, itemId, initialData }: ItemFormProps) {
  const router = useRouter()

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      numero_item: '',
      descricao: '',
      unidade: '',
      quantidade: 0,
      valor_unitario: 0,
    },
  })

  const { reset, formState: { isSubmitting } } = form

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        numero_item: initialData.numero_item ?? '',
        descricao: initialData.descricao,
        unidade: initialData.unidade,
        quantidade: initialData.quantidade,
        valor_unitario: initialData.valor_unitario,
      })
    }
  }, [mode, initialData, reset])

  async function onSubmit(values: ItemFormData) {
    try {
      if (mode === 'edit' && itemId) {
        // ⚠️ REGRA: NÃO enviar margem_atual, saldo_quantidade, valor_total — GENERATED ALWAYS (Decisão #3)
        await itensService.update(itemId, {
          numero_item: values.numero_item === '' ? null : (values.numero_item as number),
          descricao: values.descricao,
          unidade: values.unidade,
          quantidade: values.quantidade,
          valor_unitario: values.valor_unitario,
        })
        toast.success('Item atualizado com sucesso!')
      } else {
        if (!cnpjId) {
          toast.error('CNPJ do contrato não encontrado')
          return
        }
        await itensService.create({
          contrato_id: contratoId,
          cnpj_id: cnpjId,
          numero_item: values.numero_item === '' ? null : (values.numero_item as number),
          descricao: values.descricao,
          unidade: values.unidade,
          quantidade: values.quantidade,
          valor_unitario: values.valor_unitario,
        })
        toast.success('Item criado com sucesso!')
      }
      router.push(`/dashboard/contratos/${contratoId}/itens`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar item')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Número do item */}
          <FormField
            control={form.control}
            name="numero_item"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número do Item</FormLabel>
                <FormControl>
                  <Input type="number" min="1" placeholder="Ex: 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unidade */}
          <FormField
            control={form.control}
            name="unidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: UN, KG, M²" maxLength={50} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descrição */}
          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Descrição *</FormLabel>
                <FormControl>
                  <Input placeholder="Descrição completa do item" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quantidade */}
          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.001" min="0" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Valor unitário */}
          <FormField
            control={form.control}
            name="valor_unitario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Unitário (R$) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="0,00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/contratos/${contratoId}/itens`)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            {isSubmitting ? 'Salvando...' : mode === 'edit' ? 'Salvar Alterações' : 'Adicionar Item'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
