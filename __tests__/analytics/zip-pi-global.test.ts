import { estimarPiLiga } from '../../lib/analytics/zero-inflated'
import { Match } from '@prisma/client'

describe('ZIP Pi Global', () => {
  it('estimarPiLiga deve retornar 0 se a frequência observada for igual ou menor que a teórica de Poisson', () => {
    // muH = 2.0 (Poisson prob zero = exp(-2.0) = 0.135)
    // Se tivermos 0 placares zerados:
    const jogos = Array(10).fill({ fthg: 1, ftag: 1 }) as Match[]
    const medias = { muH: 2.0, muA: 1.5, totalJogos: 10 }
    
    const { piH, piA } = estimarPiLiga(jogos, medias)
    expect(piH).toBe(0)
    expect(piA).toBe(0)
  })

  it('estimarPiLiga deve calcular o excesso real de zeros na liga', () => {
    // Liga com 10 jogos onde 5 times mandantes e visitantes não marcaram gols
    const jogos = [
      ...Array(5).fill({ fthg: 0, ftag: 0 }),
      ...Array(5).fill({ fthg: 1, ftag: 1 })
    ] as Match[]
    
    // N = 10
    // count(FTHG=0)/N = 5/10 = 0.5
    // count(FTAG=0)/N = 5/10 = 0.5
    // Supondo médias de 1.0 gol (Poisson prob zero = exp(-1.0) ≈ 0.367)
    // pi = freq_observada - prob_teórica = 0.5 - 0.367 = 0.132...
    
    const medias = { muH: 1.0, muA: 1.0, totalJogos: 10 }
    
    const { piH, piA } = estimarPiLiga(jogos, medias)
    expect(piH).toBeCloseTo(0.5 - Math.exp(-1.0), 3)
    expect(piA).toBeCloseTo(0.5 - Math.exp(-1.0), 3)
  })
})
