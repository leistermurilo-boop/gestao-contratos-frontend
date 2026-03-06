'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Upload, Loader2, Sparkles, Trash2, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { itensService } from '@/lib/services/itens.service'
import toast from 'react-hot-toast'
import type { ExtractItemsResult, ItemOCR } from '@/app/api/ocr/extract-items/route'

interface ItemEditavel {
  id: string // uuid local para key
  selecionado: boolean
  numero_item: number | null
  descricao: string
  unidade: string
  quantidade: number | string
  valor_unitario: number | string
  confidence: number // média dos campos
}

function itemOCRToEditavel(item: ItemOCR, idx: number): ItemEditavel {
  const confidencias = [
    item.descricao.confidence,
    item.unidade.confidence,
    item.quantidade.confidence,
    item.valor_unitario.confidence,
  ]
  const media = confidencias.reduce((a, b) => a + b, 0) / confidencias.length

  return {
    id: `${idx}-${Date.now()}`,
    selecionado: true,
    numero_item: item.numero_item.valor,
    descricao: item.descricao.valor ?? '',
    unidade: item.unidade.valor ?? '',
    quantidade: item.quantidade.valor ?? '',
    valor_unitario: item.valor_unitario.valor ?? '',
    confidence: media,
  }
}

function ConfBadge({ c }: { c: number }) {
  if (c >= 0.9) return <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
  if (c >= 0.7) return <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
  return <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
}

interface OCRItensModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contratoId: string
  cnpjId: string
  onSuccess: (qtd: number) => void
}

type Step = 'upload' | 'loading' | 'preview' | 'saving'

