// lib/analytics/lambda-calculators.ts
// Calculadoras de λ (gols esperados) — 3 métodos independentes

import type {
  ForcasTimeXG,
  MediasLigaXG,
  LambdaMethod,
  LambdaCalculationParams,
  LambdasCalculados,
  LambdaComposicao,
} from './types'
import type { MediasTime, ForcasTime } from './forca-time'
import type { MediasLigaCalculadas } from './medias'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { encontrarLambdaIterativo } from '@/lib/ferramentas/over-under-25/poisson-25'
import { poissonCdf, poissonPmf } from './poisson'

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

// Odds precisam ser > 1.01 para serem válidas
const oddsMercadoSchema = z.object({
  casa: z.number().gt(1.01),
  empate: z.number().gt(1.01),
  fora: z.number().gt(1.01),
  over25: z.number().gt(1.01),
  under25: z.number().gt(1.01),
})

/**
 * Calibra os lambdas via engenharia reversa das odds usando a Abordagem B:
 * 1. Remove overround (vig) proporcionalmente para as odds 1X2 e Over/Under 2.5.
 * 2. Encontra o lambda total (λ_T) via bisseção tal que P(Under 2.5) = poissonCdf(λ_T, 2).
 * 3. Encontra a proporção α ideal (λ_H = α λ_T, λ_A = (1-α) λ_T) minimizando o erro quadrático
 *    médio entre as probabilidades implícitas no modelo e as probabilidades justas do mercado 1X2.
 * 4. Aplica guard rails de consistência e sanitários.
 */
export function calibrarLambdas(odds: {
  casa: number
  empate: number
  fora: number
  over25: number
  under25: number
}): { lambdaH: number; lambdaA: number } {
  const pHome = 1 / odds.casa
  const pDraw = 1 / odds.empate
  const pAway = 1 / odds.fora
  const sum1X2 = pHome + pDraw + pAway

  const fairHome = pHome / sum1X2
  const fairDraw = pDraw / sum1X2
  const fairAway = pAway / sum1X2

  const pOver = 1 / odds.over25
  const pUnder = 1 / odds.under25
  const sumOU = pOver + pUnder

  const fairUnder = pUnder / sumOU

  const lambdaT = encontrarLambdaIterativo(fairUnder)

  const calcularErroAlpha = (alpha: number): number => {
    const lH = alpha * lambdaT
    const lA = (1 - alpha) * lambdaT

    let pH = 0
    let pD = 0
    let pA = 0

    const maxGoals = 10
    const pmfH = new Array(maxGoals + 1)
    const pmfA = new Array(maxGoals + 1)
    for (let i = 0; i <= maxGoals; i++) {
      pmfH[i] = poissonPmf(lH, i)
      pmfA[i] = poissonPmf(lA, i)
    }

    for (let h = 0; h <= maxGoals; h++) {
      for (let a = 0; a <= maxGoals; a++) {
        const p = pmfH[h] * pmfA[a]
        if (h > a) pH += p
        else if (h === a) pD += p
        else pA += p
      }
    }

    return Math.pow(pH - fairHome, 2) + Math.pow(pD - fairDraw, 2) + Math.pow(pA - fairAway, 2)
  }

  let bestAlpha = 0.5
  let minError = Infinity

  for (let i = 1; i <= 99; i++) {
    const alphaVal = i / 100
    const err = calcularErroAlpha(alphaVal)
    if (err < minError) {
      minError = err
      bestAlpha = alphaVal
    }
  }

  let start = Math.max(0.001, bestAlpha - 0.01)
  let end = Math.min(0.999, bestAlpha + 0.01)
  for (let val = start; val <= end; val += 0.001) {
    const err = calcularErroAlpha(val)
    if (err < minError) {
      minError = err
      bestAlpha = val
    }
  }

  start = Math.max(0.001, bestAlpha - 0.001)
  end = Math.min(0.999, bestAlpha + 0.001)
  for (let val = start; val <= end; val += 0.0001) {
    const err = calcularErroAlpha(val)
    if (err < minError) {
      minError = err
      bestAlpha = val
    }
  }

  const lambdaH = bestAlpha * lambdaT
  const lambdaA = (1 - bestAlpha) * lambdaT

  const modelOver = 1 - poissonCdf(lambdaH + lambdaA, 2)
  const desvioOver = Math.abs(modelOver - (1 - fairUnder))

  if (
    !Number.isFinite(lambdaH) ||
    !Number.isFinite(lambdaA) ||
    lambdaH <= 0.01 ||
    lambdaA <= 0.01 ||
    lambdaH > 6.0 ||
    lambdaA > 6.0 ||
    desvioOver > 0.02
  ) {
    throw new Error('Calibração fora dos limites sanitários ou com desvio excessivo')
  }

  return { lambdaH, lambdaA }
}

/**
 * Busca a odd mais recente da Bet365 para um confronto.
 * Garante que os 5 mercados completos sejam extraídos do mesmo snapshot temporal (mesmo timestamp).
 * Aplica um filtro de TTL (padrão 48h) para ignorar odds expiradas.
 */
