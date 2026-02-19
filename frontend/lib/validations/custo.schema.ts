import { z } from 'zod'

export const custoSchema = z.object({
  item_contrato_id: z.string().uuid('Item inválido'),
  data_lancamento: z.string().min(1, 'Data é obrigatória'),
  custo_unitario: z.number().positive('Custo deve ser positivo'),
  quantidade: z.number().positive('Quantidade deve ser positiva'),
  fornecedor: z.string().optional(),
  numero_nf: z.string().optional(),
  observacao: z.string().optional(), // Coluna real: observacao (não observacoes)
})

export type CustoFormData = z.infer<typeof custoSchema>
