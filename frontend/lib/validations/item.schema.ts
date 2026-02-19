import { z } from 'zod'

export const itemContratoSchema = z.object({
  contrato_id: z.string().uuid('Contrato inválido'),
  cnpj_id: z.string().uuid('CNPJ inválido'),
  numero_item: z.number().int().positive('Número do item deve ser positivo').optional().nullable(),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  unidade: z.string().min(1, 'Unidade de medida é obrigatória'),
  quantidade: z.number({ required_error: 'Quantidade é obrigatória' }).positive(
    'Quantidade deve ser positiva'
  ),
  valor_unitario: z.number({ required_error: 'Valor unitário é obrigatório' }).positive(
    'Valor unitário deve ser positivo'
  ),
})

export type ItemContratoFormData = z.infer<typeof itemContratoSchema>
