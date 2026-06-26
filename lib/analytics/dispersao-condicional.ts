// lib/analytics/dispersao-condicional.ts
import { fatorial } from './poisson'

/**
 * ════════════════════════════════════════════════════════════════════
 *  DIAGNÓSTICO DE DISPERSÃO CONDICIONAL — nível liga
 *
 *  O índice AGREGADO (Var/Média da liga inteira) mistura dois efeitos:
 *    1. a dispersão real do processo de gols
 *    2. a heterogeneidade entre confrontos (jogos ofensivos vs defensivos
 *       têm médias diferentes — isso infla a variância agregada)
 *
 *  O índice CONDICIONAL mede a dispersão DEPOIS de descontar o λ esperado
 *  de cada jogo, via resíduos de Pearson. É o que decide a distribuição.
 *
 *  Reusa os lambdas já estimados pelo motor de forças (calcularLambdas).
 *  NÃO re-otimiza parâmetros por MLE — leve o suficiente para rodar na API.
 * ════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// Vereditos e tipos públicos
// ─────────────────────────────────────────────────────────────────────

export type RegimeDispersaoEstrita = 'OVER' | 'UNDER' | 'NORMAL'
export type VeredictoDispersao = 'OVER' | 'UNDER' | 'NEUTRO'
export type DistribuicaoSugerida = 'POISSON' | 'NB' | 'COM_POISSON'

export interface Jogo {
  fthg: number
  ftag: number
}

export interface ResultadoClassificacaoDispersao {
  d: number
  regime: RegimeDispersaoEstrita
  banda: { inferior: number; superior: number }
}

export interface BlocoAgregado {
  indice: number // Var/Média da liga
  media: number
  variancia: number
  faixaInf: number // limite inferior da faixa Poisson
  faixaSup: number // limite superior da faixa Poisson
  veredito: VeredictoDispersao
}

export interface BlocoCondicional {
  indice: number // Σ resíduos² / (n - p)
  faixaInf: number
  faixaSup: number
  veredito: VeredictoDispersao
  distribuicaoSugerida: DistribuicaoSugerida
}

export interface ResultadoDispersaoMetrica {
  metrica: 'GOLS' | 'XG'
  amostra: number // nº de observações (jogos × 2 lados, ou jogos)
  nParametros: number // graus de liberdade consumidos pelo modelo
  agregado: BlocoAgregado
  condicional: BlocoCondicional
  inflacaoPercentual: number // (agregado/condicional - 1) × 100
  metodoFaixa: 'QUI_QUADRADO' | 'ERRO_PADRAO'
  alertaAmostra: string | null // warning quando amostra pequena
}

export interface ResultadoDispersaoLiga {
  gols: ResultadoDispersaoMetrica
  xg: ResultadoDispersaoMetrica | null // null se liga sem cobertura de xG
  sugestaoFinal: {
    distribuicao: DistribuicaoSugerida
    confianca: 'ALTA' | 'MEDIA' | 'BAIXA'
    explicacao: string
  }
}

// ─────────────────────────────────────────────────────────────────────
// Inversa e funções auxiliares qui-quadrado (mantidas para compatibilidade)
// ─────────────────────────────────────────────────────────────────────

function logGamma(z: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ]
  const x = z
  let y = z
  let tmp = x + 5.5
  tmp -= (x + 0.5) * Math.log(tmp)
  let ser = 1.000000000190015
  for (let j = 0; j < 6; j++) {
    y += 1
    ser += c[j] / y
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x)
}

function gammaIncompletaP(a: number, x: number): number {
  if (x <= 0) return 0
  if (x < a + 1) {
    let ap = a
    let sum = 1 / a
    let del = sum
    for (let n = 0; n < 200; n++) {
      ap += 1
      del *= x / ap
      sum += del
      if (Math.abs(del) < Math.abs(sum) * 1e-12) break
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a))
  } else {
    let b = x + 1 - a
    let c = 1e30
    let d = 1 / b
    let h = d
    for (let i = 1; i <= 200; i++) {
      const an = -i * (i - a)
      b += 2
      d = an * d + b
      if (Math.abs(d) < 1e-30) d = 1e-30
      c = b + an / c
      if (Math.abs(c) < 1e-30) c = 1e-30
      d = 1 / d
      const del = d * c
      h *= del
      if (Math.abs(del - 1) < 1e-12) break
    }
    const q = Math.exp(-x + a * Math.log(x) - logGamma(a)) * h
    return 1 - q
  }
}

// ─────────────────────────────────────────────────────────────────────
// Classificação com Banda Dinâmica baseada em Amostra (Ancorada em N)
// ─────────────────────────────────────────────────────────────────────

/**
 * Classifica o regime de dispersão dos gols com banda ancorada em N.
 *
 * Base teórica: sob Poisson puro, o índice de dispersão D = s²/x̄ tem
 * valor esperado 1, e (N-1)·D ~ χ²(N-1). A banda de normalidade usa
 * SE(D) ≈ sqrt(2/(N-1)) com margem de ±2·SE (~95%, conservador para
 * minimizar falso "OVER"). A banda encolhe conforme N cresce, o que é
 * estatisticamente honesto: amostras pequenas não classificam regime extremo.
 *
 * @param variancia Variância amostral dos gols marginais agregados
 * @param media Média dos gols marginais agregados
 * @param nObs Número de observações marginais (= 2 × número de jogos)
 */
