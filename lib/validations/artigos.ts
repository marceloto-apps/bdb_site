import { z } from 'zod'
import { ArticleStatus, ArticleType } from '@prisma/client'

export const criarArtigoSchema = z.object({
  title:      z.string().min(3, 'Título obrigatório'),
  slug:       z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  excerpt:    z.string().max(300).optional(),
  content:    z.string().min(1, 'Conteúdo obrigatório'),
  thumbnail:  z.string().url('URL inválida').startsWith('https://res.cloudinary.com/', 'A imagem deve ser hospedada no Cloudinary').optional().or(z.literal('')),
  type:       z.nativeEnum(ArticleType),
  categoryId: z.string().cuid().optional(),
  tags:       z.array(z.string()).default([]),
})

export const atualizarArtigoSchema = criarArtigoSchema.partial()

export const mudarStatusSchema = z.object({
  status: z.nativeEnum(ArticleStatus),
  note:   z.string().optional(),
}).refine(
  // Nota obrigatória ao devolver para RASCUNHO
  (data) => data.status !== 'RASCUNHO' || (data.note && data.note.length > 0),
  { message: 'Comentário obrigatório ao devolver artigo', path: ['note'] }
)

export type CriarArtigoInput    = z.infer<typeof criarArtigoSchema>
export type AtualizarArtigoInput = z.infer<typeof atualizarArtigoSchema>
export type MudarStatusInput    = z.infer<typeof mudarStatusSchema>
