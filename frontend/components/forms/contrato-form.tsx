'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText } from 'lucide-react'
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
import { contratosService } from '@/lib/services/contratos.service'
import { uploadService } from '@/lib/services/upload.service'
import { useEmpresa } from '@/contexts/empresa-context'
import { BUCKETS } from '@/lib/constants/buckets'
import { createClient } from '@/lib/supabase/client'
import { type ContratoWithRelations } from '@/types/models'
import toast from 'react-hot-toast'

const contratoSchema = z
  .object({
    cnpj_id: z.string().min(1, 'Selecione um CNPJ'),
    numero_contrato: z.string().min(1, 'Número é obrigatório'),
    orgao_publico: z.string().min(1, 'Órgão público é obrigatório'),
    valor_total: z.coerce.number().positive('Valor deve ser maior que zero'),
    data_assinatura: z.string().min(1, 'Data de assinatura é obrigatória'),
    data_vigencia_inicio: z.string().min(1, 'Início da vigência é obrigatório'),
    data_vigencia_fim: z.string().min(1, 'Fim da vigência é obrigatório'),
    objeto: z.string().optional(),
    esfera: z.string().optional(),
    indice_reajuste: z.string().optional(),
    cnpj_orgao: z.string().optional(),
  })
  .refine((data) => data.data_vigencia_inicio <= data.data_vigencia_fim, {
    message: 'Início deve ser anterior ao fim da vigência',
    path: ['data_vigencia_fim'],
  })

type ContratoFormData = z.infer<typeof contratoSchema>

interface CnpjOption {
  id: string
  cnpj_numero: string
  razao_social: string
}

interface ContratoFormProps {
  mode?: 'create' | 'edit'
  /** ID do contrato — obrigatório quando mode='edit' */
  contratoId?: string
  /** Dados existentes para pré-preenchimento — obrigatório quando mode='edit' */
  initialData?: ContratoWithRelations
}

