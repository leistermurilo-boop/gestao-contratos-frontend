import { z } from 'zod'

export const entregaSchema = z.object({
  af_id: z.string().uuid('AF inválida'),
  data_entrega: z.string().min(1, 'Data de entrega é obrigatória'),
  quantidade_entregue: z.number().positive('Quantidade deve ser positiva'),
  nf_saida_numero: z.string().optional(),   // nf_saida_numero (nullable no banco)
  observacao: z.string().optional(),         // observacao — singular, conforme banco
})

export type EntregaFormData = z.infer<typeof entregaSchema>
