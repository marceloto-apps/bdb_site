import { prisma } from '@/lib/prisma'

export function gerarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')   // remove especiais
    .trim()
    .replace(/\s+/g, '-')           // espaços → hífens
    .replace(/-+/g, '-')            // hífens duplos → simples
}

export async function slugEstaDisponivel(
  slug: string,
  ignorarId?: string
): Promise<boolean> {
  const artigo = await prisma.article.findUnique({ where: { slug } })
  if (!artigo) return true
  return artigo.id === ignorarId
}
