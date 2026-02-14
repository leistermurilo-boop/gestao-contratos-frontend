# Story 4.4: Upload Service

**Tipo:** Feature
**Prioridade:** Crítica
**Estimativa:** 4 horas
**Responsável:** @dev

---

## 🎯 Objetivo

Criar service layer para upload/download de arquivos com validação de path empresa_id/filename.

---

## 📋 Pré-requisitos

- [x] **Story 4.3 concluída:** Custo Service implementado
- [ ] Constantes de buckets criadas

---

## 📁 Arquivos a Criar

```
frontend/
├── lib/
│   ├── services/
│   │   └── upload.service.ts      # ✅ Service de upload
│   ├── hooks/
│   │   └── use-upload.ts          # ✅ Hook para upload
│   └── constants/
│       └── buckets.ts             # ✅ Nomes dos buckets
└── components/
    └── common/
        └── file-upload.tsx        # ✅ Componente de upload
```

---

## 🔨 Tarefas

### 1. Criar Constantes de Buckets

Criar `frontend/lib/constants/buckets.ts`:

```typescript
export const BUCKETS = {
  CONTRATOS: 'contratos',
  REAJUSTES: 'reajustes',
  NF_ENTRADA: 'notas-fiscais-entrada',
  NF_SAIDA: 'notas-fiscais-saida',
  AF: 'autorizacoes-fornecimento',
} as const

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS]

// Validação de extensões permitidas por bucket
export const ALLOWED_EXTENSIONS: Record<BucketName, string[]> = {
  [BUCKETS.CONTRATOS]: ['.pdf', '.doc', '.docx'],
  [BUCKETS.REAJUSTES]: ['.pdf', '.doc', '.docx'],
  [BUCKETS.NF_ENTRADA]: ['.pdf', '.xml'],
  [BUCKETS.NF_SAIDA]: ['.pdf', '.xml'],
  [BUCKETS.AF]: ['.pdf', '.doc', '.docx'],
}

// Tamanho máximo por tipo (em MB)
export const MAX_FILE_SIZE: Record<BucketName, number> = {
  [BUCKETS.CONTRATOS]: 10,
  [BUCKETS.REAJUSTES]: 10,
  [BUCKETS.NF_ENTRADA]: 5,
  [BUCKETS.NF_SAIDA]: 5,
  [BUCKETS.AF]: 10,
}
```

### 2. Criar Upload Service

Criar `frontend/lib/services/upload.service.ts`:

```typescript
import { createClient } from '@/lib/supabase/client'
import { type BucketName, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from '@/lib/constants/buckets'

export class UploadService {
  private supabase = createClient()

  /**
   * Validar arquivo antes de upload
   */
  validateFile(file: File, bucket: BucketName): { valid: boolean; error?: string } {
    // Validar extensão
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    const allowedExts = ALLOWED_EXTENSIONS[bucket]
    if (!allowedExts.includes(ext)) {
      return {
        valid: false,
        error: `Extensão não permitida. Permitidas: ${allowedExts.join(', ')}`,
      }
    }

    // Validar tamanho
    const maxSize = MAX_FILE_SIZE[bucket] * 1024 * 1024 // Convert MB to bytes
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE[bucket]}MB`,
      }
    }

    return { valid: true }
  }

  /**
   * Upload de arquivo
   * ⚠️ CRÍTICO: Path obrigatório: empresa_id/filename
   * ⚠️ RLS bloqueia se path não começar com empresa_id
   */
  async upload(
    bucket: BucketName,
    empresaId: string,
    file: File,
    customPath?: string
  ): Promise<{ path: string; url: string }> {
    // Validar arquivo
    const validation = this.validateFile(file, bucket)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // ⚠️ CRÍTICO: Path DEVE começar com empresa_id
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const path = customPath || `${empresaId}/${timestamp}_${sanitizedFileName}`

    // Validar que path começa com empresa_id
    if (!path.startsWith(empresaId)) {
      throw new Error('Path inválido: deve começar com empresa_id')
    }

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Gerar URL pública
    const { data: urlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return {
      path: data.path,
      url: urlData.publicUrl,
    }
  }

  /**
   * Download de arquivo
   */
  async download(bucket: BucketName, path: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .download(path)

    if (error) throw error
    return data
  }

  /**
   * Deletar arquivo
   */
  async delete(bucket: BucketName, path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  }

  /**
   * Listar arquivos de uma empresa
   */
  async list(bucket: BucketName, empresaId: string) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(empresaId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) throw error
    return data
  }

  /**
   * Obter URL pública
   */
  getPublicUrl(bucket: BucketName, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  }
}