export function OCRItensModal({ open, onOpenChange, contratoId, cnpjId, onSuccess }: OCRItensModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ExtractItemsResult | null>(null)
  const [itens, setItens] = useState<ItemEditavel[]>([])

  function reset() {
    setStep('upload')
    setProgress(0)
    setResult(null)
    setItens([])
  }

  function handleClose() {
    if (step === 'loading' || step === 'saving') return
    reset()
    onOpenChange(false)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setStep('loading')
    setProgress(10)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('contrato_id', contratoId)

      const interval = setInterval(() => setProgress((p) => Math.min(p + 7, 88)), 1200)

      const res = await fetch('/api/ocr/extract-items', { method: 'POST', body: fd })
      clearInterval(interval)
      setProgress(100)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao processar documento')
      }

      const data: ExtractItemsResult = await res.json()

      if (!data.itens || data.itens.length === 0) {
        toast.error('Nenhum item encontrado no documento. Verifique se o PDF contém a planilha de itens.')
        setStep('upload')
        return
      }

      setResult(data)
      setItens(data.itens.map((item, idx) => itemOCRToEditavel(item, idx)))
      setStep('preview')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar documento')
      setStep('upload')
    }
  }, [contratoId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: step !== 'upload',
    onDropRejected: (files) => {
      const code = files[0]?.errors[0]?.code
      if (code === 'file-too-large') toast.error('Arquivo muito grande. Máximo: 10MB')
      else toast.error('Formato não suportado.')
    },
  })

  function updateItem(id: string, field: keyof ItemEditavel, value: unknown) {
    setItens((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item))
  }

  function removeItem(id: string) {
    setItens((prev) => prev.filter((item) => item.id !== id))
  }

  function toggleAll(checked: boolean) {
    setItens((prev) => prev.map((item) => ({ ...item, selecionado: checked })))
  }

  const selecionados = itens.filter((i) => i.selecionado)
  const todosSelecionados = itens.length > 0 && selecionados.length === itens.length

  async function handleSave() {
    if (selecionados.length === 0) {
      toast.error('Selecione ao menos um item para salvar')
      return
    }

    setStep('saving')
    let salvos = 0
    const erros: string[] = []

    for (const item of selecionados) {
      const qtd = typeof item.quantidade === 'string' ? parseFloat(item.quantidade) : item.quantidade
      const vUnit = typeof item.valor_unitario === 'string' ? parseFloat(item.valor_unitario) : item.valor_unitario

      if (!item.descricao || isNaN(qtd) || qtd <= 0 || isNaN(vUnit) || vUnit <= 0 || !item.unidade) {
        erros.push(item.descricao || `Item ${item.numero_item ?? salvos + 1}`)
        continue
      }

      try {
        await itensService.create({
          contrato_id: contratoId,
          cnpj_id: cnpjId,
          numero_item: item.numero_item,
          descricao: item.descricao,
          unidade: item.unidade,
          quantidade: qtd,
          valor_unitario: vUnit,
        })
        salvos++
      } catch {
        erros.push(item.descricao)
      }
    }

    if (erros.length > 0) {
      toast.error(`${erros.length} item(ns) não puderam ser salvos. Verifique os dados.`)
    }
    if (salvos > 0) {
      toast.success(`${salvos} item(ns) adicionado(s) com sucesso!`)
      onSuccess(salvos)
      reset()
      onOpenChange(false)
    } else {
      setStep('preview')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={step === 'preview' ? 'sm:max-w-4xl' : 'sm:max-w-md'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Extrair Itens com IA
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Envie o PDF do contrato para extrair os itens automaticamente.'}
            {step === 'loading' && 'Analisando documento...'}
            {step === 'preview' && `${result?.total_itens ?? 0} item(ns) encontrado(s). Revise e salve os que desejar.`}
            {step === 'saving' && 'Salvando itens...'}
          </DialogDescription>
        </DialogHeader>

        {/* STEP: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-emerald-100 rounded-full">
                  <Upload className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {isDragActive ? 'Solte o arquivo aqui' : 'Arraste o PDF do contrato'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">ou clique para selecionar · PDF, PNG, JPG · máx 10MB</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* STEP: LOADING */}
        {step === 'loading' && (
          <div className="py-6 space-y-5">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
              <p className="text-sm font-medium text-slate-900">Extraindo itens do contrato...</p>
            </div>
            <Progress value={progress} />
            <p className="text-xs text-center text-slate-500">Isso pode levar até 30 segundos</p>
          </div>
        )}

        {/* STEP: PREVIEW */}
        {step === 'preview' && (
          <div className="space-y-4">
            {/* Métricas */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary">{result?.total_itens} itens encontrados</Badge>
              <Badge variant="secondary">
                Precisão: {((result?.confidence_geral ?? 0) * 100).toFixed(0)}%
              </Badge>
              <span className="text-xs text-slate-500">
                {selecionados.length} de {itens.length} selecionados
              </span>
            </div>

            {/* Tabela */}
            <div className="overflow-auto max-h-[400px] rounded-md border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="p-2 text-left w-8">
                      <Checkbox
                        checked={todosSelecionados}
                        onCheckedChange={(v) => toggleAll(Boolean(v))}
                      />
                    </th>
                    <th className="p-2 text-left w-8 text-slate-600">Nº</th>
                    <th className="p-2 text-left text-slate-600">Marca/Modelo</th>
                    <th className="p-2 text-left w-20 text-slate-600">Unidade</th>
                    <th className="p-2 text-left w-24 text-slate-600">Qtd</th>
                    <th className="p-2 text-left w-28 text-slate-600">Vlr Unit (R$)</th>
                    <th className="p-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itens.map((item) => (
                    <tr key={item.id} className={item.selecionado ? '' : 'opacity-40'}>
                      <td className="p-2">
                        <Checkbox
                          checked={item.selecionado}
                          onCheckedChange={(v) => updateItem(item.id, 'selecionado', Boolean(v))}
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={item.numero_item ?? ''}
                          onChange={(e) => updateItem(item.id, 'numero_item', e.target.value ? parseInt(e.target.value) : null)}
                          className="h-7 text-xs w-14 px-1"
                        />
                      </td>
                      <td className="p-1">
                        <div className="flex items-center gap-1">
                          <ConfBadge c={item.confidence} />
                          <Input
                            value={item.descricao}
                            onChange={(e) => updateItem(item.id, 'descricao', e.target.value)}
                            className="h-7 text-xs min-w-0"
                          />
                        </div>
                      </td>
                      <td className="p-1">
                        <Input
                          value={item.unidade}
                          onChange={(e) => updateItem(item.id, 'unidade', e.target.value)}
                          className="h-7 text-xs px-1"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          step="0.001"
                          value={item.quantidade}
                          onChange={(e) => updateItem(item.id, 'quantidade', e.target.value)}
                          className="h-7 text-xs px-1"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.valor_unitario}
                          onChange={(e) => updateItem(item.id, 'valor_unitario', e.target.value)}
                          className="h-7 text-xs px-1"
                        />
                      </td>
                      <td className="p-1">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legenda */}
            <div className="flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> Alta (≥90%)</span>
              <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-500" /> Média</span>
              <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" /> Baixa — revise</span>
            </div>

            {/* Ações */}
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button
                onClick={handleSave}
                disabled={selecionados.length === 0}
                className="bg-brand-navy hover:bg-brand-navy/90"
              >
                Salvar {selecionados.length} item(ns) →
              </Button>
            </div>
          </div>
        )}

        {/* STEP: SAVING */}
        {step === 'saving' && (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
            <p className="text-sm text-slate-700">Salvando itens no contrato...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
