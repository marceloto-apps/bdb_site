import { z } from 'zod'

export const favoritarSchema = z.object({
  articleId: z.string().cuid('ID de artigo inválido'),
})

export const favoritosPaginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(12),
})

export type FavoritarInput = z.infer<typeof favoritarSchema>
