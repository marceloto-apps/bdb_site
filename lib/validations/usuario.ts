import { z } from 'zod'

export const atualizarPerfilSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo').optional(),
  image: z.string().url('URL de imagem inválida').optional(),
})

export const trocarSenhaSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatória'),
  newPassword: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres').max(100, 'A nova senha é muito longa'),
})

export type AtualizarPerfilInput = z.infer<typeof atualizarPerfilSchema>
export type TrocarSenhaInput = z.infer<typeof trocarSenhaSchema>
