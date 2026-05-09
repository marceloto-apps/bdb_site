import { Match } from '@prisma/client'
import type { MediasLigaXG, MediasTimeXG, ForcasTimeXG } from './types'
import { pesoTemporal } from './decay'
import { getDispersao } from './forca-time'

export interface MediasLigaCalculadas {
  muH: number   // \mu_h^liga (Média de FTHG)
  muA: number   // \mu_a^liga (Média de FTAG)
  varH: number
  varA: number
  totalJogos: number
}

/**
 * Calcula \mu_h e \mu_a usando os jogos concluídos da liga.
 * Não aplicar filtros de odd ou data nesta etapa.
 */
export function calcularMediasLiga(jogos: Match[]): MediasLigaCalculadas {
  const jogosConcluidos = jogos.filter((j) => j.fthg !== null && j.ftag !== null)
  const totalJogos = jogosConcluidos.length

  if (totalJogos < 20) {
    throw new Error('Liga com menos de 20 jogos não permite cálculo confiável')
  }

  const muH = jogosConcluidos.reduce((s, j) => s + (j.fthg as number), 0) / totalJogos
  const muA = jogosConcluidos.reduce((s, j) => s + (j.ftag as number), 0) / totalJogos

  const varH = jogosConcluidos.reduce((s, j) => s + Math.pow((j.fthg as number) - muH, 2), 0) / totalJogos
  const varA = jogosConcluidos.reduce((s, j) => s + Math.pow((j.ftag as number) - muA, 2), 0) / totalJogos

  return { muH, muA, varH, varA, totalJogos }
}

/**
 * Tipo auxiliar — jogo com stats de xG carregados.
 * O join com MatchStats deve ser feito na query Prisma.
 */
export interface MatchComStats {
  homeTeamId: string
  awayTeamId: string
  fthg: number
  ftag: number
  utcDate: Date
  stats?: {
    homeXg: number | null
    awayXg: number | null
  } | null
}

/**
 * Calcula μ_h e μ_a da liga usando xG (análogo a calcularMediasLiga).
 * Filtra apenas jogos com xG disponível.
 * Se < 20 jogos com xG, lança erro.
 */
export function calcularMediasLigaXG(
  jogos: MatchComStats[]
): MediasLigaXG {
  const jogosComXG = jogos.filter(
    j => j.stats?.homeXg != null && j.stats?.awayXg != null
  )

  if (jogosComXG.length < 20) {
    throw new Error(
      `Liga com apenas ${jogosComXG.length} jogos com xG (mínimo: 20)`
    )
  }

  const muH = jogosComXG.reduce(
    (s, j) => s + j.stats!.homeXg!, 0
  ) / jogosComXG.length

  const muA = jogosComXG.reduce(
    (s, j) => s + j.stats!.awayXg!, 0
  ) / jogosComXG.length

  const varH = jogosComXG.reduce(
    (s, j) => s + Math.pow(j.stats!.homeXg! - muH, 2), 0
  ) / jogosComXG.length

  const varA = jogosComXG.reduce(
    (s, j) => s + Math.pow(j.stats!.awayXg! - muA, 2), 0
  ) / jogosComXG.length

  return { muH, muA, varH, varA, totalJogos: jogosComXG.length }
}

/**
 * Calcula as 4 médias individuais do time via xG.
 * xgFC = média de xG criado como mandante
 * xgSC = média de xG concedido como mandante
 * xgFV = média de xG criado como visitante
 * xgSV = média de xG concedido como visitante
 * 
 * ATENÇÃO ao mapeamento:
 * - Time MANDANTE: xG criado = stats.homeXg, xG concedido = stats.awayXg
 * - Time VISITANTE: xG criado = stats.awayXg, xG concedido = stats.homeXg
 */
