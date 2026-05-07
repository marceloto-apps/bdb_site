export interface MercadosDerivados {
  casa: number
  empate: number
  visit: number
  btts: number
  bttsNao: number
  over05: number
  over15: number
  over25: number
  over35: number
  over45: number
  goleadaCasa: number
  goleadaVis: number
}

// Cálculo de fatorial com cache para evitar recomputação
const cacheFatorial: number[] = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800]

export function fatorial(n: number): number {
  if (n < 0) throw new Error('Fatorial de negativo não definido')
  if (n < cacheFatorial.length) return cacheFatorial[n]
  let r = cacheFatorial[cacheFatorial.length - 1]
  for (let i = cacheFatorial.length; i <= n; i++) {
    r *= i
    cacheFatorial.push(r)
  }
  return r
}

export function poissonPmf(lambda: number, x: number): number {
  if (lambda <= 0) return x === 0 ? 1 : 0
  return (Math.exp(-lambda) * Math.pow(lambda, x)) / fatorial(x)
}

export function poissonCdf(lambda: number, maxK: number): number {
  let soma = 0
  for (let k = 0; k <= maxK; k++) {
    soma += poissonPmf(lambda, k)
  }
  return soma
}

export function matrizPlacaresPoisson(
  lambdaH: number,
  lambdaA: number,
  max = 10
): number[][] {
  const matriz: number[][] = []
  for (let h = 0; h <= max; h++) {
    matriz[h] = []
    for (let a = 0; a <= max; a++) {
      matriz[h][a] = poissonPmf(lambdaH, h) * poissonPmf(lambdaA, a)
    }
  }
  return matriz
}

export function calcularMercados(matriz: number[][]): MercadosDerivados {
  let casa = 0
  let empate = 0
  let visit = 0
  let btts = 0
  let over05 = 0
  let over15 = 0
  let over25 = 0
  let over35 = 0
  let over45 = 0
  let goleadaCasa = 0
  let goleadaVis = 0

  const maxH = matriz.length
  for (let h = 0; h < maxH; h++) {
    const maxA = matriz[h].length
    for (let a = 0; a < maxA; a++) {
      const p = matriz[h][a]

      if (h > a) casa += p
      if (h === a) empate += p
      if (h < a) visit += p

      if (h > 0 && a > 0) btts += p
      
      const totalGols = h + a
      if (totalGols > 0.5) over05 += p
      if (totalGols > 1.5) over15 += p
      if (totalGols > 2.5) over25 += p
      if (totalGols > 3.5) over35 += p
      if (totalGols > 4.5) over45 += p

      if (h >= 4 && (h - a) >= 3) goleadaCasa += p
      if (a >= 4 && (a - h) >= 3) goleadaVis += p
    }
  }

  return {
    casa,
    empate,
    visit,
    btts,
    bttsNao: 1 - btts,
    over05,
    over15,
    over25,
    over35,
    over45,
    goleadaCasa,
    goleadaVis,
  }
}
