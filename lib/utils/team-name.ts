/**
 * Nome de exibição de um time.
 *
 * O nome canônico (`Team.name`) passa por revisão humana no bdb_ingest, que grava
 * `nameReviewedAt` (o nome como o Brasil chama o clube: "IFK Göteborg", "Malmö FF").
 * Regra de exibição: nome revisado sempre que existir; sem revisão (time recém-criado
 * pela ingestão, liga nova), cai no nome curto da TheStatsAPI e, na falta dele, no nome.
 *
 * Toda tela que mostra o nome de um time deve passar por aqui, para a regra não se
 * espalhar em condicionais `shortName || name` pelos componentes.
 */

export interface TeamNameFields {
  name: string
  shortName?: string | null
  nameReviewedAt?: Date | string | null
}

export function nomeExibicao(team: TeamNameFields): string {
  if (team.nameReviewedAt) return team.name
  return team.shortName || team.name
}

/** Versão curta para espaços apertados (mobile): revisado, senão curto, senão 3 letras. */
export function nomeAbreviado(team: TeamNameFields): string {
  if (team.nameReviewedAt) return team.name
  return team.shortName || team.name.substring(0, 3)
}
