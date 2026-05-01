import { prisma } from '@/lib/prisma'

/**
 * Abstração para buscar os favoritos de um usuário de forma paginada.
 * Reutilizável em Server Components, retornando os itens e os dados de paginação.
 */
export async function listarFavoritosPaginado(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit

  const where = {
    userId,
    article: { status: 'PUBLICADO' as const },
  }

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where,
      include: {
        article: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.favorite.count({ where }),
  ])

  return {
    favorites,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