export const uploadService = new UploadService()
```

### 3. Criar Hook useUpload

Criar `frontend/lib/hooks/use-upload.ts`:

```typescript
'use client'

import { useState } from 'react'
import { useEmpresa } from '@/contexts/empresa-context'
import { uploadService } from '@/lib/services/upload.service'
import { type BucketName } from '@/lib/constants/buckets'
import toast from 'react-hot-toast'

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { empresa } = useEmpresa()

  const upload = async (
    bucket: BucketName,
    file: File,
    customPath?: string
  ) => {
    if (!empresa) {
      throw new Error('Empresa não encontrada')
    }

    try {
      setUploading(true)
      setProgress(0)

      // Simular progresso (upload real não tem callback de progresso no Supabase)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const result = await uploadService.upload(bucket, empresa.id, file, customPath)

      clearInterval(progressInterval)
      setProgress(100)

      toast.success('Arquivo enviado com sucesso!')
      return result
    } catch (error: any) {
      console.error('Erro no upload:', error)
      toast.error(error.message || 'Erro ao enviar arquivo')
      throw error
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const download = async (bucket: BucketName, path: string, fileName: string) => {
    try {
      const blob = await uploadService.download(bucket, path)

      // Criar download no navegador
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Download concluído!')
    } catch (error: any) {
      console.error('Erro no download:', error)
      toast.error(error.message || 'Erro ao baixar arquivo')
      throw error
    }
  }

  return {
    uploading,
    progress,
    upload,
    download,
  }
}
```

### 4. Criar Componente FileUpload

Criar `frontend/components/common/file-upload.tsx`:

```typescript
'use client'

import { useCallback } from 'react'
import { Upload, File, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number // em MB
  disabled?: boolean
  file?: File | null
  onRemove?: () => void
}

export function FileUpload({
  onFileSelect,
  accept = '.pdf,.doc,.docx',
  maxSize = 10,
  disabled = false,
  file,
  onRemove,
}: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (disabled) return

      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        if (droppedFile.size > maxSize * 1024 * 1024) {
          alert(`Arquivo muito grande. Máximo: ${maxSize}MB`)
          return
        }
        onFileSelect(droppedFile)
      }
    },
    [disabled, maxSize, onFileSelect]
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
        <File className="h-8 w-8 text-blue-600" />
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
        disabled
          ? 'bg-slate-50 cursor-not-allowed'
          : 'hover:border-primary cursor-pointer'
      )}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className={cn(
          'cursor-pointer',
          disabled && 'cursor-not-allowed'
        )}
      >
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm font-medium">
          Clique para selecionar ou arraste o arquivo
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Formatos aceitos: {accept} (máx. {maxSize}MB)
        </p>
      </label>
    </div>
  )
}
```

---

## ✅ Critérios de Aceitação (Done When...)

- [ ] Constantes de buckets criadas
- [ ] UploadService criado com validações
- [ ] **REGRA: Path obrigatório empresa_id/filename**
- [ ] Validação de extensões e tamanho implementada
- [ ] Hook useUpload criado
- [ ] Componente FileUpload criado com drag & drop
- [ ] Progress indicator funcional
- [ ] **Teste:** Upload com path inválido falha
- [ ] **Teste:** Upload com path correto funciona
- [ ] **Teste:** Validações de extensão e tamanho funcionam
- [ ] **Teste:** Download cria arquivo no navegador

---

## 🔗 Dependências

- **Story 4.3:** Custo Service implementado

---

## 📝 Notas para @dev

### ⚠️ Regras Críticas:

1. **Path OBRIGATÓRIO: empresa_id/filename** - RLS bloqueia caso contrário
2. **Validar antes de upload** - Extensão e tamanho
3. **Nunca upsert** - Evitar sobrescrever arquivos acidentalmente
4. **Path sanitization** - Remover caracteres especiais

---

## 🎬 Próxima Story

Após concluir esta story, prosseguir para:
- **Story 4.5:** AF Service

---

**Status:** ⏳ Aguardando implementação
**Criado por:** @sm (River) - 2026-02-13
