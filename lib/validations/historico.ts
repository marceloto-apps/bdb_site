import { z } from 'zod'

export const registrarLeituraSchema = z.object({
  articleId: z.string().cuid('ID de artigo inválido'),
})

export const historicoPaginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
})

export type RegistrarLeituraInput = z.infer<typeof registrarLeituraSchema>
