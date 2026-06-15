export const FREE_LEAGUE_SLUGS = [
  'brasileirao-serie-a',
  'brasileirao-serie-b',
  'division-profesional'
]

/**
 * Retorna true se a liga (identificada pelo seu slug) for gratuita temporariamente.
 */
export function isLeagueFree(slug: string): boolean {
  return FREE_LEAGUE_SLUGS.includes(slug)
}
