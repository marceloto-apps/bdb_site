import { matrizPlacaresPoisson } from './poisson'
import { matrizPlacaresZIP } from './zero-inflated'
import { matrizPlacaresNB } from './negative-binomial'
import { matrizPlacaresDixonColes } from './dixon-coles'
import {
  VeredictoDispersao,
  calcularExcessoZeros,
  avaliarDixonColes,
  classificarDispersao,
  serieMarginalAgregada,
  mediaVariancia,
} from './dispersao-condicional'

export type ModeloEstatistico = 'POISSON' | 'ZIP' | 'NB' | 'DIXON_COLES'

export interface ModeloRanking {
  modelo: ModeloEstatistico
  aic: number
  logLikelihood: number
  parametros: number // k
  confianca: 'ALTA' | 'MEDIA' | 'BAIXA' | null
}

export interface ResultadoRankingModelos {
  ranking: ModeloRanking[]
  sinais: {
    zip: 'FORTE' | 'LEVE' | 'AUSENTE' | 'INDETERMINADO'
    dc: 'INDICADO' | 'AUSENTE' | 'INDETERMINADO'
    detalhesDispersao?: {
      indice: number
      faixaInf: number
      faixaSup: number
    }
  }
}

/**
 * Calcula log-likelihood de um modelo contra os jogos observados.
 * Para cada jogo, calcula P(placar observado) usando a matriz do modelo
 * e soma o log dessas probabilidades.
 * 
 * Se placar for maior que 10, clampar em 10 (limite da matriz).
 * Usa Math.max(prob, 1e-10) para evitar log(0) e recompensar probabilidades maiores.
 */
function calcularLogLikelihood(
  jogos: Array<{ fthg: number; ftag: number }>,
  matriz: number[][]
): number {
  let ll = 0
  for (const jogo of jogos) {
    const h = Math.min(jogo.fthg, 10)
    const a = Math.min(jogo.ftag, 10)
    const prob = matriz[h][a]
    ll += Math.log(Math.max(prob, 1e-10))
  }
  return ll
}

/**
 * Rankeia os 4 modelos por AIC e retorna objeto com ranking e sinais de triagem.
 * 
 * NOTA ARQUITETURAL SOBRE LAMBDAS NO RANKING:
 * É intencional usar lambdas calculados COM DECAY temporal nesta função. 
 * Como o objetivo do `AUTO` é encontrar o modelo que melhor descreve o momento atual 
 * das equipes (bias de recência), avaliar as matrizes usando lambdas estáticos (sem decay)
 * prejudicaria a avaliação comparativa dos modelos avançados. Avaliamos a performance 
 * baseados nas forças já decaídas.
 * 
 * Confiança:
 * - ALTA: delta AIC entre 1° e 2° > 4
 * - MEDIA: delta entre 2 e 4
 * - BAIXA: delta < 2 (modelos muito próximos)
 */
