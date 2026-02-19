import { createClient } from '@/lib/supabase/client'
import { type BucketName, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from '@/lib/constants/buckets'

export interface UploadResult {
  path: string
  url: string
}

export class UploadService {
  private get supabase() {
    return createClient()
  }

  /**
   * Validar arquivo antes do upload (extensão e tamanho).
   * Retorna { valid: true } ou { valid: false, error: string }.
   */
  validateFile(file: File, bucket: BucketName): { valid: boolean; error?: string } {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
    const allowedExts = ALLOWED_EXTENSIONS[bucket]

    if (!allowedExts.includes(ext)) {
      return {
        valid: false,
        error: `Extensão não permitida. Permitidas: ${allowedExts.join(', ')}`,
      }
    }

    const maxBytes = MAX_FILE_SIZE[bucket] * 1024 * 1024
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE[bucket]}MB`,
      }
    }

    return { valid: true }
  }

  /**
   * Upload de arquivo para o bucket.
   * ⚠️ CRÍTICO: Path DEVE começar com empresa_id (RLS bloqueia caso contrário)
   * ⚠️ upsert: false — nunca sobrescrever arquivos existentes (Decisão de segurança)
   */
  async upload(
    bucket: BucketName,
    empresaId: string,
    file: File,
    customPath?: string
  ): Promise<UploadResult> {
    const validation = this.validateFile(file, bucket)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Sanitizar nome do arquivo (remover caracteres especiais)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const timestamp = Date.now()
    const path = customPath ?? `${empresaId}/${timestamp}_${sanitizedName}`

    // ⚠️ Garantir que path começa com empresa_id
    if (!path.startsWith(`${empresaId}/`)) {
      throw new Error('Path inválido: deve começar com empresa_id')
    }

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw new Error(error.message)

    const { data: urlData } = this.supabase.storage.from(bucket).getPublicUrl(data.path)

    return {
      path: data.path,
      url: urlData.publicUrl,
    }
  }

  /**
   * Download de arquivo como Blob.
   */
  async download(bucket: BucketName, path: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage.from(bucket).download(path)

    if (error) throw new Error(error.message)
    return data
  }

  /**
   * Remover arquivo do bucket.
   */
  async remove(bucket: BucketName, path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([path])

    if (error) throw new Error(error.message)
  }

  /**
   * Listar arquivos de uma empresa em um bucket.
   */
  async list(bucket: BucketName, empresaId: string) {
    const { data, error } = await this.supabase.storage.from(bucket).list(empresaId, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Obter URL pública de um arquivo.
   */
  getPublicUrl(bucket: BucketName, path: string): string {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }
}

export const uploadService = new UploadService()
