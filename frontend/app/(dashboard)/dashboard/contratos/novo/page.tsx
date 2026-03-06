'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/page-header'
import { ContratoForm, type ContratoPrefill } from '@/components/forms/contrato-form'
import { OCRUploadModal } from '@/components/contratos/ocr-upload-modal'
import { OCRPreviewForm } from '@/components/contratos/ocr-preview-form'
import { OCRItensModal } from '@/components/contratos/ocr-itens-modal'
import { Sparkles, PencilLine } from 'lucide-react'
import type { OCRResult } from '@/lib/agents/core/types'
import type { ExtractItemsResult } from '@/app/api/ocr/extract-items/route'
import type { ExtractAllResult } from '@/app/api/ocr/extract-all/route'
import toast from 'react-hot-toast'

type Step = 'choice' | 'ocr-preview' | 'form' | 'items'

export default function NovoContratoPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('choice')
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Dados OCR do contrato
  const [ocrData, setOcrData] = useState<OCRResult | null>(null)
  const [prefill, setPrefill] = useState<ContratoPrefill | undefined>(undefined)

  // Dados OCR dos itens (extraídos junto com o contrato — sem segundo upload)
  const [ocrItens, setOcrItens] = useState<ExtractItemsResult | null>(null)

  // IDs do contrato recém-salvo (para importar itens)
  const [savedContratoId, setSavedContratoId] = useState<string | null>(null)
  const [savedCnpjId, setSavedCnpjId] = useState<string | null>(null)
  const [showItensModal, setShowItensModal] = useState(false)

  // Upload OCR — chama /api/ocr/extract-all (contrato + itens em uma chamada)
  async function handleFileSelected(file: File): Promise<OCRResult> {
    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch('/api/ocr/extract-all', { method: 'POST', body: fd })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Erro ao processar documento')
    }

    const data: ExtractAllResult = await res.json()

    // Guardar itens em memória para usar depois do contrato ser salvo
    if (data.itens && data.itens.total_itens > 0) {
      setOcrItens(data.itens)
    }

    return data.contrato
  }

  function handleOCRSuccess(data: OCRResult) {
    setOcrData(data)
    setStep('ocr-preview')
  }

  function handleOCRConfirm(fields: ContratoPrefill) {
    setPrefill(fields)
    setStep('form')
  }

  function handleManual() {
    setPrefill(undefined)
    setOcrItens(null)
    setStep('form')
  }

  function handleBackToChoice() {
    setOcrData(null)
    setPrefill(undefined)
    setOcrItens(null)
    setStep('choice')
  }

  // Chamado pelo ContratoForm após salvar — vai para importação de itens se houver
  function handleContratSaved(contratoId: string, cnpjId: string) {
    setSavedContratoId(contratoId)
    setSavedCnpjId(cnpjId)

    if (ocrItens && ocrItens.total_itens > 0) {
      setStep('items')
      setShowItensModal(true)
    } else {
      router.push(`/dashboard/contratos/${contratoId}`)
    }
  }

  function handleItensSaved(qtd: number) {
    if (qtd > 0) {
      toast.success(`${qtd} item(ns) importado(s) com sucesso!`)
    }
    if (savedContratoId) {
      router.push(`/dashboard/contratos/${savedContratoId}`)
    }
  }

  function handleItensSkip() {
    if (savedContratoId) {
      router.push(`/dashboard/contratos/${savedContratoId}`)
    }
  }

  const pageDescription = {
    choice: 'Como deseja cadastrar o contrato?',
    'ocr-preview': 'Revise os dados extraídos pelo sistema de IA antes de continuar.',
    form: 'Preencha os dados para cadastrar um novo contrato.',
    items: 'Contrato criado! Revise os itens extraídos do PDF.',
  }[step]

  return (
    <div className="space-y-6">
      <PageHeader title="Novo Contrato" description={pageDescription} />

      {/* STEP: CHOICE */}
      {step === 'choice' && (
        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
          <Card
            className="border-2 border-emerald-200 bg-emerald-50/40 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setShowUploadModal(true)}
          >
            <CardContent className="pt-6 pb-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-base">Extrair com IA</CardTitle>
              </div>
              <p className="text-sm text-slate-600">
                Envie o PDF do contrato e o sistema preenche o cabeçalho e a lista de itens automaticamente.
              </p>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={(e) => { e.stopPropagation(); setShowUploadModal(true) }}
              >
                Enviar PDF / Imagem
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={handleManual}
          >
            <CardContent className="pt-6 pb-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <PencilLine className="h-5 w-5 text-slate-600" />
                </div>
                <CardTitle className="text-base">Preencher Manualmente</CardTitle>
              </div>
              <p className="text-sm text-slate-600">
                Digite os dados do contrato nos campos do formulário.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={(e) => { e.stopPropagation(); handleManual() }}
              >
                Continuar sem IA
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP: OCR PREVIEW */}
      {step === 'ocr-preview' && ocrData && (
        <Card className="border-slate-200 bg-white max-w-3xl">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-800">
                Validar Dados Extraídos
              </CardTitle>
              {ocrItens && ocrItens.total_itens > 0 && (
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                  {ocrItens.total_itens} item(ns) também extraído(s)
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <OCRPreviewForm
              data={ocrData}
              onConfirm={handleOCRConfirm}
              onCancel={handleBackToChoice}
            />
          </CardContent>
        </Card>
      )}

      {/* STEP: FORM */}
      {step === 'form' && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-800">
                Dados do Contrato
              </CardTitle>
              {ocrItens && ocrItens.total_itens > 0 && (
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                  Após salvar: importar {ocrItens.total_itens} item(ns)
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ContratoForm
              prefill={prefill}
              onSaveSuccess={handleContratSaved}
            />
          </CardContent>
        </Card>
      )}

      {/* Modal upload — usa /api/ocr/extract-all internamente */}
      <OCRUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onSuccess={handleOCRSuccess}
        fetchFn={handleFileSelected}
      />

      {/* Modal itens — com dados pré-carregados, sem segundo upload */}
      {step === 'items' && savedContratoId && savedCnpjId && (
        <OCRItensModal
          open={showItensModal}
          onOpenChange={(v) => { if (!v) handleItensSkip() }}
          contratoId={savedContratoId}
          cnpjId={savedCnpjId}
          onSuccess={handleItensSaved}
          prefetchedData={ocrItens ?? undefined}
        />
      )}
    </div>
  )
}
