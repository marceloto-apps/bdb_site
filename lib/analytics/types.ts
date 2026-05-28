import { ModeloEstatistico } from './model-selector'
import { MediasTime, ForcasTime, DispersaoTime } from './forca-time'
import { MediasLigaCalculadas } from './medias'

/** Método de estimativa do λ (gols esperados por time no confronto) */
export type LambdaMethod = 'MEDIA_SIMPLES' | 'FORCAS_RELATIVAS' | 'XG' | 'MERCADO'

/** Médias calculadas via xG (estrutura idêntica a MediasTime) */
export interface MediasTimeXG {
  xgFC: number    // xG criado como mandante (média)
  xgSC: number    // xG concedido como mandante (média)
  xgFV: number    // xG criado como visitante (média)
  xgSV: number    // xG concedido como visitante (média)
  jogosCasa: number
  jogosFora: number
  dispersaoCasa: DispersaoTime
  dispersaoFora: DispersaoTime
}

/** Médias da liga calculadas via xG */
export interface MediasLigaXG {
  muH: number       // média de xG do mandante na liga
  muA: number       // média de xG do visitante na liga
  varH: number
  varA: number
  totalJogos: number
}

/** Forças calculadas via xG (mesma estrutura de ForcasTime) */
export interface ForcasTimeXG {
  fcAtC: number   // força ofensiva xG como mandante
  fcDfC: number   // força defensiva xG como mandante
  fcAtV: number   // força ofensiva xG como visitante
  fcDfV: number   // força defensiva xG como visitante
}

/** Resultado completo dos 3 cálculos de λ para exibição simultânea */
export interface LambdasCalculados {
  mediaSimples: { lambdaH: number; lambdaA: number }
  forcasRelativas: { lambdaH: number; lambdaA: number }
  xg: { lambdaH: number; lambdaA: number } | null  // null se xG indisponível
  mercado: { lambdaH: number; lambdaA: number } | null // null se Mercado indisponível
}

/** Variáveis que compõem cada λ (para exibição no painel) */
export interface LambdaComposicao {
  mediaSimples: {
    home: { mgc: number; mgsvAdv: number }        // média gols casa + média sofrida fora adversário
    away: { mgv: number; mgscAdv: number }         // média gols fora + média sofrida casa adversário
  }
  forcasRelativas: {
    home: { fcAtC: number; fcDfVAdv: number; muH: number }
    away: { fcAtV: number; fcDfCAdv: number; muA: number }
  }
  xg: {
    home: { fcAtCxg: number; fcDfVxgAdv: number; muHxg: number }
    away: { fcAtVxg: number; fcDfCxgAdv: number; muAxg: number }
  } | null
  mercado?: {
    fonte: string
    capturadoEm: Date
  } | null
}

/** Parâmetros para o dispatcher de λ */
export interface LambdaCalculationParams {
  mediasHome: MediasTime
  mediasAway: MediasTime
  forcasHome: ForcasTime
  forcasAway: ForcasTime
  ligaMedias: MediasLigaCalculadas
  mediasHomeXG?: MediasTimeXG
  mediasAwayXG?: MediasTimeXG
  forcasHomeXG?: ForcasTimeXG
  forcasAwayXG?: ForcasTimeXG
  ligaMediasXG?: MediasLigaXG
  lambdaMercado?: { lambdaH: number; lambdaA: number; capturadoEm?: Date } | null
}

export interface PrevisaoConfig {
  lambdaMethod: LambdaMethod
  modelo: ModeloEstatistico
  homeTeamId: string
  awayTeamId: string
  filtros?: {
    ultimasRodadas?: number
    mandoOnly?: boolean
  }
}