export function ContratoForm({ mode = 'create', contratoId, initialData }: ContratoFormProps) {
  const router = useRouter()
  const { empresa } = useEmpresa()
  const [cnpjs, setCnpjs] = useState<CnpjOption[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      cnpj_id: '',
      numero_contrato: '',
      orgao_publico: '',
      valor_total: 0,
      data_assinatura: '',
      data_vigencia_inicio: '',
      data_vigencia_fim: '',
      objeto: '',
      esfera: '',
      indice_reajuste: '',
      cnpj_orgao: '',
    },
  })

  const { reset } = form

  // Pré-preencher form em modo edição
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        cnpj_id: initialData.cnpj_id,
        numero_contrato: initialData.numero_contrato,
        orgao_publico: initialData.orgao_publico,
        valor_total: initialData.valor_total,
        data_assinatura: initialData.data_assinatura,
        data_vigencia_inicio: initialData.data_vigencia_inicio,
        data_vigencia_fim: initialData.data_vigencia_fim,
        objeto: initialData.objeto ?? '',
        esfera: initialData.esfera ?? '',
        indice_reajuste: initialData.indice_reajuste ?? '',
        cnpj_orgao: initialData.cnpj_orgao ?? '',
      })
    }
  }, [mode, initialData, reset])

  // Carregar CNPJs da empresa (RLS filtra automaticamente)
  useEffect(() => {
    async function loadCnpjs() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('cnpjs')
          .select('id, cnpj_numero, razao_social')
          .order('razao_social')
        if (error) throw new Error(error.message)
        setCnpjs(data ?? [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar CNPJs')
      }
    }
    loadCnpjs()
  }, [])

  async function onSubmit(values: ContratoFormData) {
    if (!empresa) {
      toast.error('Empresa não encontrada. Tente recarregar a página.')
      return
    }

    setSubmitting(true)
    try {
      // Upload do documento se selecionado
      // ⚠️ REGRA UPLOAD: Path empresa_id/contrato_${numero}.ext
      let novaAnexoUrl: string | undefined
      if (file) {
        const validation = uploadService.validateFile(file, BUCKETS.CONTRATOS)
        if (!validation.valid) {
          toast.error(validation.error ?? 'Arquivo inválido')
          return
        }
        const ext = file.name.split('.').pop() ?? 'pdf'
        const safeName = values.numero_contrato.replace(/[^a-zA-Z0-9]/g, '_')
        const path = `${empresa.id}/contrato_${safeName}_${Date.now()}.${ext}`
        const result = await uploadService.upload(BUCKETS.CONTRATOS, empresa.id, file, path)
        novaAnexoUrl = result.url
      }

      if (mode === 'edit' && contratoId) {
        // ⚠️ REGRA RLS: empresa_id e id NUNCA passados — ContratoUpdateSeguro garante em compile-time
        await contratosService.update(contratoId, {
          cnpj_id: values.cnpj_id,
          numero_contrato: values.numero_contrato,
          orgao_publico: values.orgao_publico,
          valor_total: values.valor_total,
          data_assinatura: values.data_assinatura,
          data_vigencia_inicio: values.data_vigencia_inicio,
          data_vigencia_fim: values.data_vigencia_fim,
          objeto: values.objeto || null,
          esfera: (values.esfera as 'municipal' | 'estadual' | 'federal') || null,
          indice_reajuste: values.indice_reajuste || null,
          cnpj_orgao: values.cnpj_orgao || null,
          // Só atualiza anexo_url se novo arquivo enviado
          ...(novaAnexoUrl !== undefined && { anexo_url: novaAnexoUrl }),
        })
        toast.success('Contrato atualizado com sucesso!')
        router.push(`/dashboard/contratos/${contratoId}`)
      } else {
        // ⚠️ REGRA RLS: empresa_id NÃO passado — injetado automaticamente pelo banco
        const novo = await contratosService.create({
          cnpj_id: values.cnpj_id,
          numero_contrato: values.numero_contrato,
          orgao_publico: values.orgao_publico,
          valor_total: values.valor_total,
          data_assinatura: values.data_assinatura,
          data_vigencia_inicio: values.data_vigencia_inicio,
          data_vigencia_fim: values.data_vigencia_fim,
          objeto: values.objeto || null,
          esfera: (values.esfera as 'municipal' | 'estadual' | 'federal') || null,
          indice_reajuste: values.indice_reajuste || null,
          cnpj_orgao: values.cnpj_orgao || null,
          anexo_url: novaAnexoUrl ?? null,
        })
        toast.success('Contrato criado com sucesso!')
        router.push(`/dashboard/contratos/${novo.id}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar contrato')
    } finally {
      setSubmitting(false)
    }
  }

  const cancelHref =
    mode === 'edit' && contratoId
      ? `/dashboard/contratos/${contratoId}`
      : '/dashboard/contratos'

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* CNPJ da empresa */}
          <FormField
            control={form.control}
            name="cnpj_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um CNPJ" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cnpjs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.cnpj_numero} — {c.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Número do contrato */}
          <FormField
            control={form.control}
            name="numero_contrato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número do Contrato *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 001/2026" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Órgão público */}
          <FormField
            control={form.control}
            name="orgao_publico"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Órgão Público *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Prefeitura Municipal de São Paulo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Valor total */}
          <FormField
            control={form.control}
            name="valor_total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Total (R$) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="0,00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Esfera */}
          <FormField
            control={form.control}
            name="esfera"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Esfera</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="municipal">Municipal</SelectItem>
                    <SelectItem value="estadual">Estadual</SelectItem>
                    <SelectItem value="federal">Federal</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data assinatura */}
          <FormField
            control={form.control}
            name="data_assinatura"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Assinatura *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Índice de reajuste */}
          <FormField
            control={form.control}
            name="indice_reajuste"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Índice de Reajuste</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: IPCA, IGP-M" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vigência início */}
          <FormField
            control={form.control}
            name="data_vigencia_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Início da Vigência *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vigência fim */}
          <FormField
            control={form.control}
            name="data_vigencia_fim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fim da Vigência *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CNPJ do órgão */}
          <FormField
            control={form.control}
            name="cnpj_orgao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ do Órgão</FormLabel>
                <FormControl>
                  <Input placeholder="XX.XXX.XXX/XXXX-XX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Objeto */}
          <FormField
            control={form.control}
            name="objeto"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Objeto do Contrato</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva o objeto do contrato..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Upload de documento */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium leading-none text-slate-700">
            Documento do Contrato
          </p>
          {/* Mostrar arquivo atual em modo edição */}
          {mode === 'edit' && initialData?.anexo_url && !file && (
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <FileText className="h-3 w-3 flex-shrink-0" />
              <span>Arquivo atual:</span>
              <a
                href={initialData.anexo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                Ver documento
              </a>
              <span className="text-slate-400">— envie um novo para substituir</span>
            </div>
          )}
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          <p className="text-xs text-slate-400">PDF, DOC ou DOCX — máximo 10 MB (opcional)</p>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(cancelHref)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            {submitting ? 'Salvando...' : mode === 'edit' ? 'Salvar Alterações' : 'Criar Contrato'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
