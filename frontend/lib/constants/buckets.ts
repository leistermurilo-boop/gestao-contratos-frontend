export const BUCKETS = {
  CONTRATOS: 'contratos',
  REAJUSTES: 'reajustes',
  NF_ENTRADA: 'notas-fiscais-entrada',
  NF_SAIDA: 'notas-fiscais-saida',
  AF: 'autorizacoes-fornecimento',
  LOGOS: 'logos',
} as const

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS]

// Extensões permitidas por bucket
export const ALLOWED_EXTENSIONS: Record<BucketName, string[]> = {
  [BUCKETS.CONTRATOS]: ['.pdf', '.doc', '.docx'],
  [BUCKETS.REAJUSTES]: ['.pdf', '.doc', '.docx'],
  [BUCKETS.NF_ENTRADA]: ['.pdf', '.xml'],
  [BUCKETS.NF_SAIDA]: ['.pdf', '.xml'],
  [BUCKETS.AF]: ['.pdf', '.doc', '.docx'],
  [BUCKETS.LOGOS]: ['.png', '.jpg', '.jpeg', '.svg', '.webp'],
}

// Tamanho máximo por bucket (em MB)
export const MAX_FILE_SIZE: Record<BucketName, number> = {
  [BUCKETS.CONTRATOS]: 10,
  [BUCKETS.REAJUSTES]: 10,
  [BUCKETS.NF_ENTRADA]: 5,
  [BUCKETS.NF_SAIDA]: 5,
  [BUCKETS.AF]: 10,
  [BUCKETS.LOGOS]: 2,
}