export function classificarDispersao(
  variancia: number,
  media: number,
  nObs: number,
): ResultadoClassificacaoDispersao {
  // Índice de dispersão; protege divisão por zero (média nula → assume Poisson neutro)
  const d = media > 0 ? variancia / media : 1

  // Margem de ±2·SE, com SE(D) ≈ sqrt(2 / (N-1)) sob hipótese Poisson
  const margem = 2 * Math.sqrt(2 / Math.max(nObs - 1, 1))
  const inferior = 1 - margem
  const superior = 1 + margem

  let regime: RegimeDispersaoEstrita = 'NORMAL'
  if (d < inferior) regime = 'UNDER'
  else if (d > superior) regime = 'OVER'

  return { d, regime, banda: { inferior, superior } }
}

export function classificarDispersaoResiduos(
  indiceCond: number,
  gl: number
): ResultadoClassificacaoDispersao {
  if (gl <= 1) {
    return {
      d: 1,
      regime: 'NORMAL',
      banda: { inferior: 1, superior: 1 }
    }
  }
  const se = Math.sqrt(2 / gl)
  const inferior = 1 - 2 * se
  const superior = 1 + 2 * se

  let regime: RegimeDispersaoEstrita = 'NORMAL'
  if (indiceCond < inferior) regime = 'UNDER'
  else if (indiceCond > superior) regime = 'OVER'

  return { d: indiceCond, regime, banda: { inferior, superior } }
}

/**
 * Monta a série marginal AGREGADA: cada jogo contribui com 2 observações
 * (gols do mandante e gols do visitante na mesma série), conforme decisão
 * de classificar dispersão sobre o total marginal da liga.
 */
export function serieMarginalAgregada(jogos: Jogo[]): number[] {
  const serie: number[] = []
  for (const jogo of jogos) {
    serie.push(jogo.fthg)
    serie.push(jogo.ftag)
  }
  return serie
}

/** Média e variância amostral (n-1) de uma série numérica. */
export function mediaVariancia(serie: number[]): { media: number; variancia: number; n: number } {
  const n = serie.length
  if (n < 2) return { media: serie[0] ?? 0, variancia: 0, n }
  const media = serie.reduce((acc, v) => acc + v, 0) / n
  // Variância amostral com correção de Bessel (n-1)
  const variancia = serie.reduce((acc, v) => acc + (v - media) ** 2, 0) / (n - 1)
  return { media, variancia, n }
}

