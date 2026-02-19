'use client'

import { useState } from 'react'
import { useEmpresa } from '@/contexts/empresa-context'
import { uploadService } from '@/lib/services/upload.service'
import { type BucketName } from '@/lib/constants/buckets'
import toast from 'react-hot-toast'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Ocorreu um erro inesperado'
}

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { empresa } = useEmpresa()

  const upload = async (bucket: BucketName, file: File, customPath?: string) => {
    if (!empresa) {
      throw new Error('Empresa não encontrada')
    }

    // ⚠️ progressInterval declarado fora do try para garantir clearInterval no finally
    let progressInterval: ReturnType<typeof setInterval> | null = null

    try {
      setUploading(true)
      setProgress(0)

      // Simular progresso gradual (Supabase Storage não expõe progresso real)
      progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const result = await uploadService.upload(bucket, empresa.id, file, customPath)

      setProgress(100)
      toast.success('Arquivo enviado com sucesso!')
      return result
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro no upload:', error)
      toast.error(message)
      throw error
    } finally {
      // ⚠️ Limpar interval SEMPRE no finally — evita vazamento mesmo em caso de erro
      if (progressInterval !== null) clearInterval(progressInterval)
      setUploading(false) // ✅ Decisão #2
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const download = async (bucket: BucketName, path: string, fileName: string) => {
    try {
      setUploading(true)
      const blob = await uploadService.download(bucket, path)

      // Disparar download no navegador via link programático
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(anchor)

      toast.success('Download concluído!')
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro no download:', error)
      toast.error(message)
      throw error
    } finally {
      setUploading(false) // ✅ Decisão #2
    }
  }

  return {
    uploading,
    progress,
    upload,
    download,
  }
}
