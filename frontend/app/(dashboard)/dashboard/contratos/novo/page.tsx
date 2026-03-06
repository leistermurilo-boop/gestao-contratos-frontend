'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/page-header'
import { ContratoForm, type ContratoPrefill } from '@/components/forms/contrato-form'
import { OCRUploadModal } from '@/components/contratos/ocr-upload-modal'
import { OCRPreviewForm } from '@/components/contratos/ocr-preview-form'
import { Sparkles, PencilLine } from 'lucide-react'
import type { OCRResult } from '@/lib/agents/core/types'

type Step = 'choice' | 'ocr-preview' | 'form'

export default function NovoContratoPage() {
  const [step, setStep] = useState<Step>('choice')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [ocrData, setOcrData] = useState<OCRResult | null>(null)
  const [prefill, setPrefill] = useState<ContratoPrefill | undefined>(undefined)

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
    setStep('form')
  }

  function handleBackToChoice() {
    setOcrData(null)
    setPrefill(undefined)
    setStep('choice')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Contrato"
        description={
          step === 'ocr-preview'
            ? 'Revise os dados extraídos pelo sistema de IA antes de continuar.'
            : step === 'form'
              ? 'Preencha os dados para cadastrar um novo contrato.'
              : 'Como deseja cadastrar o contrato?'
        }
      />

      {/* STEP: CHOICE */}
      {step === 'choice' && (
        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
          {/* OCR */}
          <Card className="border-2 border-emerald-200 bg-emerald-50/40 hover:shadow-md transition-shadow cursor-pointer"
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
                Envie o PDF do contrato e o sistema preenche os campos automaticamente.
                Economia de até 90% de tempo.
              </p>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={(e) => { e.stopPropagation(); setShowUploadModal(true) }}
              >
                Enviar PDF / Imagem
              </Button>
            </CardContent>
          </Card>

          {/* Manual */}
          <Card className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
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
            <CardTitle className="text-base font-semibold text-slate-800">
              Validar Dados Extraídos
            </CardTitle>
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
            <CardTitle className="text-base font-semibold text-slate-800">
              Dados do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ContratoForm prefill={prefill} />
          </CardContent>
        </Card>
      )}

      {/* Modal upload OCR */}
      <OCRUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onSuccess={handleOCRSuccess}
      />
    </div>
  )
}
