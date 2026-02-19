'use client'

import { useCallback, useId } from 'react'
import { Upload, File, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
  file?: File | null
  onRemove?: () => void
}

export function FileUpload({
  onFileSelect,
  accept = '.pdf,.doc,.docx',
  maxSizeMB = 10,
  disabled = false,
  file,
  onRemove,
}: FileUploadProps) {
  // ⚠️ useId() garante id único por instância — evita colisão com múltiplos FileUpload na página
  const inputId = useId()

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (disabled) return

      const droppedFile = e.dataTransfer.files[0]
      if (!droppedFile) return

      if (droppedFile.size > maxSizeMB * 1024 * 1024) {
        toast.error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`)
        return
      }

      onFileSelect(droppedFile)
    },
    [disabled, maxSizeMB, onFileSelect]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onFileSelect(selectedFile)
    }
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 p-4 border rounded-lg bg-slate-50">
        <File className="h-8 w-8 text-blue-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        disabled ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'hover:border-primary cursor-pointer'
      )}
    >
      <input
        type="file"
        id={inputId}
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
      <label
        htmlFor={inputId}
        className={cn('cursor-pointer', disabled && 'cursor-not-allowed')}
      >
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm font-medium">Clique para selecionar ou arraste o arquivo</p>
        <p className="text-xs text-muted-foreground mt-1">
          Formatos aceitos: {accept} (máx. {maxSizeMB}MB)
        </p>
      </label>
    </div>
  )
}