function mapearDistribuicao(v: VeredictoDispersao): DistribuicaoSugerida {
  if (v === 'OVER') return 'NB'
  if (v === 'UNDER') return 'COM_POISSON'
  return 'POISSON'
}

// ─────────────────────────────────────────────────────────────────────
// Cálculo de uma métrica (gols ou xG)
// ─────────────────────────────────────────────────────────────────────

export function calcularDispersaoMetrica(
  observados: number[],
  lambdasEsperados: number[],
  nParametros: number,
  metrica: 'GOLS' | 'XG',
): ResultadoDispersaoMetrica {
  const n = observados.length
  if (n !== lambdasEsperados.length) {
    throw new Error('observados e lambdasEsperados devem ter o mesmo tamanho')
  }
  if (n < 2) {
    throw new Error('Amostra insuficiente para diagnóstico de dispersão')
  }

  // ── AGREGADO ──
  const { media, variancia } = mediaVariancia(observados)

  const resAgg = classificarDispersao(variancia, media, n)
  const veredAgg: VeredictoDispersao = resAgg.regime === 'NORMAL' ? 'NEUTRO' : resAgg.regime
  const infAgg = Math.max(0, resAgg.banda.inferior)
  const supAgg = resAgg.banda.superior

  // ── CONDICIONAL (resíduos de Pearson) ──
  let somaResiduosQuad = 0
  for (let i = 0; i < n; i++) {
    const lam = Math.max(lambdasEsperados[i], 0.1) // piso evita divisão por zero
    const r = (observados[i] - lam) / Math.sqrt(lam)
    somaResiduosQuad += r * r
  }
  const glCond = Math.max(n - nParametros, 1)
  const indiceCond = somaResiduosQuad / glCond

  const resCond = classificarDispersaoResiduos(indiceCond, glCond)
  const veredCond: VeredictoDispersao = resCond.regime === 'NORMAL' ? 'NEUTRO' : resCond.regime
  const infCond = Math.max(0, resCond.banda.inferior)
  const supCond = resCond.banda.superior

  const metodoFaixa: 'QUI_QUADRADO' | 'ERRO_PADRAO' = 'QUI_QUADRADO'

  const inflacao =
    indiceCond > 0 ? (resAgg.d / indiceCond - 1) * 100 : 0

  let alertaAmostra: string | null = null
  if (n < 50) {
    alertaAmostra =
      'Amostra pequena — diagnóstico via faixa qui-quadrado (erro padrão assintótico não confiável).'
  }

  return {
    metrica,
    amostra: n,
    nParametros,
    agregado: {
      indice: resAgg.d,
      media,
      variancia,
      faixaInf: infAgg,
      faixaSup: supAgg,
      veredito: veredAgg,
    },
    condicional: {
      indice: indiceCond,
      faixaInf: infCond,
      faixaSup: supCond,
      veredito: veredCond,
      distribuicaoSugerida: mapearDistribuicao(veredCond),
    },
    inflacaoPercentual: inflacao,
    metodoFaixa,
    alertaAmostra,
  }
}

// ─────────────────────────────────────────────────────────────────────
// Consolidação a nível liga (gols + xG)
// ─────────────────────────────────────────────────────────────────────

