import { prisma } from '@/lib/prisma'

/**
 * Busca partidas FINISHED que ainda não têm dados na tabela alvo.
 *
 * @param targetTable - 'MatchStats' | 'PlayerMatchStats' | 'Shot'
 * @param seasonId - Opcional: filtrar por temporada
 * @param limit - Quantidade máxima de jogos por batch
 * @returns Array de { id, externalId } de matches pendentes
 */
export async function getMatchesPendingSync(
  targetTable: 'MatchStats' | 'PlayerMatchStats' | 'Shot',
  seasonId?: string,
  limit: number = 50
) {
  // Monta a condição de "não existe na tabela alvo"
  const notExistsCondition = {
    MatchStats: { stats: { is: null } },
    PlayerMatchStats: { playerStats: { none: {} } },
    Shot: { shots: { none: {} } },
  }[targetTable]

  const matches = await prisma.match.findMany({
    where: {
      status: 'FINISHED',
      ...(seasonId ? { seasonId } : {}),
      ...notExistsCondition,
    },
    select: {
      id: true,
      externalId: true,
    },
    orderBy: { utcDate: 'asc' },
    take: limit,
  })

  return matches
}

/**
 * IDs das 3 seasons no banco
 * Usar para filtrar por temporada nos endpoints de backfill
 */
export const SEASON_IDS = {
  2024: 'season_brasileirao_2024',
  2025: 'season_brasileirao_2025',
  2026: 'season_brasileirao_2026',
} as const
