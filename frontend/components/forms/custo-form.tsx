'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/common/file-upload'
import { custosService } from '@/lib/services/custos.service'
import { uploadService } from '@/lib/services/upload.service'
import { useEmpresa } from '@/contexts/empresa-context'
import { BUCKETS } from '@/lib/constants/buckets'
import toast from 'react-hot-toast'

const custoSchema = z.object({
  data_lancamento: z.string().min(1, 'Data obrigatória'),
  custo_unitario: z.coerce.number({ invalid_type_error: 'Informe um valor' }).positive('Deve ser maior que zero'),
  quantidade: z.coerce.number({ invalid_type_error: 'Informe uma quantidade' }).positive('Deve ser maior que zero'),
  fornecedor: z.string().optional(),
  numero_nf: z.string().optional(),
  observacao: z.string().optional(),
})

type CustoFormData = z.infer<typeof custoSchema>

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

interface CustoFormProps {
  contratoId: string
  itemId: string
}

export function CustoForm({ contratoId, itemId }: CustoFormProps) {
  const router = useRouter()
  const { empresa } = useEmpresa()
  const [nfFile, setNfFile] = useState<File | null>(null)

  const form = useForm<CustoFormData>({
    resolver: zodResolver(custoSchema),
    defaultValues: {
      data_lancamento: getTodayISO(),
      custo_unitario: 0,
      quantidade: 0,
      fornecedor: '',
      numero_nf: '',
      observacao: '',
    },
  })

  const { formState: { isSubmitting } } = form

  async function onSubmit(values: CustoFormData) {
    try {
      // 1. Upload NF se arquivo selecionado
      let nfEntradaUrl: string | null = null
      if (nfFile) {
        if (!empresa?.id) {
          toast.error('Empresa não identificada. Recarregue a página.')
          return
        }
        const result = await uploadService.upload(BUCKETS.NF_ENTRADA, empresa.id, nfFile)
        nfEntradaUrl = result.url
      }

      // 2. Criar custo
      // ⚠️ NUNCA enviar empresa_id — RLS injeta automaticamente (Decisão #1)
      // ⚠️ NUNCA calcular custo_medio ou margem_atual — trigger backend cuida (Decisão #3)
      await custosService.create({
        item_contrato_id: itemId,
        data_lancamento: values.data_lancamento,
        custo_unitario: values.custo_unitario,
        quantidade: values.quantidade,
        fornecedor: values.fornecedor || null,
        numero_nf: values.numero_nf || null,
        nf_entrada_url: nfEntradaUrl,
        observacao: values.observacao || null,
      })

      toast.success('Custo registrado com sucesso!')
      router.refresh()
      router.push(`/dashboard/contratos/${contratoId}/itens/${itemId}/custos`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar custo')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Data de lançamento */}
          <FormField
            control={form.control}
            name="data_lancamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Lançamento *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fornecedor */}
          <FormField
            control={form.control}
            name="fornecedor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do fornecedor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Custo unitário */}
          <FormField
            control={form.control}
            name="custo_unitario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custo Unitário (R$) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="0,00" {...field} />
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

          {/* Número NF */}
          <FormField
            control={form.control}
            name="numero_nf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número da NF</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 000123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Observação */}
          <FormField
            control={form.control}
            name="observacao"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Observação</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Informações adicionais sobre este lançamento..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Upload NF de Entrada */}
        <div className="space-y-2">
          <p className="text-sm font-medium leading-none">
            Nota Fiscal de Entrada{' '}
            <span className="font-normal text-slate-400">(opcional)</span>
          </p>
          <FileUpload
            accept=".pdf,.xml"
            maxSizeMB={5}
            file={nfFile}
            onFileSelect={setNfFile}
            onRemove={() => setNfFile(null)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/contratos/${contratoId}/itens/${itemId}/custos`)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            {isSubmitting ? 'Registrando...' : 'Registrar Custo'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
