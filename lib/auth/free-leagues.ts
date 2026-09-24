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
  'chilean-primera-division': 30,
  'primera-division-apertura': 31,
  'peruvian-liga-1': 32,
  'division-profesional': 33,

  // Ásia e Oriente Médio
  'j1-league': 34,
  'saudi-pro-league': 35,
  'k-league-1': 36,
  'cfa-super-league': 37,
  'stars-league': 38,

  // África (ordem do ranking da CAF)
  'egyptian-premier-league': 39,
  'botola-pro': 40,
  'south-african-premier-division': 41,

  // Segundas Divisões Fortes da Europa (na ordem das primeiras divisões acima)
  '2-bundesliga': 42,
  'laliga-2': 43,
  'serie-b': 44,
  'ligue-2': 45,
  'liga-portugal-2': 46,
  'eerste-divisie': 47,
  'league-one': 48,
  'league-two': 49,
  '3-liga': 50,
  'challenger-pro-league': 51,
  'turkey-1-lig': 52,
  'scottish-championship': 53,
  '2-liga-austria': 54,
  'challenge-league': 55,

  // Ligas Nórdicas, Leste Europeu e Mediterrâneo (primeiras divisões, ordem do ranking da UEFA)
  'allsvenskan': 56,
  'eliteserien': 57,
  'cypriot-first-division': 58,
  'israeli-premier-league': 59,
  'romanian-super-liga': 60,
  'mozzart-bet-superliga': 61,
  'parva-liga': 62,
  'nb-i': 63,
  'nike-liga': 64,
  'prvaliga': 65,
  'ireland-premier-division': 66,
  'veikkausliiga': 67,

  // Divisões Menores / Acesso Restantes
  'primera-nacional': 68,
  'usl-championship': 69,
  'canadian-premier-league': 70,
  'j2-league': 71,
  'k-league-2': 72,
  'superettan': 73,
  'norwegian-1st-division': 74,
  'ireland-1st-division': 75,
  'ykkosliiga': 76,
}