export function calcularMediasTimeXG(
  teamId: string,
  jogos: MatchComStats[]
): MediasTimeXG {
  const jogosComXG = jogos.filter(
    j => j.stats?.homeXg != null && j.stats?.awayXg != null
  )

  const jogosCasa = jogosComXG.filter(j => j.homeTeamId === teamId)
  const jogosFora = jogosComXG.filter(j => j.awayTeamId === teamId)

  if (jogosCasa.length < 5 || jogosFora.length < 5) {
    throw new Error(
      `Time ${teamId}: poucos jogos com xG (casa: ${jogosCasa.length}, fora: ${jogosFora.length})`
    )
  }

  return {
    xgFC: jogosCasa.reduce((s, j) => s + j.stats!.homeXg!, 0) / jogosCasa.length,
    xgSC: jogosCasa.reduce((s, j) => s + j.stats!.awayXg!, 0) / jogosCasa.length,
    xgFV: jogosFora.reduce((s, j) => s + j.stats!.awayXg!, 0) / jogosFora.length,
    xgSV: jogosFora.reduce((s, j) => s + j.stats!.homeXg!, 0) / jogosFora.length,
    jogosCasa: jogosCasa.length,
    jogosFora: jogosFora.length,
    dispersaoCasa: getDispersao(jogosCasa.map(j => j.stats!.homeXg!)),
    dispersaoFora: getDispersao(jogosFora.map(j => j.stats!.awayXg!)),
  }
}

/**
 * Calcula forças individuais do time via xG.
 * Estrutura idêntica a calcularForcasTime, usando xG como input.
 */
export function calcularForcasTimeXG(
  mediasXG: MediasTimeXG,
  ligaMediasXG: MediasLigaXG
): ForcasTimeXG {
  return {
    fcAtC: mediasXG.xgFC / (ligaMediasXG.muH || 1),
    fcDfC: mediasXG.xgSC / (ligaMediasXG.muA || 1),
    fcAtV: mediasXG.xgFV / (ligaMediasXG.muA || 1),
    fcDfV: mediasXG.xgSV / (ligaMediasXG.muH || 1),
  }
}

/**
 * Calcula médias individuais do time via xG COM decay temporal.
 * Análogo a calcularMediasTimeComDecay, usando xG em vez de gols.
 * Aplicar nos modelos 2, 3 e 4 (Dixon-Coles, ZIP, BN).
 */
export function calcularMediasTimeXGComDecay(
  teamId: string,
  jogos: MatchComStats[],
  dataReferencia: Date,
  xi: number = 0.0065
): MediasTimeXG {
  const jogosComXG = jogos.filter(
    j => j.stats?.homeXg != null && j.stats?.awayXg != null
  )

  const jogosCasa = jogosComXG.filter(j => j.homeTeamId === teamId)
  const jogosFora = jogosComXG.filter(j => j.awayTeamId === teamId)

  if (jogosCasa.length < 5 || jogosFora.length < 5) {
    throw new Error(`Time ${teamId}: poucos jogos com xG para decay`)
  }

  // Reutilizar a função pesoTemporal já existente
  const pesosCasa = jogosCasa.map(j => pesoTemporal(j.utcDate, dataReferencia, xi))
  const somaPesosCasa = pesosCasa.reduce((s, w) => s + w, 0)

  const pesosFora = jogosFora.map(j => pesoTemporal(j.utcDate, dataReferencia, xi))
  const somaPesosFora = pesosFora.reduce((s, w) => s + w, 0)

  return {
    xgFC: jogosCasa.reduce((s, j, i) => s + j.stats!.homeXg! * pesosCasa[i], 0) / somaPesosCasa,
    xgSC: jogosCasa.reduce((s, j, i) => s + j.stats!.awayXg! * pesosCasa[i], 0) / somaPesosCasa,
    xgFV: jogosFora.reduce((s, j, i) => s + j.stats!.awayXg! * pesosFora[i], 0) / somaPesosFora,
    xgSV: jogosFora.reduce((s, j, i) => s + j.stats!.homeXg! * pesosFora[i], 0) / somaPesosFora,
    jogosCasa: jogosCasa.length,
    jogosFora: jogosFora.length,
    dispersaoCasa: getDispersao(jogosCasa.map(j => j.stats!.homeXg!)),
    dispersaoFora: getDispersao(jogosFora.map(j => j.stats!.awayXg!)),
  }
}