function gerarSugestaoFinal(
  gols: ResultadoDispersaoMetrica,
  xg: ResultadoDispersaoMetrica | null,
): ResultadoDispersaoLiga['sugestaoFinal'] {
  const vc = gols.condicional.veredito
  const dist = gols.condicional.distribuicaoSugerida

  // Confiança: distância do índice condicional em relação à banda.
  const idx = gols.condicional.indice
  const sup = gols.condicional.faixaSup
  const inf = gols.condicional.faixaInf
  const distancia =
    vc === 'NEUTRO'
      ? Math.min(Math.abs(idx - sup), Math.abs(idx - inf))
      : vc === 'OVER'
        ? idx - sup
        : inf - idx
  const confianca: 'ALTA' | 'MEDIA' | 'BAIXA' =
    distancia > 0.15 ? 'ALTA' : distancia > 0.05 ? 'MEDIA' : 'BAIXA'

  let explicacao: string
  if (vc === 'NEUTRO' && gols.agregado.veredito !== 'NEUTRO') {
    explicacao =
      `O índice agregado indicou "${gols.agregado.veredito === 'OVER' ? 'overdispersion' : 'underdispersion'}", ` +
      `mas isso é heterogeneidade entre confrontos. Condicionado ao λ de cada jogo, ` +
      `a Poisson é adequada. Usar outra distribuição corrigiria um problema inexistente.`
  } else if (vc === 'OVER') {
    explicacao =
      'Overdispersion real confirmada pelo índice condicional. Binomial Negativa justifica-se.'
  } else if (vc === 'UNDER') {
    explicacao =
      'Underdispersion real confirmada pelo índice condicional. COM-Poisson é a alternativa adequada.'
  } else {
    explicacao = 'Agregado e condicional concordam: Poisson é adequada.'
  }

  if (xg && xg.condicional.veredito !== vc) {
    explicacao += ` (Observação: o xG aponta "${xg.condicional.veredito}" condicional — métrica suavizada tende a underdispersion.)`
  }

  return { distribuicao: dist, confianca, explicacao }
}

export function consolidarDispersaoLiga(
  gols: ResultadoDispersaoMetrica,
  xg: ResultadoDispersaoMetrica | null,
): ResultadoDispersaoLiga {
  return {
    gols,
    xg,
    sugestaoFinal: gerarSugestaoFinal(gols, xg),
  }
}

// Conta zeros MARGINAIS (gols=0 de cada time, independente do outro lado).
// Correto para diagnóstico de ZIP, que modela inflação de zero na marginal.
export function calcularExcessoZeros(
  jogos: { fthg: number; ftag: number }[],
): { rZero: number; pObs: number; pPoisson: number; nObs: number } {
  const nObs = jogos.length * 2 // cada jogo = 2 observações marginais

  // Zeros marginais: soma de mandantes-zerados + visitantes-zerados
  const nZeros =
    jogos.filter((j) => j.fthg === 0).length +
    jogos.filter((j) => j.ftag === 0).length

  // μ marginal da liga (gols médios por time por jogo)
  const totalGols = jogos.reduce((s, j) => s + j.fthg + j.ftag, 0)
  const mu = totalGols / nObs

  const pObs = nZeros / nObs
  const pPoisson = Math.exp(-mu) // P(Poisson=0) = e^{-μ}
  const rZero = pPoisson > 0 ? pObs / pPoisson : 1

  return { rZero, pObs, pPoisson, nObs }
}

// Gatilho DC: combina distorção nas 4 células baixas com ρ relevante.
// ρ sozinho não basta; D_baixos confirma que a distorção é nas células certas.
export function avaliarDixonColes(
  jogos: { fthg: number; ftag: number }[],
  rho: number,
  muMandante: number,
  muVisitante: number,
): { dBaixos: number; dcIndicado: boolean } {
  const n = jogos.length

  // Frequência observada das 4 células baixas
  const obs = (i: number, j: number) =>
    jogos.filter((g) => g.fthg === i && g.ftag === j).length / n

  // Poisson esperado: P(i)·P(j) com λ de cada lado
  const pois = (lam: number, k: number) =>
    (Math.exp(-lam) * lam ** k) / fatorial(k)
  const esp = (i: number, j: number) =>
    pois(muMandante, i) * pois(muVisitante, j)

  let dBaixos = 0
  for (const i of [0, 1])
    for (const j of [0, 1]) dBaixos += Math.abs(obs(i, j) - esp(i, j))

  // ρ relevante: |ρ| acima do piso de ruído (≈ 0.03–0.05 empírico p/ futebol)
  const rhoRelevante = Math.abs(rho) >= 0.05
  const dcIndicado = rhoRelevante && dBaixos > 0.04 // ~4pp de desvio somado

  return { dBaixos, dcIndicado }
}
