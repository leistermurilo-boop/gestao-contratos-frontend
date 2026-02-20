'use client'

import { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/common/file-upload'
import { contratosService } from '@/lib/services/contratos.service'
import { reajustesService } from '@/lib/services/reajustes.service'
import { uploadService } from '@/lib/services/upload.service'
import { useEmpresa } from '@/contexts/empresa-context'
import { BUCKETS } from '@/lib/constants/buckets'
import { type ContratoWithRelations } from '@/types/models'
import toast from 'react-hot-toast'

const reajusteSchema = z.object({
  contrato_id: z.string().min(1, 'Selecione um contrato'),
  tipo: z.string().min(1, 'Informe o tipo de reajuste'),
  percentual: z.coerce
    .number({ invalid_type_error: 'Informe um percentual' })
    .positive('Deve ser maior que zero'),
  indice_referencia: z.string().optional().nullable(),
  data_referencia: z.string().min(1, 'Data de referência obrigatória'),
  data_aplicacao: z.string().optional().nullable(),
  justificativa: z.string().optional().nullable(),
})

type ReajusteFormData = z.infer<typeof reajusteSchema>

interface ReajusteFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function ReajusteForm({ onSuccess, onCancel }: ReajusteFormProps) {
  const { empresa } = useEmpresa()
  const [contratos, setContratos] = useState<ContratoWithRelations[]>([])
  const [loadingContratos, setLoadingContratos] = useState(true)
  const [docFile, setDocFile] = useState<File | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await contratosService.getAll()
        // Somente contratos ativos
        setContratos(data.filter((c) => c.status === 'ativo'))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar contratos')
      } finally {
        setLoadingContratos(false)
      }
    }
    load()
  }, [])

  const form = useForm<ReajusteFormData>({
    resolver: zodResolver(reajusteSchema),
    defaultValues: {
      contrato_id: '',
      tipo: '',
      percentual: 0,
      indice_referencia: '',
      data_referencia: '',
      data_aplicacao: '',
      justificativa: '',
    },
  })

  const { formState: { isSubmitting } } = form

  async function onSubmit(values: ReajusteFormData) {
    try {
      // Upload documentação se selecionada
      let documentacaoUrl: string | null = null
      if (docFile) {
        if (!empresa?.id) {
          toast.error('Empresa não identificada. Recarregue a página.')
          return
        }
        const result = await uploadService.upload(BUCKETS.REAJUSTES, empresa.id, docFile)
        documentacaoUrl = result.url
      }

      // ⚠️ NUNCA enviar empresa_id — RLS injeta (Decisão #1)
      await reajustesService.create({
        contrato_id: values.contrato_id,
        tipo: values.tipo,
        percentual: values.percentual,
        indice_referencia: values.indice_referencia || null,
        data_referencia: values.data_referencia,
        data_aplicacao: values.data_aplicacao || null,
        justificativa: values.justificativa || null,
        documentacao_url: documentacaoUrl,
        status: 'solicitado',
      })

      toast.success('Reajuste solicitado com sucesso!')
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao solicitar reajuste')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Contrato */}
          <FormField
            control={form.control}
            name="contrato_id"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Contrato *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={loadingContratos || isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={loadingContratos ? 'Carregando...' : 'Selecione o contrato'}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contratos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.numero_contrato} — {c.orgao_publico}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo de reajuste */}
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Reajuste *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: IPCA, INPC, IGPM"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Percentual */}
          <FormField
            control={form.control}
            name="percentual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Percentual (%) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 5.32"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Índice de referência */}
          <FormField
            control={form.control}
            name="indice_referencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Índice de Referência</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: IPCA out/2025"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de referência */}
          <FormField
            control={form.control}
            name="data_referencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Referência *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de aplicação */}
          <FormField
            control={form.control}
            name="data_aplicacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Aplicação</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Justificativa */}
          <FormField
            control={form.control}
            name="justificativa"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Justificativa</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Justificativa para o reajuste..."
                    rows={3}
                    {...field}
                    value={field.value ?? ''}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Upload documentação */}
        <div className="space-y-2">
          <p className="text-sm font-medium leading-none">
            Documentação{' '}
            <span className="font-normal text-slate-400">(opcional — .pdf, .doc, .docx)</span>
          </p>
          <FileUpload
            accept=".pdf,.doc,.docx"
            maxSizeMB={10}
            file={docFile}
            onFileSelect={setDocFile}
            onRemove={() => setDocFile(null)}
            disabled={isSubmitting}
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
            {isSubmitting ? 'Solicitando...' : 'Solicitar Reajuste'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
