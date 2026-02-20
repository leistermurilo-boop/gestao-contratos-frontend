import { z } from 'zod'

export const cadastroSchema = z
  .object({
    // Empresa
    razao_social: z.string().min(2, 'Razão social deve ter ao menos 2 caracteres'),
    nome_fantasia: z.string().optional(),

    // Administrador
    nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    password_confirm: z.string().min(1, 'Confirme a senha'),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'As senhas não conferem',
    path: ['password_confirm'],
  })

export type CadastroFormData = z.infer<typeof cadastroSchema>
