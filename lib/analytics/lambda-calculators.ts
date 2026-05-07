// lib/analytics/lambda-calculators.ts
// Calculadoras de λ (gols esperados) — 3 métodos independentes

import type {
  MediasTimeXG,
  ForcasTimeXG,
  MediasLigaXG,
  LambdaMethod,
  LambdaCalculationParams,
  LambdasCalculados,
  LambdaComposicao,
} from './types'
import type { MediasTime, ForcasTime } from './forca-time'
import type { MediasLigaCalculadas } from './medias'

/**
 * Método 1 — Média Simples (baseline referencial)
 * 
 * λ_h = (MGC_home + MGSV_away) / 2
 * λ_a = (MGV_away + MGSC_home) / 2
 * 
 * Cruza diretamente ataque de um com defesa do outro.
 * Sem normalização pela liga, sem parâmetros extras.
 * Serve como baseline — se modelos sofisticados não batem isso,
 * algo está errado na calibração.
 */
export function calcularLambdasMediaSimples(
  mediasHome: MediasTime,
  mediasAway: MediasTime
): { lambdaH: number; lambdaA: number } {
  return {
    lambdaH: (mediasHome.mgc + mediasAway.mgsv) / 2,
    lambdaA: (mediasAway.mgv + mediasHome.mgsc) / 2,
  }
}

/**
 * Método 2 — Forças Relativas (Maher 1982 / Dixon-Coles 1997)
 * 
 * λ_h = FCAtC_home × FCDfV_away × μ_h_liga
 * λ_a = FCAtV_away × FCDfC_home × μ_a_liga
 * 
 * Normaliza pela média da liga, captura força relativa.
 * Validado contra planilha BRA1DASHv261.xlsx (ground truth).
 */
export function calcularLambdasForcas(
  forcasHome: ForcasTime,
  forcasAway: ForcasTime,
  ligaMedias: MediasLigaCalculadas
): { lambdaH: number; lambdaA: number } {
  return {
    lambdaH: forcasHome.fcAtC * forcasAway.fcDfV * ligaMedias.muH,
    lambdaA: forcasAway.fcAtV * forcasHome.fcDfC * ligaMedias.muA,
  }
}

/**
 * Método 3 — Expected Goals (xG)
 * 
 * Mesmo pipeline de forças relativas, alimentado por xG
 * em vez de gols observados.
 * Captura qualidade de chances criadas, reduz impacto do azar.
 * Requer MatchStats.homeXg/awayXg disponíveis no banco.
 */
export function calcularLambdasXG(
  forcasHomeXG: ForcasTimeXG,
  forcasAwayXG: ForcasTimeXG,
  ligaMediasXG: MediasLigaXG
): { lambdaH: number; lambdaA: number } {
  return {
    lambdaH: forcasHomeXG.fcAtC * forcasAwayXG.fcDfV * ligaMediasXG.muH,
    lambdaA: forcasAwayXG.fcAtV * forcasHomeXG.fcDfC * ligaMediasXG.muA,
  }
}

/**
 * Roteia para o método de cálculo correto.
 * Se xG selecionado mas indisponível, faz fallback silencioso para Forças Relativas.
 */
export function calcularLambdas(
  method: LambdaMethod,
  params: LambdaCalculationParams
): { lambdaH: number; lambdaA: number; fallback: boolean } {
  switch (method) {
    case 'MEDIA_SIMPLES':
      return {
        ...calcularLambdasMediaSimples(params.mediasHome, params.mediasAway),
        fallback: false,
      }

    case 'FORCAS_RELATIVAS':
      return {
        ...calcularLambdasForcas(params.forcasHome, params.forcasAway, params.ligaMedias),
        fallback: false,
      }

    case 'XG':
      if (!params.forcasHomeXG || !params.forcasAwayXG || !params.ligaMediasXG) {
        // Fallback silencioso para Forças Relativas
        return {
          ...calcularLambdasForcas(params.forcasHome, params.forcasAway, params.ligaMedias),
          fallback: true,
        }
      }
      return {
        ...calcularLambdasXG(params.forcasHomeXG, params.forcasAwayXG, params.ligaMediasXG),
        fallback: false,
      }
  }
}

/**
 * Calcula os 3 lambdas simultaneamente para exibição comparativa.
 * Usado pelo PainelMedias para mostrar todos os valores lado a lado.
 */
export function calcularTodosLambdas(
  params: LambdaCalculationParams
): LambdasCalculados {
  const mediaSimples = calcularLambdasMediaSimples(
    params.mediasHome,
    params.mediasAway
  )

  const forcasRelativas = calcularLambdasForcas(
    params.forcasHome,
    params.forcasAway,
    params.ligaMedias
  )

  let xg: { lambdaH: number; lambdaA: number } | null = null
  if (params.forcasHomeXG && params.forcasAwayXG && params.ligaMediasXG) {
    xg = calcularLambdasXG(
      params.forcasHomeXG,
      params.forcasAwayXG,
      params.ligaMediasXG
    )
  }

  return { mediaSimples, forcasRelativas, xg }
}

/**
 * Monta a composição detalhada das variáveis de cada λ.
 * Usado para exibir os componentes no PainelMedias.
 */
export function montarComposicaoLambdas(
  params: LambdaCalculationParams
): LambdaComposicao {
  return {
    mediaSimples: {
      home: {
        mgc: params.mediasHome.mgc,
        mgsvAdv: params.mediasAway.mgsv,
      },
      away: {
        mgv: params.mediasAway.mgv,
        mgscAdv: params.mediasHome.mgsc,
      },
    },
    forcasRelativas: {
      home: {
        fcAtC: params.forcasHome.fcAtC,
        fcDfVAdv: params.forcasAway.fcDfV,
        muH: params.ligaMedias.muH,
      },
      away: {
        fcAtV: params.forcasAway.fcAtV,
        fcDfCAdv: params.forcasHome.fcDfC,
        muA: params.ligaMedias.muA,
      },
    },
    xg: params.forcasHomeXG && params.forcasAwayXG && params.ligaMediasXG
      ? {
          home: {
            fcAtCxg: params.forcasHomeXG.fcAtC,
            fcDfVxgAdv: params.forcasAwayXG.fcDfV,
            muHxg: params.ligaMediasXG.muH,
          },
          away: {
            fcAtVxg: params.forcasAwayXG.fcAtV,
            fcDfCxgAdv: params.forcasHomeXG.fcDfC,
            muAxg: params.ligaMediasXG.muA,
          },
        }
      : null,
  }
}
