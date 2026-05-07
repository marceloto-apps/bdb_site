/**
 * Utilitários para filtrar dados pela temporada corrente.
 * 
 * O banco pode conter partidas de temporadas anteriores associadas à mesma season.
 * Essas funções garantem que apenas dados da temporada atual sejam usados
 * para análises, mantendo dados anteriores apenas para backtest.
 */

/**
 * Retorna a data de início da temporada com base no campo `year`.
 * Para o futebol brasileiro, a temporada começa em janeiro do ano indicado.
 */
export function getSeasonStartDate(seasonYear: string): Date {
  const year = parseInt(seasonYear, 10)
  return new Date(Date.UTC(year, 0, 1)) // 1 de janeiro do ano
}

/**
 * Retorna um filtro Prisma `utcDate` que restringe ao ano da temporada.
 * Usar em `where` do Prisma: `utcDate: getSeasonDateFilter(season.year)`
 */
export function getSeasonDateFilter(seasonYear: string): { gte: Date } {
  return { gte: getSeasonStartDate(seasonYear) }
}

/**
 * Filtra um array de partidas (já carregado) para manter apenas
 * as da temporada indicada pelo ano.
 */
export function filterMatchesBySeason<T extends { utcDate: Date | string }>(
  matches: T[],
  seasonYear: string
): T[] {
  const start = getSeasonStartDate(seasonYear)
  return matches.filter(m => {
    const date = m.utcDate instanceof Date ? m.utcDate : new Date(m.utcDate)
    return date >= start
  })
}
