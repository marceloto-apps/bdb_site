import type { MonteCarloInputs, MonteCarloResults, DrawdownBucket, PatrimonioPoint } from './types'
import { calcularPValue, calcularVolumeValidador, calcularIntervaloConfianca } from './estatisticas'

/**
 * Executa simulação completa de Monte Carlo.
 * Função pura — sem side effects, sem setTimeout.
 */
export function executarMonteCarlo(inputs: MonteCarloInputs): MonteCarloResults {
  const {
    banca, oddsMedia, roiEsperado, numBets,
    limiteDrawdown, stakeEscolhida, simulacoesCount
  } = inputs

  // Probabilidade de vitória implícita
  const roiDecimal = roiEsperado / 100
  const p = (roiDecimal + 1) / oddsMedia
  const b = oddsMedia - 1
  const s = stakeEscolhida / 100

  // Métricas estatísticas (funções puras)
  const pValue = calcularPValue(p, numBets, oddsMedia)
  const volumeNecessario = calcularVolumeValidador(p, oddsMedia, roiDecimal)
  const { piorROI, melhorROI } = calcularIntervaloConfianca(p, oddsMedia, roiDecimal, numBets)
  const totalProfit = numBets * roiDecimal

  // Simulação Monte Carlo
  const ddBuckets = Array(10).fill(0) as number[]
  let failures = 0
  let profits = 0
  let sumMDD = 0
  let worstDD = 0
  const paths: Array<Array<{ x: number; y: number }>> = []
  const step = Math.max(1, Math.floor(numBets / 60))

  for (let simIdx = 0; simIdx < simulacoesCount; simIdx++) {
    let currentBanca = banca
    let peak = banca
    let localMDD = 0
    const currentPath: Array<{ x: number; y: number }> = []

    for (let i = 0; i <= numBets; i++) {
      // Amostrar curva para as primeiras 12 simulações
      if (simIdx < 12 && (i % step === 0 || i === numBets)) {
        currentPath.push({ x: i, y: Math.round(currentBanca) })
      }

      const win = Math.random() < p
      const betSize = currentBanca * s
      currentBanca += win ? (betSize * b) : -betSize

      if (currentBanca > peak) peak = currentBanca
      const currentDD = peak > 0
        ? ((peak - currentBanca) / peak) * 100
        : 100
      if (currentDD > localMDD) localMDD = currentDD

      // Banca zerada
      if (currentBanca <= 1) {
        localMDD = 100
        currentBanca = 0
        break
      }
    }

    const bIdx = Math.min(Math.floor(localMDD / 10), 9)
    ddBuckets[bIdx]++
    if (localMDD > limiteDrawdown) failures++
    if (currentBanca > banca) profits++
    sumMDD += localMDD
    if (localMDD > worstDD) worstDD = localMDD
    if (simIdx < 12) paths.push(currentPath)
  }

  // Montar dados do gráfico de patrimônio
  const chartData: PatrimonioPoint[] = []
  if (paths.length > 0 && paths[0].length > 0) {
    for (let i = 0; i < paths[0].length; i++) {
      const entry: PatrimonioPoint = { bet: paths[0][i].x }
      paths.forEach((path, idx) => {
        if (path[i]) entry[`s${idx}`] = path[i].y
      })
      chartData.push(entry)
    }
  }

  // Histograma de drawdown
  const histData: DrawdownBucket[] = ddBuckets.map((count, i) => ({
    range: `${i * 10}%`,
    percent: (count / simulacoesCount) * 100,
    danger: (i * 10) >= limiteDrawdown,
  }))

  return {
    pValue,
    probLucro: (profits / simulacoesCount) * 100,
    survivalRate: ((simulacoesCount - failures) / simulacoesCount) * 100,
    volumeNecessario,
    piorROI,
    melhorROI,
    totalProfit,
    avgMDD: sumMDD / simulacoesCount,
    worstDD,
    histData,
    chartData,
  }
}
