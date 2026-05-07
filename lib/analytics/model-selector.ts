import { matrizPlacaresPoisson } from './poisson'
import { matrizPlacaresZIP } from './zero-inflated'
import { matrizPlacaresNB } from './negative-binomial'
import { matrizPlacaresDixonColes } from './dixon-coles'

export type ModeloEstatistico = 'POISSON' | 'ZIP' | 'NB' | 'DIXON_COLES'

export interface ModeloRanking {
  modelo: ModeloEstatistico
  aic: number
  logLikelihood: number
  parametros: number // k
  confianca: 'ALTA' | 'MEDIA' | 'BAIXA' | null
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
 * Rankeia os 4 modelos por AIC e retorna array ordenado (menor AIC = melhor).
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
  }
): ModeloRanking[] {
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
  let kDC = resDC.rhoClamped && resDC.rhoUsado === 0 ? 2 : 3 // se clampado a 0, rho não impacta, reduz penalidade

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

  const rankings: Omit<ModeloRanking, 'confianca'>[] = [
    { modelo: 'POISSON', aic: aicPoisson, logLikelihood: llPoisson, parametros: 2 },
    { modelo: 'ZIP', aic: aicZIP, logLikelihood: llZIP, parametros: 4 },
    { modelo: 'NB', aic: aicNB, logLikelihood: llNB, parametros: kNB },
    { modelo: 'DIXON_COLES', aic: aicDixonColes, logLikelihood: llDixonColes, parametros: kDC },
  ]

  // 4. Heurísticas adicionais (SPECS 2C.1)
  // Var/Média > 1.15 E freq 0-0 > 8% → boost Dixon-Coles
  // Var/Média > 1.15 E freq 0-0 ≤ 8% → boost NB
  const totalJogos = jogos.length || 1
  let freq00 = 0
  let somaH = 0
  let somaA = 0
  for (const j of jogos) {
    if (j.fthg === 0 && j.ftag === 0) freq00++
    somaH += j.fthg
    somaA += j.ftag
  }
  const pct00 = freq00 / totalJogos
  const mediaH = somaH / totalJogos
  const mediaA = somaA / totalJogos

  let varEmpiricaH = 0
  let varEmpiricaA = 0
  for (const j of jogos) {
    varEmpiricaH += Math.pow(j.fthg - mediaH, 2)
    varEmpiricaA += Math.pow(j.ftag - mediaA, 2)
  }
  varEmpiricaH /= totalJogos
  varEmpiricaA /= totalJogos

  const razaoVarMediaH = mediaH > 0 ? varEmpiricaH / mediaH : 1
  const razaoVarMediaA = mediaA > 0 ? varEmpiricaA / mediaA : 1
  const varMediaAlta = razaoVarMediaH > 1.15 || razaoVarMediaA > 1.15

  if (varMediaAlta) {
    // Ordenar preliminarmente para encontrar o líder
    rankings.sort((a, b) => a.aic - b.aic)
    const bestAic = rankings[0].aic

    if (pct00 > 0.08) {
      // Boost Dixon-Coles (reduz AIC)
      const target = rankings.find(r => r.modelo === 'DIXON_COLES')
      if (target && target !== rankings[0]) {
        // Limita o boost para que o target não ultrapasse o líder por mais de 1 ponto de AIC
        const maxBoost = Math.max(0, target.aic - bestAic + 1)
        target.aic -= Math.min(3, maxBoost)
      }
    } else {
      // Boost NB
      const target = rankings.find(r => r.modelo === 'NB')
      if (target && target !== rankings[0]) {
        const maxBoost = Math.max(0, target.aic - bestAic + 1)
        target.aic -= Math.min(3, maxBoost)
      }
    }
  }

  // 5. Ordenar definitivamente por AIC crescente
  rankings.sort((a, b) => a.aic - b.aic)

  // 6. Calcular confiança (Delta AIC entre 1º e 2º colocado)
  const delta = Math.abs(rankings[0].aic - rankings[1].aic)
  let confianca: 'ALTA' | 'MEDIA' | 'BAIXA' = 'BAIXA'
  if (delta > 4) confianca = 'ALTA'
  else if (delta > 2) confianca = 'MEDIA'

  // Confiança só é aplicada ao modelo vencedor (índice 0)
  return rankings.map((r, idx) => ({ ...r, confianca: idx === 0 ? confianca : null }))
}
