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
import { Upload, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { OCRResult } from '@/lib/agents/core/types'

interface OCRUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (data: OCRResult) => void
}

export function OCRUploadModal({ open, onOpenChange, onSuccess }: OCRUploadModalProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setUploading(true)
      setProgress(10)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const interval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 8, 88))
        }, 1200)

        const response = await fetch('/api/ocr/extract-contract', {
          method: 'POST',
          body: formData,
        })

        clearInterval(interval)
        setProgress(100)

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error ?? 'Erro ao processar documento')
        }

        const data: OCRResult = await response.json()
        const pct = (data.confidence_geral * 100).toFixed(0)
        toast.success(`Extração concluída! Precisão geral: ${pct}%`)

        onSuccess(data)
        onOpenChange(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao processar documento')
      } finally {
        setUploading(false)
        setProgress(0)
      }
    },
    [onSuccess, onOpenChange],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: uploading,
    onDropRejected: (files) => {
      const err = files[0]?.errors[0]
      if (err?.code === 'file-too-large') toast.error('Arquivo muito grande. Máximo: 10MB')
      else toast.error('Formato não suportado. Use PDF, PNG ou JPG.')
    },
  })

  return (
    <Dialog open={open} onOpenChange={uploading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Extrair Dados do Contrato com IA</DialogTitle>
          <DialogDescription>
            Envie o PDF ou imagem do contrato para preenchimento automático dos campos.
          </DialogDescription>
        </DialogHeader>

        {!uploading ? (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-emerald-100 rounded-full">
                  <Upload className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {isDragActive ? 'Solte o arquivo aqui' : 'Arraste o arquivo aqui'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">ou clique para selecionar</p>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>Formatos: PDF, PNG, JPG</p>
                  <p>Tamanho máximo: 10MB</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-5">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
              <p className="text-sm font-medium text-slate-900">Analisando documento com IA...</p>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-center text-slate-500">
              Extraindo campos do contrato
              <br />
              Isso pode levar até 30 segundos
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
