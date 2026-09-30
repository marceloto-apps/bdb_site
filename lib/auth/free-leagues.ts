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
  'uae-pro-league': 36,
  'k-league-1': 37,
  'a-league': 38,
  'cfa-super-league': 39,
  'stars-league': 40,
  'v-league-1': 41,
  'malaysia-super-league': 42,

  // África (ordem do ranking da CAF)
  'egyptian-premier-league': 43,
  'botola-pro': 44,
  'south-african-premier-division': 45,

  // Segundas Divisões Fortes da Europa (na ordem das primeiras divisões acima)
  '2-bundesliga': 46,
  'laliga-2': 47,
  'serie-b': 48,
  'ligue-2': 49,
  'liga-portugal-2': 50,
  'eerste-divisie': 51,
  'league-one': 52,
  'league-two': 53,
  'national-league': 54,
  '3-liga': 55,
  'challenger-pro-league': 56,
  'turkey-1-lig': 57,
  'scottish-championship': 58,
  'scottish-league-one': 59,
  '2-liga-austria': 60,
  'challenge-league': 61,
  'danish-1st-division': 62,

  // Ligas Nórdicas, Leste Europeu e Mediterrâneo (primeiras divisões, ordem do ranking da UEFA)
  'allsvenskan': 63,
  'eliteserien': 64,
  'cypriot-first-division': 65,
  'israeli-premier-league': 66,
  'romanian-super-liga': 67,
  'mozzart-bet-superliga': 68,
  'parva-liga': 69,
  'nb-i': 70,
  'nike-liga': 71,
  'prvaliga': 72,
  'ireland-premier-division': 73,
  'veikkausliiga': 74,
  'besta-deild-karla': 75,

  // Divisões Menores / Acesso Restantes
  'primera-nacional': 76,
  'usl-championship': 77,
  'usl-league-one': 78,
  'canadian-premier-league': 79,
  'j2-league': 80,
  'k-league-2': 81,
  'superettan': 82,
  'norwegian-1st-division': 83,
  'ireland-1st-division': 84,
  'ykkosliiga': 85,
  'npl-new-south-wales': 86,
  'npl-victoria': 87,

  // Feminino
  'nwsl': 88,
}
