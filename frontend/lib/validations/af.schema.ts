import { z } from 'zod'

export const afSchema = z.object({
  contrato_id: z.string().uuid('Contrato inválido'),
  item_id: z.string().uuid('Item inválido'),
  numero_af: z.string().min(1, 'Número da AF é obrigatório'),
  quantidade_autorizada: z.number().positive('Quantidade deve ser positiva'),
  data_emissao: z.string().min(1, 'Data de emissão é obrigatória'),
  data_vencimento: z.string().optional(),
  observacao: z.string().optional(), // Coluna real: observacao (não observacoes)
})

export type AFFormData = z.infer<typeof afSchema>
