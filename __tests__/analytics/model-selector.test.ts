import { rankearModelos } from '../../lib/analytics/model-selector'

describe('Model Selector', () => {
  const mockJogos = [
    { fthg: 1, ftag: 0 },
    { fthg: 0, ftag: 0 },
    { fthg: 2, ftag: 1 },
    { fthg: 1, ftag: 1 }
  ]
  const mockMediasLiga = { muH: 1.2, muA: 1.0, totalJogos: 4 }
  const mockParams = {
    piH: 0.05,
    piA: 0.05,
    varH: 1.5,
    varA: 1.2,
    rho: 0.1
  }

  it('deve rankear os modelos ordenados pelo AIC de forma crescente', () => {
    const rankings = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, mockParams)
    
    for (let i = 0; i < rankings.length - 1; i++) {
      expect(rankings[i].aic).toBeLessThanOrEqual(rankings[i+1].aic)
    }
  })

  it('deve retornar confianca apenas para o modelo vencedor (idx 0)', () => {
    const rankings = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, mockParams)
    
    expect(rankings[0].confianca).not.toBeNull()
    expect(rankings[1].confianca).toBeNull()
    expect(rankings[2].confianca).toBeNull()
    expect(rankings[3].confianca).toBeNull()
  })

  it('deve ajustar o k (graus de liberdade) da NB dinamicamente em caso de fallback', () => {
    const paramsFallbackTotal = { ...mockParams, varH: 1.0, varA: 1.0 }
    const rankTotal = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, paramsFallbackTotal)
    const nbTotal = rankTotal.find(r => r.modelo === 'NB')
    expect(nbTotal?.parametros).toBe(2) // Poisson puro

    const paramsFallbackParcial = { ...mockParams, varH: 2.5, varA: 1.0 }
    const rankParcial = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, paramsFallbackParcial)
    const nbParcial = rankParcial.find(r => r.modelo === 'NB')
    expect(nbParcial?.parametros).toBe(3)
  })

  it('nao deve inverter o lider quando aplicar o boost heuristico', () => {
    const jogosDesequilibrados = [
      { fthg: 4, ftag: 0 },
      { fthg: 0, ftag: 0 },
      { fthg: 0, ftag: 0 },
      { fthg: 4, ftag: 0 }
    ]
    
    const rankings = rankearModelos(jogosDesequilibrados, 2.0, 0.0, { muH: 2.0, muA: 0.0 }, mockParams)
    
    expect(rankings[0].aic).toBeLessThanOrEqual(rankings[1].aic)
  })

  it('confiança deve ser ALTA apenas quando delta AIC > 4', () => {
    const rankings = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, mockParams)
    const delta = rankings[1].aic - rankings[0].aic

    if (delta > 4) {
      expect(rankings[0].confianca).toBe('ALTA')
    } else if (delta > 2) {
      expect(rankings[0].confianca).toBe('MEDIA')
    } else {
      expect(rankings[0].confianca).toBe('BAIXA')
    }
  })
})