export async function buscarOddsMaisRecentes(
  matchId: string
): Promise<{ casa: number; empate: number; fora: number; over25: number; under25: number; capturadoEm: Date } | null> {
  const bookmaker = await prisma.bookmaker.findFirst({
    where: {
      OR: [
        { slug: 'bet365' },
        { name: 'Bet365' }
      ]
    }
  })
  if (!bookmaker) return null

  const TTL_HOURS = process.env.ODDS_TTL_HOURS ? parseInt(process.env.ODDS_TTL_HOURS, 10) : 48
  const limite = new Date(Date.now() - TTL_HOURS * 60 * 60 * 1000)

  const oddsMovements = await prisma.oddsMovement.findMany({
    where: {
      matchId,
      bookmakerId: bookmaker.id,
      capturedAt: { gte: limite }
    },
    include: {
      market: true
    },
    orderBy: {
      capturedAt: 'desc'
    }
  })

  const tentarExtrairCinco = (oddsList: any[]) => {
    const res = {
      home: null as number | null,
      draw: null as number | null,
      away: null as number | null,
      over25: null as number | null,
      under25: null as number | null,
    }

    for (const o of oddsList) {
      const marketKey = o.market.key.toLowerCase()
      const selection = o.selection.toLowerCase()
      const line = o.line
      const val = o.odds

      if (marketKey === '1x2' || marketKey === 'match_odds') {
        if (selection === 'home' && !res.home) res.home = val
        if (selection === 'draw' && !res.draw) res.draw = val
        if (selection === 'away' && !res.away) res.away = val
      } else if (marketKey === 'over_under' || marketKey === 'total_goals' || marketKey === 'total_goals_2_5') {
        if (line === 2.5) {
          if (selection === 'over' && !res.over25) res.over25 = val
          if (selection === 'under' && !res.under25) res.under25 = val
        }
      }
    }

    if (res.home && res.draw && res.away && res.over25 && res.under25) {
      return {
        casa: res.home,
        empate: res.draw,
        fora: res.away,
        over25: res.over25,
        under25: res.under25
      }
    }
    return null
  }

  if (oddsMovements.length > 0) {
    const timestamps = Array.from(new Set(oddsMovements.map(o => o.capturedAt.getTime())))
    timestamps.sort((a, b) => b - a)

    for (const ts of timestamps) {
      const oddsNoLote = oddsMovements.filter(o => o.capturedAt.getTime() === ts)
      const resultado = tentarExtrairCinco(oddsNoLote)
      if (resultado) {
        return {
          ...resultado,
          capturadoEm: new Date(ts)
        }
      }
    }
  }

  const matchOdds = await prisma.matchOdds.findMany({
    where: {
      matchId,
      bookmakerId: bookmaker.id,
      createdAt: { gte: limite }
    },
    include: {
      market: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  if (matchOdds.length > 0) {
    const resultado = tentarExtrairCinco(matchOdds)
    if (resultado) {
      const datas = matchOdds.map(o => o.createdAt.getTime())
      const maxData = Math.max(...datas)
      return {
        ...resultado,
        capturadoEm: new Date(maxData)
      }
    }
  }

  return null
}

export type LambdaMercadoResult =
  | { disponivel: true; lambdaH: number; lambdaA: number; fonte: 'Bet365'; capturadoEm: Date }
  | { disponivel: false; motivo: string }

/**
 * Calcula o lambda de Mercado a partir das odds mais recentes da Bet365.
 * Se não houver odds, retorna estado de indisponibilidade.
 */
export async function calcularLambdaMercado(
  matchId: string
): Promise<LambdaMercadoResult> {
  if (!matchId) {
    return {
      disponivel: false,
      motivo: 'Dados de mercado não disponíveis para este lambda',
    }
  }

  try {
    const odds = await buscarOddsMaisRecentes(matchId)
    if (!odds) {
      return {
        disponivel: false,
        motivo: 'Dados de mercado não disponíveis para este lambda',
      }
    }

    const parse = oddsMercadoSchema.safeParse(odds)
    if (!parse.success) {
      return {
        disponivel: false,
        motivo: 'Dados de mercado não disponíveis para este lambda',
      }
    }

    const { lambdaH, lambdaA } = calibrarLambdas(parse.data)

    return {
      disponivel: true,
      lambdaH: Number(lambdaH.toFixed(2)),
      lambdaA: Number(lambdaA.toFixed(2)),
      fonte: 'Bet365',
      capturadoEm: odds.capturadoEm
    }
  } catch (error) {
    return {
      disponivel: false,
      motivo: 'Dados de mercado não disponíveis para este lambda',
    }
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

    case 'MERCADO':
      if (!params.lambdaMercado) {
        throw new Error('Dados de mercado não disponíveis para este lambda')
      }
      return {
        lambdaH: params.lambdaMercado.lambdaH,
        lambdaA: params.lambdaMercado.lambdaA,
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

  const mercado = params.lambdaMercado
    ? { lambdaH: params.lambdaMercado.lambdaH, lambdaA: params.lambdaMercado.lambdaA }
    : null

  return { mediaSimples, forcasRelativas, xg, mercado }
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
    mercado: params.lambdaMercado
      ? { fonte: 'Bet365', capturadoEm: params.lambdaMercado.capturadoEm || new Date() }
      : null
  }
}
