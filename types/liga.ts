import type { LambdaMethod, LambdasCalculados, LambdaComposicao, MediasTimeXG, ForcasTimeXG, MediasLigaXG } from '@/lib/analytics/types'
import type { MediasTime, ForcasTime } from '@/lib/analytics/forca-time'
import type { MediasLigaCalculadas } from '@/lib/analytics/medias'

export interface TimeOption {
  id: string
  name: string
  shortName: string | null
  logoUrl: string | null
}

export interface FiltrosLiga {
  homeTeamId: string | null
  awayTeamId: string | null
  roundFrom: number | null
  roundTo: number | null
  months: number[]
  oddsCasa: FaixaOddsSelection[]
  oddsVisitante: FaixaOddsSelection[]
}

export interface FaixaOddsSelection {
  label: string
  min: number
  max: number
  selected: boolean
}

export type ModeloEstatistico = 'POISSON' | 'ZIP' | 'NB' | 'DIXON_COLES'
export type ModoModelo = ModeloEstatistico

export const FAIXAS_ODDS_PADRAO: FaixaOddsSelection[] = [
  { label: '1.21-1.40', min: 1.21, max: 1.40, selected: true },
  { label: '1.41-1.70', min: 1.41, max: 1.70, selected: true },
  { label: '1.71-2.00', min: 1.71, max: 2.00, selected: true },
  { label: '2.01-2.30', min: 2.01, max: 2.30, selected: true },
  { label: '2.31-2.70', min: 2.31, max: 2.70, selected: true },
  { label: '2.71-3.50', min: 2.71, max: 3.50, selected: true },
  { label: '3.51-5.00', min: 3.51, max: 5.00, selected: true },
  { label: '5.01-9.00', min: 5.01, max: 9.00, selected: true },
  { label: '9.01-16.00', min: 9.01, max: 16.00, selected: true },
]

export const MESES_PT: Record<number, string> = {
  1: 'JAN', 2: 'FEV', 3: 'MAR', 4: 'ABR', 5: 'MAI', 6: 'JUN',
  7: 'JUL', 8: 'AGO', 9: 'SET', 10: 'OUT', 11: 'NOV', 12: 'DEZ',
}

// Removing simplified interfaces since we import from lib/analytics/types

export interface MercadosModel {
  casa: { prob: number; oddJusta: number }
  empate: { prob: number; oddJusta: number }
  visitante: { prob: number; oddJusta: number }
  btts: { sim: number; nao: number }
  overUnder: {
    '0.5': { over: number; under: number }
    '1.5': { over: number; under: number }
    '2.5': { over: number; under: number }
    '3.5': { over: number; under: number }
    '4.5': { over: number; under: number }
  }
  handicaps: { linha: number; casa: number; visitante: number }[]
}

export interface PrevisaoResponse {
  modelo: ModeloEstatistico
  medias: {
    home: MediasTime
    away: MediasTime
    liga: MediasLigaCalculadas & { totalJogos: number }
  }
  forcas: {
    home: ForcasTime
    away: ForcasTime
  }
  lambdas: { home: number, away: number }
  matrizPlacares: number[][]
  mercados: MercadosModel
  evPorMercado: Record<string, number> | null
  nbWarning: 'FALLBACK_PARCIAL_HOME' | 'FALLBACK_PARCIAL_AWAY' | 'FALLBACK_TOTAL' | null
  rhoClamped: boolean
  rhoEstimado: number
  warnings: string[]
  
  lambdaMethodAtivo: LambdaMethod
  lambdaFallback: boolean
  todosLambdas: LambdasCalculados
  composicao: LambdaComposicao
  xgDisponivel: boolean
  xgJogosDisponiveis: number
  mediasHomeXG?: MediasTimeXG | null
  mediasAwayXG?: MediasTimeXG | null
  forcasHomeXG?: ForcasTimeXG | null
  forcasAwayXG?: ForcasTimeXG | null
  ligaMediasXG?: MediasLigaXG | null
  oddsFaixasDisponiveisCasa: boolean[]
  oddsFaixasDisponiveisVisitante: boolean[]
}

export type PrevisaoState = PrevisaoResponse

export interface MapaValorFaixa {
  id: string
  label: string
  probabilidadeBase: number
  probabilidadeAjustada: number
  oddJusta: number
  oddMercado: number
  ev: number
}

export interface MapaValorResponse {
  casa: MapaValorFaixa[]
  empate: MapaValorFaixa[]
  visitante: MapaValorFaixa[]
}
