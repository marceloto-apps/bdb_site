/**
 * Cache de fatoriais para evitar recomputação.
 * Usado por todos os modelos estatísticos e ferramentas.
 */
const cacheFatorial: number[] = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800]

/**
 * Calcula o fatorial de n com cache progressivo.
 * @throws Error se n < 0
 */
export function fatorial(n: number): number {
  if (n < 0) throw new Error('Fatorial de número negativo não definido')
  if (n < cacheFatorial.length) return cacheFatorial[n]
  let r = cacheFatorial[cacheFatorial.length - 1]
  for (let i = cacheFatorial.length; i <= n; i++) {
    r *= i
    cacheFatorial.push(r)
  }
  return r
}

/**
 * Probabilidade de Poisson: P(X = x) dado lambda.
 * Retorna 1 se lambda <= 0 e x === 0 (caso degenerado).
 */
export function poissonPmf(lambda: number, x: number): number {
  if (lambda <= 0) return x === 0 ? 1 : 0
  return (Math.exp(-lambda) * Math.pow(lambda, x)) / fatorial(x)
}

/**
 * CDF de Poisson: P(X <= n) = soma de P(X=0) até P(X=n).
 */
export function poissonCdf(lambda: number, n: number): number {
  let soma = 0
  for (let k = 0; k <= n; k++) {
    soma += poissonPmf(lambda, k)
  }
  return soma
}
