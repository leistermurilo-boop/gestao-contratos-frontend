import { z } from 'zod'

export const contratoSchema = z
  .object({
    cnpj_id: z.string().uuid('CNPJ inválido'),
    numero_contrato: z.string().min(1, 'Número do contrato é obrigatório'),
    orgao_publico: z.string().min(1, 'Órgão público é obrigatório'),
    cnpj_orgao: z
      .string()
      .regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos')
      .optional()
      .or(z.literal('')),
    esfera: z.enum(['municipal', 'estadual', 'federal']).optional().nullable(),
    objeto: z.string().optional().nullable(),
    valor_total: z.number({ required_error: 'Valor total é obrigatório' }).positive(
      'Valor total deve ser positivo'
    ),
    data_assinatura: z.string().min(1, 'Data de assinatura é obrigatória'),
    data_vigencia_inicio: z.string().min(1, 'Data de início é obrigatória'),
    data_vigencia_fim: z.string().min(1, 'Data de fim é obrigatória'),
    prorrogado: z.boolean().default(false),
    data_vigencia_fim_prorrogacao: z.string().optional().nullable(),
    indice_reajuste: z.string().optional().nullable(),
    status: z
      .enum(['ativo', 'concluido', 'rescindido', 'suspenso', 'arquivado'])
      .default('ativo'),
  })
  .refine(
    (data) => data.data_vigencia_inicio <= data.data_vigencia_fim,
    {
      message: 'Data de início não pode ser maior que a data de fim',
      path: ['data_vigencia_fim'],
    }
  )
  .refine(
    (data) =>
      !data.prorrogado || !!data.data_vigencia_fim_prorrogacao,
    {
      message: 'Informe a nova data de vigência para prorrogação',
      path: ['data_vigencia_fim_prorrogacao'],
    }
  )

export type ContratoFormData = z.infer<typeof contratoSchema>
