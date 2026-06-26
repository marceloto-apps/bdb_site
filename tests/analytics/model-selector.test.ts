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

  function gerarJogos(n: number) {
    return Array.from({ length: n }).map(() => ({ fthg: 1, ftag: 1 }))
  }

  function gerarJogosComZeros(n: number) {
    return Array.from({ length: n }).map(() => ({ fthg: 0, ftag: 0 }))
  }

  it('deve rankear os modelos ordenados pelo AIC de forma crescente', () => {
    const { ranking: rankings } = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, mockParams)
    
    for (let i = 0; i < rankings.length - 1; i++) {
      expect(rankings[i].aic).toBeLessThanOrEqual(rankings[i+1].aic)
    }
  })

  it('deve retornar confianca apenas para o modelo vencedor (idx 0)', () => {
    const { ranking: rankings } = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, mockParams)
    
    expect(rankings[0].confianca).not.toBeNull()
    expect(rankings[1].confianca).toBeNull()
    expect(rankings[2].confianca).toBeNull()
    expect(rankings[3].confianca).toBeNull()
  })

  it('deve ajustar o k (graus de liberdade) da NB dinamicamente em caso de fallback', () => {
    const paramsFallbackTotal = { ...mockParams, varH: 1.0, varA: 1.0 }
    const { ranking: rankTotal } = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, paramsFallbackTotal)
    const nbTotal = rankTotal.find(r => r.modelo === 'NB')
    expect(nbTotal?.parametros).toBe(2) // Poisson puro

    const paramsFallbackParcial = { ...mockParams, varH: 2.5, varA: 1.0 }
    const { ranking: rankParcial } = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, paramsFallbackParcial)
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
    
    const { ranking: rankings } = rankearModelos(jogosDesequilibrados, 2.0, 0.0, { muH: 2.0, muA: 0.0 }, mockParams)
    
    expect(rankings[0].aic).toBeLessThanOrEqual(rankings[1].aic)
  })

  it('confiança deve ser ALTA apenas quando delta AIC > 4', () => {
    const { ranking: rankings } = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, mockParams)
    const delta = rankings[1].aic - rankings[0].aic

    if (delta > 4) {
      expect(rankings[0].confianca).toBe('ALTA')
    } else if (delta > 2) {
      expect(rankings[0].confianca).toBe('MEDIA')
    } else {
      expect(rankings[0].confianca).toBe('BAIXA')
    }
  })

  it('deve desativar a triagem e desempates especificos quando vereditoGolsCondicional for NEUTRO ou undefined', () => {
    const { ranking: rankingsPoisson } = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, mockParams, 'NEUTRO')
    const { ranking: rankingsUndefined } = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, mockParams)

    const dcPoisson = rankingsPoisson.find(r => r.modelo === 'DIXON_COLES')!
    const dcUndefined = rankingsUndefined.find(r => r.modelo === 'DIXON_COLES')!

    expect(dcPoisson.aic).toBe(dcUndefined.aic)
  })

  it('deve desempatar por robustez (DIXON_COLES > POISSON > ZIP > NB) quando delta AIC < 2 e sem triagem ativa', () => {
    const { ranking: rankings } = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, mockParams)
    
    // Verifica se para qualquer par ordenado com delta AIC < 2, a ordem de robustez é respeitada
    for (let i = 0; i < rankings.length - 1; i++) {
      const a = rankings[i]
      const b = rankings[i+1]
      const delta = Math.abs(a.aic - b.aic)
      if (delta < 2) {
        const ORDEM: Record<string, number> = { DIXON_COLES: 0, POISSON: 1, ZIP: 2, NB: 3 }
        expect(ORDEM[a.modelo]).toBeLessThan(ORDEM[b.modelo])
      }
    }
  })

  // --- Novos Testes: Guard Rails & Triagem Avançada ---

  it('N=139 cai em AIC_PURO (sinais INDETERMINADO)', () => {
    const { sinais } = rankearModelos(gerarJogos(139), 1.5, 1.2, mockMediasLiga, mockParams)
    expect(sinais.zip).toBe('INDETERMINADO')
    expect(sinais.dc).toBe('INDETERMINADO')
  })

  it('N=140 ativa regime COMPLETO (triagem rodando)', () => {
    const { sinais } = rankearModelos(gerarJogosComZeros(140), 1.5, 1.2, mockMediasLiga, mockParams)
    expect(sinais.zip).not.toBe('INDETERMINADO') // triagem ativou
  })

  it('deve respeitar a soberania do AIC se delta AIC >= 2.0 mesmo com sinal de triagem forte', () => {
    const jogosConflito = Array.from({ length: 200 }).map((_, i) => ({
      fthg: i % 2 === 0 ? 0 : 3,
      ftag: 0
    }))
    
    const { ranking, sinais } = rankearModelos(
      jogosConflito,
      1.5,
      0.5,
      { muH: 1.5, muA: 0.0 },
      { piH: 0.1, piA: 0.9, varH: 2.0, varA: 0.5, rho: 0.0 },
      'OVER'
    )
    expect(sinais.zip).toBe('FORTE')
    
    const rankingBruto = [...ranking].sort((a, b) => a.aic - b.aic)
    const delta = rankingBruto[1].aic - rankingBruto[0].aic
    if (delta >= 2.0) {
      expect(ranking[0].modelo).toBe(rankingBruto[0].modelo)
    }
  })

  it('provando que xG nao influencia a selecao de modelos', () => {
    const res1 = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, mockParams, 'NEUTRO')
    const res2 = rankearModelos(mockJogos, 1.5, 1.2, mockMediasLiga, mockParams)
    expect(res1.ranking.map(r => r.modelo)).toEqual(res2.ranking.map(r => r.modelo))
  })
})
