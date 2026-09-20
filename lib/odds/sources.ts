/**
 * De qual fonte vem a odd de cada casa.
 *
 * `odds_movements.source` e `MatchOdds.source` dizem quem escreveu a linha. A bet365 e a
 * betano são do FLASHSCORE: é o que o usuário vê no Flashscore e é o que o site tem de
 * mostrar. Antes da coluna, a bet365 do site era a mistura de três feeds (TheStatsAPI,
 * OddspAPI e Flashscore) sob o mesmo bookmaker — abertura de um, fechamento de outro,
 * conforme quem chegasse primeiro a cada marco da captura.
 *
 * Quem grava: bdb_ingest, jobs `flashscore-promote-odds` (movimentação) e
 * `flashscore-promote-historical` (abertura/fechamento em `MatchOdds`).
 */

export const ODDS_SOURCE = {
  THESTATSAPI: 'THESTATSAPI',
  ODDSPAPI: 'ODDSPAPI',
  FLASHSCORE: 'FLASHSCORE',
  CONSOLIDATED: 'CONSOLIDATED',
  HISTORICAL: 'HISTORICAL',
  UNKNOWN: 'UNKNOWN',
} as const

/** Casas cuja odd, no site, é a do Flashscore — e só ela. */
export const CASAS_DO_FLASHSCORE = new Set(['bet365', 'betano'])

export function ehCasaDoFlashscore(bookmakerSlug: string): boolean {
  return CASAS_DO_FLASHSCORE.has(bookmakerSlug)
}

/**
 * Filtro de fonte para a casa, ou `undefined` quando a casa não tem fonte dona.
 *
 * Quem usa aplica como PREFERÊNCIA, não como corte: onde o Flashscore não cobre a casa
 * (ele não cota bet365 em USL, J2, Rússia e mais algumas ligas), a consulta sem filtro
 * continua valendo e o painel segue mostrando o histórico antigo em vez de ficar vazio.
 */
export function filtroDeFonte(bookmakerSlug: string): { source: string } | undefined {
  return ehCasaDoFlashscore(bookmakerSlug) ? { source: ODDS_SOURCE.FLASHSCORE } : undefined
}
