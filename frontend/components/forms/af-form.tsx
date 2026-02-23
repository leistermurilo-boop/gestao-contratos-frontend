'use client'

import { useState, useEffect } from 'react'
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
import { itensService } from '@/lib/services/itens.service'
import { afService } from '@/lib/services/af.service'
import { uploadService } from '@/lib/services/upload.service'
import { useEmpresa } from '@/contexts/empresa-context'
import { BUCKETS } from '@/lib/constants/buckets'
import { type ContratoWithRelations, type ItemContrato } from '@/types/models'
import toast from 'react-hot-toast'

const afSchema = z.object({
  contrato_id: z.string().min(1, 'Selecione um contrato'),
  item_id: z.string().min(1, 'Selecione um item'),
  numero_af: z.string().min(1, 'Número AF obrigatório'),
  data_emissao: z.string().min(1, 'Data obrigatória'),
  quantidade_autorizada: z.coerce
    .number({ invalid_type_error: 'Informe uma quantidade' })
    .positive('Deve ser maior que zero'),
  data_vencimento: z.string().optional().nullable(),
  observacao: z.string().optional(),
})

type AFFormData = z.infer<typeof afSchema>

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function AFForm() {
  const router = useRouter()
  const { empresa } = useEmpresa()

  const [contratos, setContratos] = useState<ContratoWithRelations[]>([])
  const [itens, setItens] = useState<ItemContrato[]>([])
  const [loadingContratos, setLoadingContratos] = useState(true)
  const [loadingItens, setLoadingItens] = useState(false)
  const [itemSelecionado, setItemSelecionado] = useState<ItemContrato | null>(null)
  const [afFile, setAfFile] = useState<File | null>(null)

  const form = useForm<AFFormData>({
    resolver: zodResolver(afSchema),
    defaultValues: {
      contrato_id: '',
      item_id: '',
      numero_af: '',
      data_emissao: getTodayISO(),
      quantidade_autorizada: 0,
      data_vencimento: '',
      observacao: '',
    },
  })

  const { formState: { isSubmitting } } = form

  // Carregar contratos na montagem
  useEffect(() => {
    async function load() {
      try {
        const data = await contratosService.getAll()
        setContratos(data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar contratos')
      } finally {
        setLoadingContratos(false)
      }
    }
    load()
  }, [])

  // Carregar itens ao selecionar contrato
  async function onContratoChange(contratoId: string) {
    form.setValue('contrato_id', contratoId)
    form.setValue('item_id', '')
    setItemSelecionado(null)
    setItens([])

    if (!contratoId) return

    setLoadingItens(true)
    try {
      const data = await itensService.getByContrato(contratoId)
      // Filtrar apenas itens com saldo disponível
      setItens(data.filter((i) => i.saldo_quantidade > 0))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar itens')
    } finally {
      setLoadingItens(false)
    }
  }

  // Atualizar chip de saldo ao selecionar item
  function onItemChange(itemId: string) {
    form.setValue('item_id', itemId)
    const item = itens.find((i) => i.id === itemId) ?? null
    setItemSelecionado(item)
  }

  async function onSubmit(values: AFFormData) {
    try {
      // 1. Upload documento AF se selecionado
      let anexoUrl: string | null = null
      if (afFile) {
        if (!empresa?.id) {
          toast.error('Empresa não identificada. Recarregue a página.')
          return
        }
        const result = await uploadService.upload(BUCKETS.AF, empresa.id, afFile)
        anexoUrl = result.url
      }

      // 2. Criar AF — afService.create() valida saldo internamente
      // ⚠️ NUNCA enviar empresa_id, saldo_af, quantidade_entregue (Decisões #1 e #3)
      await afService.create({
        contrato_id: values.contrato_id,
        item_id: values.item_id,
        numero_af: values.numero_af,
        data_emissao: values.data_emissao,
        quantidade_autorizada: values.quantidade_autorizada,
        data_vencimento: values.data_vencimento || null,
        observacao: values.observacao || null,
        anexo_url: anexoUrl,
      })

      toast.success('AF emitida com sucesso!')
      router.push('/dashboard/autorizacoes')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao emitir AF')
    }
  }

  const contratoSelecionadoId = form.watch('contrato_id')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  onValueChange={onContratoChange}
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

          {/* Item (cascata) */}
          <FormField
            control={form.control}
            name="item_id"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Item *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={onItemChange}
                  disabled={!contratoSelecionadoId || loadingItens || isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !contratoSelecionadoId
                            ? 'Selecione um contrato primeiro'
                            : loadingItens
                              ? 'Carregando itens...'
                              : itens.length === 0
                                ? 'Nenhum item com saldo disponível'
                                : 'Selecione o item'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {itens.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.numero_item ? `#${item.numero_item} — ` : ''}
                        {item.descricao}{' '}
                        (Saldo: {item.saldo_quantidade.toLocaleString('pt-BR')} {item.unidade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
                {/* Chip de saldo */}
                {itemSelecionado && (
                  <p className="text-xs text-slate-500">
                    Saldo disponível:{' '}
                    <span className="font-semibold text-slate-700">
                      {itemSelecionado.saldo_quantidade.toLocaleString('pt-BR')}{' '}
                      {itemSelecionado.unidade}
                    </span>
                  </p>
                )}
              </FormItem>
            )}
          />

          {/* Número AF */}
          <FormField
            control={form.control}
            name="numero_af"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número da AF *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: AF-2024-001" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quantidade autorizada */}
          <FormField
            control={form.control}
            name="quantidade_autorizada"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade Autorizada *</FormLabel>
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

          {/* Data de emissão */}
          <FormField
            control={form.control}
            name="data_emissao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Emissão *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de vencimento */}
          <FormField
            control={form.control}
            name="data_vencimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Vencimento</FormLabel>
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

          {/* Observação */}
          <FormField
            control={form.control}
            name="observacao"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Observação</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Informações adicionais sobre esta autorização..."
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

        {/* Upload documento AF */}
        <div className="space-y-2">
          <p className="text-sm font-medium leading-none">
            Documento da AF{' '}
            <span className="font-normal text-slate-400">(opcional — .pdf, .doc, .docx)</span>
          </p>
          <FileUpload
            accept=".pdf,.doc,.docx"
            maxSizeMB={10}
            file={afFile}
            onFileSelect={setAfFile}
            onRemove={() => setAfFile(null)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/autorizacoes')}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            {isSubmitting ? 'Emitindo...' : 'Emitir AF'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
