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
import { entregasService } from '@/lib/services/entregas.service'
import { uploadService } from '@/lib/services/upload.service'
import { useEmpresa } from '@/contexts/empresa-context'
import { BUCKETS } from '@/lib/constants/buckets'
import { type AFWithRelations } from '@/lib/services/af.service'
import toast from 'react-hot-toast'

const entregaSchema = z.object({
  quantidade_entregue: z.coerce
    .number({ invalid_type_error: 'Informe uma quantidade' })
    .positive('Deve ser maior que zero'),
  data_entrega: z.string().min(1, 'Data obrigatória'),
  nf_saida_numero: z.string().optional().nullable(),
  observacao: z.string().optional(),
})

type EntregaFormData = z.infer<typeof entregaSchema>

function getTodayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface EntregaFormProps {
  afId: string
  af: AFWithRelations
}

export function EntregaForm({ afId, af }: EntregaFormProps) {
  const router = useRouter()
  const { empresa } = useEmpresa()
  const [nfFile, setNfFile] = useState<File | null>(null)

  const form = useForm<EntregaFormData>({
    resolver: zodResolver(entregaSchema),
    defaultValues: {
      quantidade_entregue: '' as unknown as number,
      data_entrega: getTodayLocal(),
      nf_saida_numero: '',
      observacao: '',
    },
  })

  const { formState: { isSubmitting } } = form

  async function onSubmit(values: EntregaFormData) {
    try {
      // 1. Upload NF Saída se arquivo selecionado
      let anexoNfUrl: string | null = null
      if (nfFile) {
        if (!empresa?.id) {
          toast.error('Empresa não identificada. Recarregue a página.')
          return
        }
        const result = await uploadService.upload(BUCKETS.NF_SAIDA, empresa.id, nfFile)
        anexoNfUrl = result.url
      }

      // 2. Criar entrega — service valida saldo da AF internamente
      // ⚠️ NUNCA enviar empresa_id — RLS injeta (Decisão #1)
      // ⚠️ Trigger processar_entrega() atualiza saldos no backend (Decisão #3)
      await entregasService.create({
        af_id: afId,
        quantidade_entregue: values.quantidade_entregue,
        data_entrega: values.data_entrega,
        nf_saida_numero: values.nf_saida_numero || null,
        observacao: values.observacao || null,
        anexo_nf_url: anexoNfUrl,
      })

      toast.success('Entrega registrada com sucesso!')
      router.refresh()
      router.push(`/dashboard/autorizacoes/${afId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar entrega')
    }
  }

  return (
    <Form {...form}>
      {/* Contexto da AF */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span>
            <span className="font-medium text-slate-500">AF:</span>{' '}
            <span className="font-semibold text-slate-900">{af.numero_af}</span>
          </span>
          {af.item && (
            <span>
              <span className="font-medium text-slate-500">Item:</span>{' '}
              <span className="text-slate-700">{af.item.descricao}</span>
            </span>
          )}
          <span>
            <span className="font-medium text-slate-500">Saldo disponível:</span>{' '}
            {/* ⚠️ saldo_af é GENERATED ALWAYS — exibir do banco, nunca recalcular */}
            <span className="font-semibold text-slate-900">
              {af.saldo_af.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}{' '}
              {af.item?.unidade ?? ''}
            </span>
          </span>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Quantidade entregue */}
          <FormField
            control={form.control}
            name="quantidade_entregue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade Entregue *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="0"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de entrega */}
          <FormField
            control={form.control}
            name="data_entrega"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Entrega *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Número NF Saída */}
          <FormField
            control={form.control}
            name="nf_saida_numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº NF Saída</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 000456"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isSubmitting}
                  />
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
                    placeholder="Informações adicionais sobre esta entrega..."
                    rows={3}
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Upload NF Saída */}
        <div className="space-y-2">
          <p className="text-sm font-medium leading-none">
            Nota Fiscal de Saída{' '}
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
            onClick={() => router.push(`/dashboard/autorizacoes/${afId}`)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            {isSubmitting ? 'Registrando...' : 'Registrar Entrega'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
