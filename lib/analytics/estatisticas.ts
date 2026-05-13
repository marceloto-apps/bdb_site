import { StatSummary, ProfitSummary, OverUnderSummary } from '@/types/estatisticas'

export function calculateAverage(values: number[]): number | null {
  if (!values || values.length === 0) return null
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
}

export function calculateStandardDeviation(values: number[]): number | null {
  if (!values || values.length === 0) return null
  const avg = calculateAverage(values)
  if (avg === null) return null
  const squareDiffs = values.map(val => Math.pow(val - avg, 2))
  const avgSquareDiff = calculateAverage(squareDiffs)
  if (avgSquareDiff === null) return null
  return Math.sqrt(avgSquareDiff)
}

export function calculateCoefficientOfVariation(average: number | null, standardDeviation: number | null): number | null {
  if (average === null || standardDeviation === null || average === 0) return null
  return (standardDeviation / Math.abs(average))
}

export function calculateStatSummary(values: Array<number | null | undefined>): StatSummary {
  const validValues = values.filter((val): val is number => val !== null && val !== undefined)
  const average = calculateAverage(validValues)
  const standardDeviation = calculateStandardDeviation(validValues)
  const coefficientOfVariation = calculateCoefficientOfVariation(average, standardDeviation)

  return {
    average,
    standardDeviation,
    coefficientOfVariation,
    sampleSize: validValues.length
  }
}

export type ProfitBetResult = {
  won: boolean
  odd: number
  valid: boolean
}

export function calculateProfitSummary(results: ProfitBetResult[]): ProfitSummary {
  const validResults = results.filter(r => r.valid && r.odd > 1)
  const bets = validResults.length

  if (bets === 0) {
    return { profit: 0, roi: 0, bets: 0, wins: 0, hitRate: 0, averageOdd: null }
  }

  let profit = 0
  let wins = 0
  let sumOdds = 0

  validResults.forEach(r => {
    sumOdds += r.odd
    if (r.won) {
      profit += (r.odd - 1)
      wins += 1
    } else {
      profit -= 1
    }
  })

  const totalStaked = bets * 1
  const roi = (profit / totalStaked) * 100
  const hitRate = (wins / bets) * 100
  const averageOdd = sumOdds / bets

  return {
    profit,
    roi,
    bets,
    wins,
    hitRate,
    averageOdd
  }
}

export function calculateOverUnderSummary(values: number[], lines: number[]): OverUnderSummary[] {
  const validValues = values.filter(val => val !== null && val !== undefined)
  const total = validValues.length

  return lines.map(line => {
    if (total === 0) {
      return { line, overCount: 0, underCount: 0, total: 0, overPercent: 0, underPercent: 0 }
    }

    let overCount = 0
    let underCount = 0

    validValues.forEach(val => {
      if (val > line) overCount++
      else if (val < line) underCount++
      // Since lines are .5, val will never equal line if val is integer.
      // Even if val is float, over/under is strictly > or <
    })

    const overPercent = (overCount / total) * 100
    const underPercent = (underCount / total) * 100

    return {
      line,
      overCount,
      underCount,
      total,
      overPercent,
      underPercent
    }
  })
}