export function rankearModelos(
  jogos: Array<{ fthg: number; ftag: number }>,
  lambdaH: number,
  lambdaA: number,
  mediasLiga: { muH: number; muA: number },
  parametrosExtras: {
    piH: number
    piA: number
    varH: number
    varA: number
    rho: number
  },
  vereditoGolsCondicional?: VeredictoDispersao
): ResultadoRankingModelos {
  // 1. Gerar matrizes e extrair fallbacks
  const matrizPoisson = matrizPlacaresPoisson(lambdaH, lambdaA)
  const matrizZIP = matrizPlacaresZIP(lambdaH, lambdaA, parametrosExtras.piH, parametrosExtras.piA)
  
  const resNB = matrizPlacaresNB(lambdaH, lambdaA, parametrosExtras.varH, parametrosExtras.varA)
  const matrizNB = resNB.matriz
  
  // Ajuste do k (graus de liberdade) se houve fallback na BN
  let kNB = 4
  if (resNB.warning === 'FALLBACK_TOTAL') kNB = 2
  else if (resNB.warning === 'FALLBACK_PARCIAL_HOME' || resNB.warning === 'FALLBACK_PARCIAL_AWAY') kNB = 3

  const resDC = matrizPlacaresDixonColes(lambdaH, lambdaA, parametrosExtras.rho)
  const matrizDixonColes = resDC.matriz
  const kDC = resDC.rhoClamped && resDC.rhoUsado === 0 ? 2 : 3 // se clampado a 0, rho não impacta, reduz penalidade

  // 2. Calcular logLikelihood
  const llPoisson = calcularLogLikelihood(jogos, matrizPoisson)
  const llZIP = calcularLogLikelihood(jogos, matrizZIP)
  const llNB = calcularLogLikelihood(jogos, matrizNB)
  const llDixonColes = calcularLogLikelihood(jogos, matrizDixonColes)

  // 3. Calcular AIC (-2 * logLikelihood + 2 * k)
  const aicPoisson = -2 * llPoisson + 2 * 2
  const aicZIP = -2 * llZIP + 2 * 4
  const aicNB = -2 * llNB + 2 * kNB
  const aicDixonColes = -2 * llDixonColes + 2 * kDC

  const rankings: ModeloRanking[] = [
    { modelo: 'POISSON', aic: aicPoisson, logLikelihood: llPoisson, parametros: 2, confianca: null },
    { modelo: 'ZIP', aic: aicZIP, logLikelihood: llZIP, parametros: 4, confianca: null },
    { modelo: 'NB', aic: aicNB, logLikelihood: llNB, parametros: kNB, confianca: null },
    { modelo: 'DIXON_COLES', aic: aicDixonColes, logLikelihood: llDixonColes, parametros: kDC, confianca: null },
  ]

  // 4. Regimes de Amostra e Sinais de Triagem
  const nJogos = jogos.length
  const regime: 'FALLBACK' | 'AIC_PURO' | 'COMPLETO' =
    nJogos < 10 ? 'FALLBACK' : nJogos < 180 ? 'AIC_PURO' : 'COMPLETO'

  let zipSinal: 'FORTE' | 'LEVE' | 'AUSENTE' | 'INDETERMINADO' = 'INDETERMINADO'
  let dcSinal: 'INDICADO' | 'AUSENTE' | 'INDETERMINADO' = 'INDETERMINADO'

  if (regime === 'COMPLETO') {
    const { rZero } = calcularExcessoZeros(jogos)
    zipSinal = rZero > 1.25 ? 'FORTE' : rZero > 1.10 ? 'LEVE' : 'AUSENTE'

    const { dcIndicado } = avaliarDixonColes(
      jogos,
      parametrosExtras.rho,
      mediasLiga.muH,
      mediasLiga.muA
    )
    dcSinal = dcIndicado ? 'INDICADO' : 'AUSENTE'
  }

  // Calcular veredito de dispersão usando a nova banda dinâmica ancorada em N
  const serie = serieMarginalAgregada(jogos)
  const { media: mediaMarginal, variancia: varianciaMarginal, n: nObs } = mediaVariancia(serie)

  const resBanda = classificarDispersao(varianciaMarginal, mediaMarginal, nObs)
  const vereditoBanda = resBanda.regime === 'NORMAL' ? 'NEUTRO' : resBanda.regime
  const vereditoGols = vereditoGolsCondicional
    ? (vereditoGolsCondicional as string === 'POISSON' || vereditoGolsCondicional as string === 'NEUTRO' ? 'NEUTRO' : vereditoGolsCondicional)
    : vereditoBanda

  // 5. Definir ordem de prioridade para desempate (ΔAIC < 2)
  let ORDEM_PRIORIDADE: Record<ModeloEstatistico, number>

  if (regime === 'COMPLETO') {
    if (vereditoGols === 'OVER') {
      if (zipSinal === 'FORTE') {
        ORDEM_PRIORIDADE = { ZIP: 0, NB: 1, DIXON_COLES: 2, POISSON: 3 }
      } else {
        ORDEM_PRIORIDADE = { NB: 0, ZIP: 1, DIXON_COLES: 2, POISSON: 3 }
      }
    } else {
      if (dcSinal === 'INDICADO') {
        ORDEM_PRIORIDADE = { DIXON_COLES: 0, POISSON: 1, ZIP: 2, NB: 3 }
      } else {
        ORDEM_PRIORIDADE = { POISSON: 0, DIXON_COLES: 1, ZIP: 2, NB: 3 }
      }
    }
  } else {
    // Para AIC_PURO e FALLBACK (triagem desativada), a ordem de desempate padrão favorece a parcimônia (POISSON com k=2)
    ORDEM_PRIORIDADE = { POISSON: 0, DIXON_COLES: 1, ZIP: 2, NB: 3 }
  }

  // Primeiro, ordena por AIC puro para encontrar o líder absoluto (menor AIC)
  rankings.sort((a, b) => a.aic - b.aic)
  const minAic = rankings[0].aic

  // Ordena com base no empate (delta < 2 do líder absoluto) usando a ORDEM_PRIORIDADE
  rankings.sort((a, b) => {
    const aEmpatado = (a.aic - minAic) < 2
    const bEmpatado = (b.aic - minAic) < 2

    if (aEmpatado && bEmpatado) {
      return ORDEM_PRIORIDADE[a.modelo] - ORDEM_PRIORIDADE[b.modelo]
    }
    if (aEmpatado) return -1
    if (bEmpatado) return 1

    return a.aic - b.aic
  })

  // 6. Calcular confiança (Delta AIC entre 1º e 2º colocado)
  const delta = Math.abs(rankings[0].aic - rankings[1].aic)
  let confianca: 'ALTA' | 'MEDIA' | 'BAIXA' = 'BAIXA'
  if (delta > 4) confianca = 'ALTA'
  else if (delta > 2) confianca = 'MEDIA'

  // Confiança só é aplicada ao modelo vencedor (índice 0)
  const rankingFinal = rankings.map((r, idx) => ({ ...r, confianca: idx === 0 ? confianca : null }))

  const se = nObs > 1 ? Math.sqrt(2 / (nObs - 1)) : 0
  const inf = Math.max(0, 1 - 2 * se)
  const sup = 1 + 2 * se
  const D = mediaMarginal > 0 ? varianciaMarginal / mediaMarginal : 0

  return {
    ranking: rankingFinal,
    sinais: {
      zip: zipSinal,
      dc: dcSinal,
      detalhesDispersao: regime === 'COMPLETO' ? {
        indice: D,
        faixaInf: inf,
        faixaSup: sup,
      } : undefined,
    }
  }
}
