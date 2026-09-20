/**
 * Lista de slugs das ligas que são oficialmente FREE no modelo de planos.
 * Usado para definir se a liga exibe o badge 'FREE' ou 'VIP' no card.
 */
export const FREE_LEAGUE_SLUGS = [
  'brasileirao-serie-a',
  'brasileirao-serie-b',
  'division-profesional'
]

/**
 * Flag de liberação temporária de TODAS as ligas para usuários com conta Free.
 * Quando `true`, qualquer usuário autenticado tem acesso total às ligas,
 * mantendo visualmente o selo/badge 'VIP' nos cards das ligas VIP.
 * Para encerrar a liberação e voltar a exigir plano VIP, basta alterar para `false`.
 */
export const TEMPORARY_ALL_LEAGUES_FREE = true

/**
 * Retorna true se a liga (identificada pelo seu slug) for originalmente do plano Free.
 */
export function isLeagueFree(slug: string): boolean {
  return FREE_LEAGUE_SLUGS.includes(slug)
}

/**
 * Retorna true se o usuário tem permissão para acessar o dashboard e APIs da liga.
 */
export function isLeagueAccessible(slug: string, isVip: boolean = false): boolean {
  if (TEMPORARY_ALL_LEAGUES_FREE) return true
  return isVip || isLeagueFree(slug)
}

/**
 * Ordem de relevância/tamanho das ligas para exibição no catálogo.
 * Mantém Brasileirão Série A e Série B no topo, seguidos pelas Big 5 europeias,
 * grandes ligas da Europa, Américas, Ásia, divisões de acesso e demais ligas.
 */
export const LEAGUE_ORDER_RANK: Record<string, number> = {
  // Top 1 e 2 prioritários
  'brasileirao-serie-a': 1,
  'brasileirao-serie-b': 2,

  // Big 5 Europeias
  'premier-league': 3,
  'la-liga': 4,
  'serie-a': 5,
  'bundesliga': 6,
  'ligue-1': 7,

  // Grandes Ligas Europeias (Tier 1.5)
  'liga-portugal': 8,
  'eredivisie': 9,
  'championship': 10,
  'pro-league': 11,
  'trendyol-super-lig': 12,
  'scottish-premiership': 13,
  'austrian-bundesliga': 14,
  'swiss-super-league': 15,
  'russian-premier-league': 16,
  'stoiximan-super-league': 17,
  'danish-superliga': 18,
  'czech-first-league': 19,
  'ekstraklasa': 20,
  'hnl': 21,
  'ukrainian-premier-league': 22,

  // Américas (Grandes ligas continentais)
  'liga-profesional': 23,
  'mls': 24,
  'liga-mx-apertura': 25,
  'liga-mx-clausura': 26,
  'primera-a-apertura': 27,
  'uruguayan-primera-division': 28,
  'ligapro-serie-a': 29,
  'primera-division-apertura': 30,
  'division-profesional': 31,

  // Ásia e Oriente Médio
  'j1-league': 32,
  'k-league-1': 33,
  'cfa-super-league': 34,
  'stars-league': 35,

  // Segundas Divisões Fortes da Europa
  '2-bundesliga': 36,
  'laliga-2': 37,
  'serie-b': 38,
  'ligue-2': 39,
  'liga-portugal-2': 40,
  'league-one': 41,
  'league-two': 42,
  '3-liga': 43,
  'challenger-pro-league': 44,
  'scottish-championship': 45,
  '2-liga-austria': 46,
  'challenge-league': 47,

  // Ligas Nórdicas e Leste Europeu
  'allsvenskan': 48,
  'eliteserien': 49,
  'romanian-super-liga': 50,
  'mozzart-bet-superliga': 51,
  'parva-liga': 52,
  'nb-i': 53,
  'nike-liga': 54,
  'prvaliga': 55,
  'veikkausliiga': 56,

  // Divisões Menores / Acesso Restantes
  'usl-championship': 57,
  'canadian-premier-league': 58,
  'j2-league': 59,
  'k-league-2': 60,
  'superettan': 61,
  'norwegian-1st-division': 62,
  'ireland-1st-division': 63,
  'ykkosliiga': 64,
}
