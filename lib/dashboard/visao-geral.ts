import { prisma } from '@/lib/prisma'

export async function carregarVisaoGeral(userId: string) {
  // Executa todas as 5 queries em paralelo com Promise.all
  const [usuario, ultimasLeituras, favoritosRecentes, totalLeituras, totalFavoritos] = await Promise.all([
    // 1. Dados do usuário
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, image: true },
    }),

    // 2. 5 últimas leituras (filtrando PUBLICADO)
    prisma.readHistory.findMany({
      take: 5,
      orderBy: { readAt: 'desc' },
      where: {
        userId,
        article: { status: 'PUBLICADO' },
      },
      include: {
        article: {
          include: { category: true },
        },
      },
    }),

    // 3. 4 favoritos mais recentes (filtrando PUBLICADO)
    prisma.favorite.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      where: {
        userId,
        article: { status: 'PUBLICADO' },
      },
      include: {
        article: {
          include: { category: true },
        },
      },
    }),

    // 4. Contagem total de leituras
    prisma.readHistory.count({
      where: { userId },
    }),

    // 5. Contagem total de favoritos
    prisma.favorite.count({
      where: { userId },
    }),
  ])

  return {
    usuario: usuario || { name: 'Visitante', image: null },
    ultimasLeituras,
    favoritosRecentes,
    estatisticas: {
      totalLeituras,
      totalFavoritos,
    },
  }
}
